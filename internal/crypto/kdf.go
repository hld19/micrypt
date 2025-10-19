package crypto

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"errors"
	"fmt"
	"io"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/hkdf"
)

const (
	Argon2DefaultTime      = 3
	Argon2DefaultMemory    = 64 * 1024
	Argon2DefaultThreads   = 4
	keyMaterialLength      = 64
	passwordVerifierLength = 32
	passSeedXORLength      = 32
	SaltLength             = 32
	kdfInfoLabel           = "micrypt/v1/key-schedule"
	KDFMetadataVersion     = 1
	maxPIMIncrement        = 1000000
)

type KDFParams struct {
	Salt      []byte `json:"salt"`
	Time      uint32 `json:"time"`
	Memory    uint32 `json:"memory"`
	Threads   uint8  `json:"threads"`
	KeyLength uint32 `json:"key_length"`
}

type KDFMetadata struct {
	Version          int        `json:"version"`
	Params           *KDFParams `json:"params"`
	PasswordVerifier []byte     `json:"password_verifier"`
	PassSeedXOR      []byte     `json:"pass_seed_xor"`
	SeedSalt         []byte     `json:"seed_salt"`
	HKDFSalt         []byte     `json:"hkdf_salt"`
	KeyfileVerifier  []byte     `json:"keyfile_verifier,omitempty"`
	KeyfileSalt      []byte     `json:"keyfile_salt,omitempty"`
	PIM              uint32     `json:"pim,omitempty"`
}

type KeySchedule struct {
	MasterKey   []byte
	AuthKey     []byte
	MetadataKey []byte
}

func NewKDFParams(salt []byte) *KDFParams {
	return &KDFParams{
		Salt:      salt,
		Time:      Argon2DefaultTime,
		Memory:    Argon2DefaultMemory,
		Threads:   Argon2DefaultThreads,
		KeyLength: keyMaterialLength,
	}
}

func GenerateSalt() ([]byte, error) {
	return randomBytes(SaltLength)
}

func GenerateSaltWithEntropy(entropySeed []byte) ([]byte, error) {
	baseSalt, err := randomBytes(SaltLength)
	if err != nil {
		return nil, err
	}
	if len(entropySeed) == 0 {
		return baseSalt, nil
	}
	normalized := entropySeed
	if len(entropySeed) != SaltLength {
		hash := sha256.Sum256(entropySeed)
		normalized = hash[:]
	}
	h := sha256.New()
	h.Write(baseSalt)
	h.Write(normalized)
	hashed := h.Sum(nil)
	return hashed[:SaltLength], nil
}

