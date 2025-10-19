package vault

import (
	"bytes"
	"crypto/rand"
	"crypto/subtle"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"time"

	"micryptlol/internal/bip39"
	"micryptlol/internal/crypto"
)

const (
	VaultVersion     = 2
	HeaderMagic      = "MICRYPT1"
	containerMagic   = "MICRYPTC"
	containerVersion = 1

	metadataMagic   = "MCMETA2"
	metadataVersion = 2
	maxMetadataSize = 1 << 20
	maxIndexSize    = 1 << 24
)

type metadataFile struct {
	Magic             string          `json:"magic"`
	Version           int             `json:"version"`
	Auth              json.RawMessage `json:"auth"`
	AuthMAC           []byte          `json:"auth_mac"`
	EncryptedHeader   []byte          `json:"encrypted_header"`
	EncryptedMnemonic []byte          `json:"encrypted_mnemonic,omitempty"`
}

type VaultHeader struct {
	Magic       string
	Version     int
	CascadeMode crypto.CascadeMode
	CreatedAt   time.Time
	ModifiedAt  time.Time
}

type FileEntry struct {
	EncryptedName string
	OriginalName  string
	Size          int64
	EncryptedAt   time.Time
	CipherMAC     []byte
}

type VaultIndex struct {
	Files []FileEntry
}

type Vault struct {
	path           string
	header         *VaultHeader
	cipher         *crypto.CascadeCipher
	metadataCipher *crypto.Cipher
	authKey        []byte
	index          *VaultIndex
	unlocked       bool
	kdfMeta        *crypto.KDFMetadata
	fileData       map[string][]byte
	storedMnemonic []string
}

type VaultCreationOptions struct {
	Keyfiles [][]byte
	PIM      uint32
	Entropy  []byte
}

type UnlockOptions struct {
	Keyfiles [][]byte
	PIM      uint32
}

func OpenVaultFromMnemonicSeed(path string, mnemonicSeed []byte) (*Vault, error) {
	if len(mnemonicSeed) == 0 {
		return nil, errors.New("mnemonic seed required")
	}
	metaFile, encryptedIndex, blobs, err := loadContainerFile(path)
	if err != nil {
		return nil, err
	}

	var kdfMeta crypto.KDFMetadata
	if err := json.Unmarshal(metaFile.Auth, &kdfMeta); err != nil {
		return nil, errors.New("corrupted vault authentication data")
	}

	keySchedule, err := crypto.DeriveKeyScheduleFromSeed(mnemonicSeed, &kdfMeta)
	if err != nil {
		return nil, err
	}

	if !crypto.VerifyAuthMAC(keySchedule.AuthKey, metaFile.Auth, metaFile.AuthMAC) {
		keySchedule.Wipe()
		return nil, errors.New("vault metadata authentication failed")
	}

	metadataCipher, err := crypto.NewCipher(crypto.AES256GCM, keySchedule.MetadataKey)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}

	metaVersion := metaFile.Version
	if metaVersion == 0 {
		metaVersion = 1
	}
	if metaVersion != 1 && metaVersion != metadataVersion {
		keySchedule.Wipe()
		return nil, errors.New("unsupported vault metadata version")
	}

	storedMnemonic, err := decryptStoredMnemonic(metaFile, metadataCipher)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}

	headerBytes, err := metadataCipher.Decrypt(metaFile.EncryptedHeader)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}

	var header VaultHeader
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		crypto.WipeBytes(headerBytes)
		keySchedule.Wipe()
		return nil, err
	}
	crypto.WipeBytes(headerBytes)

	cascadeCipher, err := crypto.NewCascadeCipher(header.CascadeMode, keySchedule.MasterKey)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}

	authKey := append([]byte(nil), keySchedule.AuthKey...)

	vault := &Vault{
		path:           path,
		header:         &header,
		cipher:         cascadeCipher,
		metadataCipher: metadataCipher,
		authKey:        authKey,
		unlocked:       true,
		kdfMeta:        &kdfMeta,
		index:          &VaultIndex{Files: []FileEntry{}},
		fileData:       make(map[string][]byte),
	}

	decryptedIndex, err := metadataCipher.Decrypt(encryptedIndex)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}

	var index VaultIndex
	if err := json.Unmarshal(decryptedIndex, &index); err != nil {
		keySchedule.Wipe()
		crypto.WipeBytes(decryptedIndex)
		return nil, err
	}
	crypto.WipeBytes(decryptedIndex)

	if len(blobs) != len(index.Files) {
		keySchedule.Wipe()
		return nil, errors.New("vault container is inconsistent")
	}

	vault.index = &index
	vault.SetStoredMnemonic(storedMnemonic)

	for i, entry := range index.Files {
		cipherCopy := append([]byte(nil), blobs[i]...)
		mac := crypto.ComputeAuthMAC(vault.authKey, cipherCopy)
		if len(entry.CipherMAC) == 0 || subtle.ConstantTimeCompare(mac, entry.CipherMAC) != 1 {
			crypto.WipeBytes(mac)
			keySchedule.Wipe()
			return nil, errors.New("ciphertext integrity verification failed")
		}
		crypto.WipeBytes(mac)
		vault.fileData[entry.EncryptedName] = cipherCopy
	}
	keySchedule.Wipe()

	return vault, nil
}