func CreateKeySchedule(password string, keyfiles [][]byte, pim uint32, mnemonicSeed []byte, params *KDFParams) (*KeySchedule, *KDFMetadata, error) {
	if len(password) == 0 && len(keyfiles) == 0 {
		return nil, nil, errors.New("password or keyfile required")
	}
	if len(mnemonicSeed) == 0 {
		return nil, nil, errors.New("mnemonic seed cannot be empty")
	}
	if params == nil {
		return nil, nil, errors.New("KDF parameters cannot be nil")
	}
	if err := validateParams(params); err != nil {
		return nil, nil, err
	}

	combinedPassword, keyfileDigest, err := combinePasswordAndKeyfiles(password, keyfiles)
	if err != nil {
		return nil, nil, err
	}
	defer WipeBytes(combinedPassword)

	derivedParams := cloneParams(params)
	if pim > 0 {
		next, err := applyPIMIncrement(derivedParams.Time, pim)
		if err != nil {
			return nil, nil, err
		}
		derivedParams.Time = next
	}

	derived := argon2.IDKey(combinedPassword, derivedParams.Salt, derivedParams.Time, derivedParams.Memory, derivedParams.Threads, derivedParams.KeyLength)
	if len(derived) < passwordVerifierLength+passSeedXORLength {
		return nil, nil, errors.New("derived key material is too short")
	}

	passwordVerifier := make([]byte, passwordVerifierLength)
	copy(passwordVerifier, derived[:passwordVerifierLength])

	passKey := make([]byte, passSeedXORLength)
	copy(passKey, derived[passwordVerifierLength:passwordVerifierLength+passSeedXORLength])

	seedSalt, err := randomBytes(SaltLength)
	if err != nil {
		return nil, nil, err
	}

	hkdfSalt, err := randomBytes(SaltLength)
	if err != nil {
		return nil, nil, err
	}

	seedKey, err := deriveSeedKey(mnemonicSeed, seedSalt)
	if err != nil {
		return nil, nil, err
	}

	passSeedXOR := xorBytes(passKey, seedKey)

	keys, err := deriveKeySchedule(passKey, seedKey, hkdfSalt)
	if err != nil {
		WipeBytes(keyfileDigest)
		return nil, nil, err
	}
	lockKeySchedule(keys)

	var keyfileSalt []byte
	var keyfileVerifier []byte
	if keyfileDigest != nil {
		keyfileSalt, err = randomBytes(SaltLength)
		if err != nil {
			return nil, nil, err
		}
		keyfileVerifier = ComputeAuthMAC(keyfileSalt, keyfileDigest)
	}

	meta := &KDFMetadata{
		Version:          KDFMetadataVersion,
		Params:           cloneParams(params),
		PasswordVerifier: passwordVerifier,
		PassSeedXOR:      passSeedXOR,
		SeedSalt:         seedSalt,
		HKDFSalt:         hkdfSalt,
		KeyfileVerifier:  keyfileVerifier,
		KeyfileSalt:      keyfileSalt,
		PIM:              pim,
	}

	WipeBytes(derived)
	WipeBytes(passKey)
	WipeBytes(seedKey)
	WipeBytes(keyfileDigest)

	return keys, meta, nil
}

func DeriveKeyScheduleFromPassword(password string, keyfiles [][]byte, pim uint32, meta *KDFMetadata) (*KeySchedule, error) {
	if err := validateMetadata(meta); err != nil {
		return nil, err
	}
	if len(password) == 0 && len(keyfiles) == 0 {
		return nil, errors.New("password or keyfile required")
	}

	combinedPassword, keyfileDigest, err := combinePasswordAndKeyfiles(password, keyfiles)
	if err != nil {
		return nil, err
	}
	defer WipeBytes(combinedPassword)

	effectivePIM := meta.PIM
	if pim != 0 {
		effectivePIM = pim
	}

	derivedParams := cloneParams(meta.Params)
	if effectivePIM > 0 {
		next, err := applyPIMIncrement(derivedParams.Time, effectivePIM)
		if err != nil {
			return nil, err
		}
		derivedParams.Time = next
	}

	derived := argon2.IDKey(combinedPassword, derivedParams.Salt, derivedParams.Time, derivedParams.Memory, derivedParams.Threads, derivedParams.KeyLength)
	if len(derived) < passwordVerifierLength+passSeedXORLength {
		return nil, errors.New("derived key material is too short")
	}

	if subtle.ConstantTimeCompare(derived[:passwordVerifierLength], meta.PasswordVerifier) != 1 {
		WipeBytes(derived)
		WipeBytes(keyfileDigest)
		return nil, errors.New("invalid password")
	}

	passKey := make([]byte, passSeedXORLength)
	copy(passKey, derived[passwordVerifierLength:passwordVerifierLength+passSeedXORLength])
	seedKey := xorBytes(passKey, meta.PassSeedXOR)

	if len(meta.KeyfileVerifier) > 0 {
		if keyfileDigest == nil {
			WipeBytes(derived)
			WipeBytes(passKey)
			WipeBytes(seedKey)
			return nil, errors.New("missing keyfiles")
		}
		expected := ComputeAuthMAC(meta.KeyfileSalt, keyfileDigest)
		if subtle.ConstantTimeCompare(expected, meta.KeyfileVerifier) != 1 {
			WipeBytes(expected)
			WipeBytes(derived)
			WipeBytes(passKey)
			WipeBytes(seedKey)
			WipeBytes(keyfileDigest)
			return nil, errors.New("invalid keyfiles")
		}
		WipeBytes(expected)
	} else if keyfileDigest != nil {
		WipeBytes(derived)
		WipeBytes(passKey)
		WipeBytes(seedKey)
		WipeBytes(keyfileDigest)
		return nil, errors.New("unexpected keyfiles")
	}

	keys, err := deriveKeySchedule(passKey, seedKey, meta.HKDFSalt)
	if err != nil {
		WipeBytes(derived)
		WipeBytes(passKey)
		WipeBytes(seedKey)
		WipeBytes(keyfileDigest)
		return nil, err
	}
	lockKeySchedule(keys)

	WipeBytes(derived)
	WipeBytes(passKey)
	WipeBytes(seedKey)
	WipeBytes(keyfileDigest)

	return keys, nil
}