func CreateVault(path string, password string, cascadeMode crypto.CascadeMode) (*Vault, *bip39.Mnemonic, error) {
	return CreateVaultWithEntropyOptions(path, password, cascadeMode, nil, nil)
}

func CreateVaultWithEntropy(path string, password string, cascadeMode crypto.CascadeMode, entropySeed []byte) (*Vault, *bip39.Mnemonic, error) {
	return CreateVaultWithEntropyOptions(path, password, cascadeMode, entropySeed, nil)
}

func CreateVaultWithEntropyOptions(path string, password string, cascadeMode crypto.CascadeMode, entropySeed []byte, options *VaultCreationOptions) (*Vault, *bip39.Mnemonic, error) {
	var opts VaultCreationOptions
	if options != nil {
		opts = *options
	}
	if len(opts.Entropy) == 0 && len(entropySeed) > 0 {
		opts.Entropy = entropySeed
	}
	defer func() {
		for _, kf := range opts.Keyfiles {
			crypto.WipeBytes(kf)
		}
		if options != nil && len(options.Entropy) > 0 {
			crypto.WipeBytes(options.Entropy)
			options.Entropy = nil
		}
	}()
	if len(password) == 0 {
		if len(opts.Keyfiles) == 0 {
			return nil, nil, errors.New("password must be at least 8 characters or keyfiles required")
		}
	} else if len(password) < 8 {
		return nil, nil, errors.New("password must be at least 8 characters")
	}
	containerPath, err := resolveCreatePath(path)
	if err != nil {
		return nil, nil, err
	}

	saltInput := append([]byte(nil), opts.Entropy...)
	passwordSalt, err := crypto.GenerateSaltWithEntropy(saltInput)
	if err != nil {
		crypto.WipeBytes(saltInput)
		return nil, nil, err
	}
	crypto.WipeBytes(saltInput)

	kdfParams := crypto.NewKDFParams(passwordSalt)

	mnemonic, err := bip39.GenerateMnemonic(bip39.Mnemonic12Words)
	if err != nil {
		return nil, nil, err
	}

	keySchedule, kdfMeta, err := crypto.CreateKeySchedule(password, opts.Keyfiles, opts.PIM, mnemonic.Seed, kdfParams)
	if err != nil {
		return nil, nil, err
	}

	cascadeCipher, err := crypto.NewCascadeCipher(cascadeMode, keySchedule.MasterKey)
	if err != nil {
		keySchedule.Wipe()
		return nil, nil, err
	}

	metadataCipher, err := crypto.NewCipher(crypto.AES256GCM, keySchedule.MetadataKey)
	if err != nil {
		keySchedule.Wipe()
		return nil, nil, err
	}

	authKey := append([]byte(nil), keySchedule.AuthKey...)

	header := &VaultHeader{
		Magic:       HeaderMagic,
		Version:     VaultVersion,
		CascadeMode: cascadeMode,
		CreatedAt:   time.Now(),
		ModifiedAt:  time.Now(),
	}

	vault := &Vault{
		path:           containerPath,
		header:         header,
		cipher:         cascadeCipher,
		metadataCipher: metadataCipher,
		authKey:        authKey,
		index:          &VaultIndex{Files: []FileEntry{}},
		unlocked:       true,
		kdfMeta:        kdfMeta,
		fileData:       make(map[string][]byte),
	}

	vault.SetStoredMnemonic(mnemonic.Words)

	if err := vault.saveMetadata(); err != nil {
		keySchedule.Wipe()
		vault.Lock()
		return nil, nil, err
	}

	keySchedule.Wipe()

	return vault, mnemonic, nil
}

func OpenVault(path string, password string) (*Vault, error) {
	return OpenVaultWithOptions(path, password, nil)
}

func OpenVaultWithOptions(path string, password string, options *UnlockOptions) (*Vault, error) {
	var opts UnlockOptions
	if options != nil {
		opts = *options
	}
	defer func() {
		for _, kf := range opts.Keyfiles {
			crypto.WipeBytes(kf)
		}
	}()
	if len(password) == 0 && len(opts.Keyfiles) == 0 {
		return nil, errors.New("password or keyfile required")
	}
	if len(path) == 0 {
		return nil, errors.New("vault path cannot be empty")
	}

	metaFile, encryptedIndex, blobs, err := loadContainerFile(path)
	if err != nil {
		return nil, err
	}

	var kdfMeta crypto.KDFMetadata
	if err := json.Unmarshal(metaFile.Auth, &kdfMeta); err != nil {
		return nil, errors.New("corrupted vault authentication data")
	}

	keySchedule, err := crypto.DeriveKeyScheduleFromPassword(password, opts.Keyfiles, opts.PIM, &kdfMeta)
	if err != nil {
		return nil, err
	}

	if !crypto.VerifyAuthMAC(keySchedule.AuthKey, metaFile.Auth, metaFile.AuthMAC) {
		keySchedule.Wipe()
		return nil, errors.New("vault metadata authentication failed")
	}

	metadataCipher, err := crypto.NewCipher(crypto.AES256GCM, keySchedule.MetadataKey)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}

	headerBytes, err := metadataCipher.Decrypt(metaFile.EncryptedHeader)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}

	var header VaultHeader
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		crypto.WipeBytes(headerBytes)
		keySchedule.Wipe()
		return nil, err
	}
	crypto.WipeBytes(headerBytes)

	cascadeCipher, err := crypto.NewCascadeCipher(header.CascadeMode, keySchedule.MasterKey)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}

	authKey := append([]byte(nil), keySchedule.AuthKey...)

	vault := &Vault{
		path:           path,
		header:         &header,
		cipher:         cascadeCipher,
		metadataCipher: metadataCipher,
		authKey:        authKey,
		unlocked:       true,
		kdfMeta:        &kdfMeta,
		index:          &VaultIndex{Files: []FileEntry{}},
		fileData:       make(map[string][]byte),
	}

	decryptedIndex, err := metadataCipher.Decrypt(encryptedIndex)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}

	var index VaultIndex
	if err := json.Unmarshal(decryptedIndex, &index); err != nil {
		keySchedule.Wipe()
		crypto.WipeBytes(decryptedIndex)
		return nil, err
	}

	crypto.WipeBytes(decryptedIndex)

	if len(blobs) != len(index.Files) {
		keySchedule.Wipe()
		return nil, errors.New("vault container is inconsistent")
	}

	vault.index = &index
	storedMnemonic, err := decryptStoredMnemonic(metaFile, metadataCipher)
	if err != nil {
		keySchedule.Wipe()
		return nil, err
	}
	vault.SetStoredMnemonic(storedMnemonic)

	for i, entry := range index.Files {
		cipherCopy := append([]byte(nil), blobs[i]...)
		mac := crypto.ComputeAuthMAC(vault.authKey, cipherCopy)
		if len(entry.CipherMAC) == 0 || subtle.ConstantTimeCompare(mac, entry.CipherMAC) != 1 {
			crypto.WipeBytes(mac)
			keySchedule.Wipe()
			return nil, errors.New("ciphertext integrity verification failed")
		}
		crypto.WipeBytes(mac)
		vault.fileData[entry.EncryptedName] = cipherCopy
	}

	keySchedule.Wipe()

	return vault, nil
}