func DeriveKeyScheduleFromSeed(mnemonicSeed []byte, meta *KDFMetadata) (*KeySchedule, error) {
	if err := validateMetadata(meta); err != nil {
		return nil, err
	}
	if len(mnemonicSeed) == 0 {
		return nil, errors.New("mnemonic seed cannot be empty")
	}

	seedKey, err := deriveSeedKey(mnemonicSeed, meta.SeedSalt)
	if err != nil {
		return nil, err
	}

	passKey := xorBytes(seedKey, meta.PassSeedXOR)
	keys, err := deriveKeySchedule(passKey, seedKey, meta.HKDFSalt)
	if err != nil {
		WipeBytes(seedKey)
		WipeBytes(passKey)
		return nil, err
	}

	WipeBytes(seedKey)
	WipeBytes(passKey)
	lockKeySchedule(keys)
	return keys, nil
}

func ComputeAuthMAC(authKey []byte, data []byte) []byte {
	mac := hmac.New(sha256.New, authKey)
	mac.Write(data)
	return mac.Sum(nil)
}

func VerifyAuthMAC(authKey []byte, data []byte, expected []byte) bool {
	actual := ComputeAuthMAC(authKey, data)
	if len(actual) != len(expected) {
		return false
	}
	return subtle.ConstantTimeCompare(actual, expected) == 1
}

func deriveSeedKey(seed []byte, salt []byte) ([]byte, error) {
	if len(salt) == 0 {
		return nil, errors.New("seed salt cannot be empty")
	}

	reader := hkdf.New(sha256.New, seed, salt, []byte(kdfInfoLabel+"/seed"))
	key := make([]byte, passSeedXORLength)
	if _, err := io.ReadFull(reader, key); err != nil {
		return nil, fmt.Errorf("failed to derive seed key: %w", err)
	}
	return key, nil
}

func deriveKeySchedule(passKey, seedKey, hkdfSalt []byte) (*KeySchedule, error) {
	if len(passKey) != passSeedXORLength || len(seedKey) != passSeedXORLength {
		return nil, errors.New("invalid key material length")
	}
	if len(hkdfSalt) == 0 {
		return nil, errors.New("HKDF salt cannot be empty")
	}

	ikm := make([]byte, 0, len(passKey)+len(seedKey))
	ikm = append(ikm, passKey...)
	ikm = append(ikm, seedKey...)

	masterKey, err := deriveHKDFKey(ikm, hkdfSalt, kdfInfoLabel+"/master")
	if err != nil {
		WipeBytes(ikm)
		return nil, err
	}
	authKey, err := deriveHKDFKey(ikm, hkdfSalt, kdfInfoLabel+"/auth")
	if err != nil {
		WipeBytes(ikm)
		WipeBytes(masterKey)
		return nil, err
	}
	metadataKey, err := deriveHKDFKey(ikm, hkdfSalt, kdfInfoLabel+"/metadata")
	if err != nil {
		WipeBytes(ikm)
		WipeBytes(masterKey)
		WipeBytes(authKey)
		return nil, err
	}

	WipeBytes(ikm)

	return &KeySchedule{
		MasterKey:   masterKey,
		AuthKey:     authKey,
		MetadataKey: metadataKey,
	}, nil
}

func deriveHKDFKey(ikm, salt []byte, info string) ([]byte, error) {
	reader := hkdf.New(sha256.New, ikm, salt, []byte(info))
	key := make([]byte, passSeedXORLength)
	if _, err := io.ReadFull(reader, key); err != nil {
		return nil, fmt.Errorf("failed to derive hkdf key: %w", err)
	}
	return key, nil
}