func (v *Vault) EncryptFile(sourcePath string) (*FileEntry, error) {
	if !v.unlocked {
		return nil, errors.New("vault is locked")
	}
	if len(sourcePath) == 0 {
		return nil, errors.New("source path cannot be empty")
	}

	sourceFile, err := os.Open(sourcePath)
	if err != nil {
		return nil, err
	}
	defer sourceFile.Close()

	stat, err := sourceFile.Stat()
	if err != nil {
		return nil, err
	}
	if stat.IsDir() {
		return nil, errors.New("cannot encrypt directories")
	}

	if _, err := sourceFile.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}

	encryptedName, err := v.generateEncryptedFilename()
	if err != nil {
		return nil, err
	}

	var cipherBuf bytes.Buffer
	if err := v.cipher.EncryptStream(sourceFile, &cipherBuf); err != nil {
		return nil, err
	}
	cipherData := append([]byte(nil), cipherBuf.Bytes()...)

	mac := crypto.ComputeAuthMAC(v.authKey, cipherData)
	macCopy := append([]byte(nil), mac...)
	crypto.WipeBytes(mac)

	entry := &FileEntry{
		EncryptedName: encryptedName,
		OriginalName:  filepath.Base(sourcePath),
		Size:          stat.Size(),
		EncryptedAt:   time.Now(),
		CipherMAC:     macCopy,
	}

	v.index.Files = append(v.index.Files, *entry)
	v.fileData[encryptedName] = cipherData
	v.header.ModifiedAt = time.Now()

	if err := v.saveMetadata(); err != nil {
		delete(v.fileData, encryptedName)
		v.index.Files = v.index.Files[:len(v.index.Files)-1]
		crypto.WipeBytes(cipherData)
		crypto.WipeBytes(macCopy)
		return nil, err
	}

	return entry, nil
}

func (v *Vault) DecryptFile(encryptedName string, destPath string) error {
	if !v.unlocked {
		return errors.New("vault is locked")
	}
	if len(encryptedName) == 0 {
		return errors.New("encrypted filename cannot be empty")
	}
	if len(destPath) == 0 {
		return errors.New("destination path cannot be empty")
	}

	entry := v.getIndexEntry(encryptedName)
	if entry == nil {
		return errors.New("file not found in vault index")
	}
	if len(entry.CipherMAC) == 0 {
		return errors.New("missing integrity data for encrypted file")
	}

	cipherData, ok := v.fileData[encryptedName]
	if !ok {
		return errors.New("vault data missing for requested file")
	}

	mac := crypto.ComputeAuthMAC(v.authKey, cipherData)
	if subtle.ConstantTimeCompare(mac, entry.CipherMAC) != 1 {
		crypto.WipeBytes(mac)
		return errors.New("ciphertext integrity check failed")
	}
	crypto.WipeBytes(mac)

	if _, err := os.Stat(destPath); err == nil {
		return errors.New("destination file already exists")
	}

	destFile, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY|os.O_EXCL, 0o600)
	if err != nil {
		return err
	}

	cipherReader := bytes.NewReader(cipherData)
	if err := v.cipher.DecryptStream(cipherReader, destFile); err != nil {
		destFile.Close()
		os.Remove(destPath)
		return err
	}

	if err := destFile.Close(); err != nil {
		os.Remove(destPath)
		return err
	}

	return nil
}

func (v *Vault) ListFiles() []FileEntry {
	if !v.unlocked || v.index == nil {
		return []FileEntry{}
	}
	return v.index.Files
}

func (v *Vault) DeleteFile(encryptedName string) error {
	if !v.unlocked {
		return errors.New("vault is locked")
	}
	if len(encryptedName) == 0 {
		return errors.New("encrypted filename cannot be empty")
	}

	var found bool
	newFiles := make([]FileEntry, 0, len(v.index.Files))
	for _, file := range v.index.Files {
		if file.EncryptedName == encryptedName {
			found = true
			continue
		}
		newFiles = append(newFiles, file)
	}
	if !found {
		return errors.New("file not found in vault index")
	}

	data, ok := v.fileData[encryptedName]
	if !ok {
		return errors.New("vault data missing for requested file")
	}
	crypto.WipeBytes(data)
	delete(v.fileData, encryptedName)

	v.index.Files = newFiles
	v.header.ModifiedAt = time.Now()

	return v.saveMetadata()
}

func (v *Vault) Lock() {
	v.unlocked = false
	if v.cipher != nil {
		v.cipher = nil
	}
	if v.metadataCipher != nil {
		v.metadataCipher = nil
	}
	if v.authKey != nil {
		crypto.WipeBytes(v.authKey)
		v.authKey = nil
	}
	v.SetStoredMnemonic(nil)
	for k, data := range v.fileData {
		crypto.WipeBytes(data)
		delete(v.fileData, k)
	}
	v.fileData = nil
}

func (v *Vault) VerifyPassword(password string, options *UnlockOptions) error {
	if !v.unlocked {
		return errors.New("vault is locked")
	}
	var opts UnlockOptions
	if options != nil {
		opts = *options
	}
	if len(password) == 0 && len(opts.Keyfiles) == 0 {
		return errors.New("password or keyfile required")
	}
	defer func() {
		for _, kf := range opts.Keyfiles {
			crypto.WipeBytes(kf)
		}
	}()

	keySchedule, err := crypto.DeriveKeyScheduleFromPassword(password, opts.Keyfiles, opts.PIM, v.kdfMeta)
	if err != nil {
		return err
	}
	keySchedule.Wipe()
	return nil
}

func (v *Vault) IsUnlocked() bool {
	return v.unlocked
}

func (v *Vault) GetPath() string {
	return v.path
}

func (v *Vault) SetStoredMnemonic(words []string) {
	if v == nil {
		return
	}
	for i := range v.storedMnemonic {
		v.storedMnemonic[i] = ""
	}
	if len(words) == 0 {
		v.storedMnemonic = nil
		return
	}
	v.storedMnemonic = append([]string(nil), words...)
}

func (v *Vault) StoredMnemonic() []string {
	if v == nil || len(v.storedMnemonic) == 0 {
		return nil
	}
	out := make([]string, len(v.storedMnemonic))
	copy(out, v.storedMnemonic)
	return out
}

func (v *Vault) UpdateStoredMnemonic(words []string) error {
	if v == nil {
		return errors.New("vault is nil")
	}
	v.SetStoredMnemonic(words)
	return v.saveMetadata()
}

func (v *Vault) saveMetadata() error {
	if !v.unlocked {
		return errors.New("vault is locked")
	}
	if v.metadataCipher == nil {
		return errors.New("metadata cipher is not initialized")
	}

	var encryptedMnemonic []byte
	if len(v.storedMnemonic) > 0 {
		mnemonicData, err := json.Marshal(v.storedMnemonic)
		if err != nil {
			return err
		}
		cipherMnemonic, err := v.metadataCipher.Encrypt(mnemonicData)
		crypto.WipeBytes(mnemonicData)
		if err != nil {
			return err
		}
		encryptedMnemonic = cipherMnemonic
	}

	authBytes, err := json.Marshal(v.kdfMeta)
	if err != nil {
		return err
	}

	mac := crypto.ComputeAuthMAC(v.authKey, authBytes)

	headerBytes, err := json.Marshal(v.header)
	if err != nil {
		return err
	}

	encryptedHeader, err := v.metadataCipher.Encrypt(headerBytes)
	if err != nil {
		return err
	}

	meta := metadataFile{
		Magic:             metadataMagic,
		Version:           metadataVersion,
		Auth:              json.RawMessage(authBytes),
		AuthMAC:           mac,
		EncryptedHeader:   encryptedHeader,
		EncryptedMnemonic: encryptedMnemonic,
	}

	metaBytes, err := json.Marshal(meta)
	if err != nil {
		return err
	}

	indexData, err := json.Marshal(v.index)
	if err != nil {
		crypto.WipeBytes(authBytes)
		crypto.WipeBytes(headerBytes)
		crypto.WipeBytes(metaBytes)
		return err
	}

	encryptedIndex, err := v.metadataCipher.Encrypt(indexData)
	if err != nil {
		crypto.WipeBytes(authBytes)
		crypto.WipeBytes(headerBytes)
		crypto.WipeBytes(metaBytes)
		crypto.WipeBytes(indexData)
		return err
	}

	if len(v.index.Files) != len(v.fileData) {
		crypto.WipeBytes(authBytes)
		crypto.WipeBytes(headerBytes)
		crypto.WipeBytes(metaBytes)
		crypto.WipeBytes(indexData)
		crypto.WipeBytes(encryptedIndex)
		return errors.New("vault state is inconsistent")
	}

	buf := bytes.NewBuffer(make([]byte, 0, len(metaBytes)+len(encryptedIndex)+1024))
	buf.WriteString(containerMagic)
	if err := binary.Write(buf, binary.BigEndian, uint32(containerVersion)); err != nil {
		return err
	}
	if err := binary.Write(buf, binary.BigEndian, uint32(len(metaBytes))); err != nil {
		return err
	}
	if _, err := buf.Write(metaBytes); err != nil {
		return err
	}
	if err := binary.Write(buf, binary.BigEndian, uint32(len(encryptedIndex))); err != nil {
		return err
	}
	if _, err := buf.Write(encryptedIndex); err != nil {
		return err
	}

	fileCount := uint32(len(v.index.Files))
	if err := binary.Write(buf, binary.BigEndian, fileCount); err != nil {
		return err
	}

	for _, file := range v.index.Files {
		data, ok := v.fileData[file.EncryptedName]
		if !ok {
			return errors.New("missing encrypted data for file entry")
		}
		if err := binary.Write(buf, binary.BigEndian, uint64(len(data))); err != nil {
			return err
		}
		if _, err := buf.Write(data); err != nil {
			return err
		}
	}

	if err := writeFileAtomic(v.path, buf.Bytes(), 0o600); err != nil {
		return err
	}

	crypto.WipeBytes(indexData)
	crypto.WipeBytes(metaBytes)
	crypto.WipeBytes(headerBytes)
	crypto.WipeBytes(authBytes)
	crypto.WipeBytes(encryptedIndex)

	return nil
}