func applyPIMIncrement(base, pim uint32) (uint32, error) {
	if pim == 0 {
		return base, nil
	}
	if pim > maxPIMIncrement {
		return 0, fmt.Errorf("pim %d exceeds maximum %d", pim, maxPIMIncrement)
	}
	limit := ^uint32(0) - base
	if pim > limit {
		return 0, fmt.Errorf("pim %d causes iteration overflow", pim)
	}
	return base + pim, nil
}

func validateParams(params *KDFParams) error {
	if params.Salt == nil || len(params.Salt) != SaltLength {
		return errors.New("invalid salt length")
	}
	if params.Time == 0 || params.Memory == 0 || params.Threads == 0 {
		return errors.New("invalid KDF parameters")
	}
	if params.KeyLength < passwordVerifierLength+passSeedXORLength {
		return errors.New("key length must be at least 64 bytes")
	}
	return nil
}

func validateMetadata(meta *KDFMetadata) error {
	if meta == nil {
		return errors.New("KDF metadata cannot be nil")
	}
	if meta.Params == nil {
		return errors.New("KDF params cannot be nil")
	}
	if err := validateParams(meta.Params); err != nil {
		return err
	}
	if len(meta.PasswordVerifier) != passwordVerifierLength {
		return errors.New("invalid password verifier length")
	}
	if len(meta.PassSeedXOR) != passSeedXORLength {
		return errors.New("invalid pass-seed xor length")
	}
	if len(meta.SeedSalt) != SaltLength {
		return errors.New("invalid seed salt length")
	}
	if len(meta.HKDFSalt) != SaltLength {
		return errors.New("invalid hkdf salt length")
	}
	if len(meta.KeyfileVerifier) > 0 && len(meta.KeyfileSalt) != SaltLength {
		return errors.New("invalid keyfile salt length")
	}
	return nil
}

func (ks *KeySchedule) Wipe() {
	if ks == nil {
		return
	}
	unlockKeySchedule(ks)
	WipeBytes(ks.MasterKey)
	WipeBytes(ks.AuthKey)
	WipeBytes(ks.MetadataKey)
}

func randomBytes(length int) ([]byte, error) {
	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return nil, err
	}
	return buf, nil
}

func cloneParams(params *KDFParams) *KDFParams {
	if params == nil {
		return nil
	}
	c := *params
	if params.Salt != nil {
		c.Salt = append([]byte(nil), params.Salt...)
	}
	return &c
}

func xorBytes(a, b []byte) []byte {
	if len(a) != len(b) {
		return nil
	}
	out := make([]byte, len(a))
	for i := range a {
		out[i] = a[i] ^ b[i]
	}
	return out
}

func lockKeySchedule(keys *KeySchedule) {
	if keys == nil {
		return
	}
	LockBytes(keys.MasterKey)
	LockBytes(keys.AuthKey)
	LockBytes(keys.MetadataKey)
}

func unlockKeySchedule(keys *KeySchedule) {
	if keys == nil {
		return
	}
	UnlockBytes(keys.MasterKey)
	UnlockBytes(keys.AuthKey)
	UnlockBytes(keys.MetadataKey)
}

func combinePasswordAndKeyfiles(password string, keyfiles [][]byte) ([]byte, []byte, error) {
	pwd := []byte(password)
	defer WipeBytes(pwd)
	combined := append([]byte(nil), pwd...)
	if len(keyfiles) == 0 {
		return combined, nil, nil
	}
	hash := sha256.New()
	for _, keyfile := range keyfiles {
		if len(keyfile) == 0 {
			continue
		}
		if _, err := hash.Write(keyfile); err != nil {
			return nil, nil, err
		}
	}
	digest := hash.Sum(nil)
	combined = append(combined, digest...)
	return combined, digest, nil
}
func ComputeAuthMACStream(authKey []byte, reader io.Reader) ([]byte, error) {
	mac := hmac.New(sha256.New, authKey)
	buf := make([]byte, 64*1024)

	for {
		n, err := reader.Read(buf)
		if n > 0 {
			if _, werr := mac.Write(buf[:n]); werr != nil {
				return nil, werr
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
	}

	return mac.Sum(nil), nil
}