func (v *Vault) generateEncryptedFilename() (string, error) {
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	timestamp := time.Now().UnixNano()
	buf := new(bytes.Buffer)
	if err := binary.Write(buf, binary.BigEndian, timestamp); err != nil {
		return "", err
	}

	combined := append(buf.Bytes(), randomBytes...)

	nameBytes, err := v.metadataCipher.Encrypt(combined)
	if err != nil {
		return "", err
	}

	return encodeFilename(nameBytes), nil
}

func encodeFilename(data []byte) string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, 32)
	for i := 0; i < 32 && i < len(data); i++ {
		result[i] = chars[int(data[i])%len(chars)]
	}
	return string(result) + ".enc"
}

func VaultExists(path string) bool {
	file, err := os.Open(path)
	if err != nil {
		return false
	}
	defer file.Close()

	magic := make([]byte, len(containerMagic))
	if _, err := io.ReadFull(file, magic); err != nil {
		return false
	}
	return string(magic) == containerMagic
}

func (v *Vault) GetOriginalFilename(encryptedName string) string {
	if v.index == nil {
		return encryptedName
	}
	for _, file := range v.index.Files {
		if file.EncryptedName == encryptedName {
			return file.OriginalName
		}
	}
	return encryptedName
}

func (v *Vault) getIndexEntry(encryptedName string) *FileEntry {
	if v.index == nil {
		return nil
	}
	for i := range v.index.Files {
		if v.index.Files[i].EncryptedName == encryptedName {
			return &v.index.Files[i]
		}
	}
	return nil
}

func generateContainerFilename() (string, error) {
	randomBytes := make([]byte, 12)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(randomBytes) + ".mvault", nil
}

func resolveCreatePath(base string) (string, error) {
	if len(base) == 0 {
		return "", errors.New("vault path cannot be empty")
	}

	info, err := os.Stat(base)
	switch {
	case err == nil:
		if info.IsDir() {
			if mkErr := os.Chmod(base, 0o700); mkErr != nil && !os.IsPermission(mkErr) {
				return "", mkErr
			}
			for i := 0; i < 5; i++ {
				name, genErr := generateContainerFilename()
				if genErr != nil {
					return "", genErr
				}
				candidate := filepath.Join(base, name)
				if _, statErr := os.Stat(candidate); os.IsNotExist(statErr) {
					return candidate, nil
				}
			}
			return "", errors.New("failed to generate unique vault file name")
		}
		return "", errors.New("a vault already exists at the specified path")
	case os.IsNotExist(err):
		dir := filepath.Dir(base)
		if dir == "" || dir == "." {
			dir = "."
		}
		if mkErr := os.MkdirAll(dir, 0o700); mkErr != nil {
			return "", mkErr
		}
		if _, statErr := os.Stat(base); statErr == nil {
			return "", errors.New("a vault already exists at the specified path")
		}
		return base, nil
	default:
		return "", err
	}
}

func ensureVaultFile(path string) error {
	if len(path) == 0 {
		return errors.New("vault path cannot be empty")
	}
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return errors.New("expected vault file but found directory")
	}
	return nil
}

func loadContainerFile(path string) (*metadataFile, []byte, [][]byte, error) {
	if err := ensureVaultFile(path); err != nil {
		return nil, nil, nil, err
	}

	file, err := os.Open(path)
	if err != nil {
		return nil, nil, nil, err
	}
	defer file.Close()

	magic := make([]byte, len(containerMagic))
	if _, err := io.ReadFull(file, magic); err != nil {
		return nil, nil, nil, err
	}
	if string(magic) != containerMagic {
		return nil, nil, nil, errors.New("invalid vault container magic")
	}

	var version uint32
	if err := binary.Read(file, binary.BigEndian, &version); err != nil {
		return nil, nil, nil, err
	}
	if version != containerVersion {
		return nil, nil, nil, errors.New("unsupported vault container version")
	}

	var metaLen uint32
	if err := binary.Read(file, binary.BigEndian, &metaLen); err != nil {
		return nil, nil, nil, err
	}
	if metaLen == 0 || metaLen > maxMetadataSize {
		return nil, nil, nil, errors.New("vault metadata section too large")
	}
	metaBytes := make([]byte, metaLen)
	if _, err := io.ReadFull(file, metaBytes); err != nil {
		return nil, nil, nil, err
	}

	var indexLen uint32
	if err := binary.Read(file, binary.BigEndian, &indexLen); err != nil {
		return nil, nil, nil, err
	}
	if indexLen == 0 || indexLen > maxIndexSize {
		return nil, nil, nil, errors.New("vault index section too large")
	}
	encryptedIndex := make([]byte, indexLen)
	if _, err := io.ReadFull(file, encryptedIndex); err != nil {
		return nil, nil, nil, err
	}

	var fileCount uint32
	if err := binary.Read(file, binary.BigEndian, &fileCount); err != nil {
		return nil, nil, nil, err
	}

	blobs := make([][]byte, 0, fileCount)
	for i := uint32(0); i < fileCount; i++ {
		var blobLen uint64
		if err := binary.Read(file, binary.BigEndian, &blobLen); err != nil {
			return nil, nil, nil, err
		}
		if blobLen == 0 {
			blobs = append(blobs, []byte{})
			continue
		}
		if blobLen > (1 << 37) { // ~128 GiB guard
			return nil, nil, nil, errors.New("vault container corrupted: blob too large")
		}
		data := make([]byte, blobLen)
		if _, err := io.ReadFull(file, data); err != nil {
			return nil, nil, nil, err
		}
		blobs = append(blobs, data)
	}

	var meta metadataFile
	if err := json.Unmarshal(metaBytes, &meta); err != nil {
		return nil, nil, nil, errors.New("corrupted vault metadata")
	}

	return &meta, encryptedIndex, blobs, nil
}

func writeFileAtomic(path string, data []byte, perm os.FileMode) error {
	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".tmp-*")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Chmod(perm); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmp.Name(), path)
}

func readFileWithBackup(primary, backup string) ([]byte, error) {
	data, err := os.ReadFile(primary)
	if err == nil && len(data) > 0 {
		return data, nil
	}
	if backup == "" {
		return data, err
	}
	return os.ReadFile(backup)
}

func decryptStoredMnemonic(meta *metadataFile, cipher *crypto.Cipher) ([]string, error) {
	if meta == nil || cipher == nil || len(meta.EncryptedMnemonic) == 0 {
		return nil, nil
	}
	decrypted, err := cipher.Decrypt(meta.EncryptedMnemonic)
	if err != nil {
		return nil, err
	}
	defer crypto.WipeBytes(decrypted)
	var words []string
	if err := json.Unmarshal(decrypted, &words); err != nil {
		return nil, err
	}
	return words, nil
}
