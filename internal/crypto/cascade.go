package crypto

import (
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"io"
	"strconv"
	"sync"

	"golang.org/x/crypto/hkdf"
)

type CascadeMode int

const (
	SingleCipher CascadeMode = iota
	AESSerpent
	AESTwofish
	AESTwofishSerpent
)

const streamNonceSeedSize = 32

type CascadeCipher struct {
	mode    CascadeMode
	ciphers []*Cipher
}

func NewCascadeCipher(mode CascadeMode, masterKey []byte) (*CascadeCipher, error) {
	if len(masterKey) != 32 {
		return nil, errors.New("master key must be 32 bytes")
	}

	var ciphers []*Cipher

	switch mode {
	case SingleCipher:
		cipher, err := NewCipher(AES256GCM, masterKey)
		if err != nil {
			return nil, err
		}
		ciphers = append(ciphers, cipher)

	case AESSerpent:
		key1 := deriveSubKey(masterKey, 1)
		key2 := deriveSubKey(masterKey, 2)

		cipher1, err := NewCipher(Serpent256GCM, key1)
		if err != nil {
			return nil, err
		}
		cipher2, err := NewCipher(AES256GCM, key2)
		if err != nil {
			return nil, err
		}
		ciphers = append(ciphers, cipher1, cipher2)

	case AESTwofish:
		key1 := deriveSubKey(masterKey, 3)
		key2 := deriveSubKey(masterKey, 4)

		cipher1, err := NewCipher(Twofish256GCM, key1)
		if err != nil {
			return nil, err
		}
		cipher2, err := NewCipher(AES256GCM, key2)
		if err != nil {
			return nil, err
		}
		ciphers = append(ciphers, cipher1, cipher2)

	case AESTwofishSerpent:
		key1 := deriveSubKey(masterKey, 5)
		key2 := deriveSubKey(masterKey, 6)
		key3 := deriveSubKey(masterKey, 7)

		cipher1, err := NewCipher(Serpent256GCM, key1)
		if err != nil {
			return nil, err
		}
		cipher2, err := NewCipher(Twofish256GCM, key2)
		if err != nil {
			return nil, err
		}
		cipher3, err := NewCipher(AES256GCM, key3)
		if err != nil {
			return nil, err
		}
		ciphers = append(ciphers, cipher1, cipher2, cipher3)

	default:
		return nil, errors.New("unsupported cascade mode")
	}

	return &CascadeCipher{
		mode:    mode,
		ciphers: ciphers,
	}, nil
}

func (cc *CascadeCipher) Encrypt(plaintext []byte) ([]byte, error) {
	data := plaintext
	for _, cipher := range cc.ciphers {
		encrypted, err := cipher.Encrypt(data)
		if err != nil {
			return nil, err
		}
		data = encrypted
	}
	return data, nil
}

func (cc *CascadeCipher) Decrypt(ciphertext []byte) ([]byte, error) {
	data := ciphertext
	for i := len(cc.ciphers) - 1; i >= 0; i-- {
		decrypted, err := cc.ciphers[i].Decrypt(data)
		if err != nil {
			return nil, err
		}
		data = decrypted
	}
	return data, nil
}

func (cc *CascadeCipher) EncryptStream(plaintext io.Reader, ciphertext io.Writer) error {
	nonces, err := cc.prepareNonces()
	if err != nil {
		return err
	}

	if len(cc.ciphers) == 1 {
		return cc.ciphers[0].EncryptStreamWithNonce(plaintext, ciphertext, nonces[0])
	}

	errCh := make(chan error, len(cc.ciphers))
	var wg sync.WaitGroup

	currentReader := plaintext

	for i := 0; i < len(cc.ciphers)-1; i++ {
		pr, pw := io.Pipe()
		cipher := cc.ciphers[i]
		baseNonce := append([]byte(nil), nonces[i]...)

		wg.Add(1)
		go func(c *Cipher, reader io.Reader, writer *io.PipeWriter, nonce []byte) {
			defer wg.Done()
			localErr := c.EncryptStreamWithNonce(reader, writer, nonce)
			writer.CloseWithError(localErr)
			if localErr != nil {
				errCh <- localErr
			}
		}(cipher, currentReader, pw, baseNonce)

		currentReader = pr
	}

	lastCipher := cc.ciphers[len(cc.ciphers)-1]
	lastNonce := append([]byte(nil), nonces[len(nonces)-1]...)
	finalErr := lastCipher.EncryptStreamWithNonce(currentReader, ciphertext, lastNonce)
	if pr, ok := currentReader.(*io.PipeReader); ok {
		pr.CloseWithError(finalErr)
	}

	wg.Wait()
	close(errCh)

	if finalErr != nil {
		return finalErr
	}

	for e := range errCh {
		if e != nil {
			return e
		}
	}

	return nil
}

func (cc *CascadeCipher) DecryptStream(ciphertext io.Reader, plaintext io.Writer) error {
	if len(cc.ciphers) == 1 {
		return cc.ciphers[0].DecryptStream(ciphertext, plaintext)
	}

	errCh := make(chan error, len(cc.ciphers))
	var wg sync.WaitGroup

	currentReader := ciphertext

	for i := len(cc.ciphers) - 1; i > 0; i-- {
		pr, pw := io.Pipe()
		cipher := cc.ciphers[i]

		wg.Add(1)
		go func(c *Cipher, reader io.Reader, writer *io.PipeWriter) {
			defer wg.Done()
			localErr := c.DecryptStream(reader, writer)
			writer.CloseWithError(localErr)
			if localErr != nil {
				errCh <- localErr
			}
		}(cipher, currentReader, pw)

		currentReader = pr
	}

	finalErr := cc.ciphers[0].DecryptStream(currentReader, plaintext)
	if pr, ok := currentReader.(*io.PipeReader); ok {
		pr.CloseWithError(finalErr)
	}

	wg.Wait()
	close(errCh)

	if finalErr != nil {
		return finalErr
	}

	for e := range errCh {
		if e != nil {
			return e
		}
	}

	return nil
}

func (cc *CascadeCipher) prepareNonces() ([][]byte, error) {
	seed := make([]byte, streamNonceSeedSize)
	if _, err := rand.Read(seed); err != nil {
		return nil, err
	}

	nonces := make([][]byte, len(cc.ciphers))
	for i, cipher := range cc.ciphers {
		nonce, err := deriveCascadeNonce(seed, cipher, i)
		if err != nil {
			return nil, err
		}
		nonces[i] = nonce
	}

	return nonces, nil
}

func deriveCascadeNonce(seed []byte, cipher *Cipher, index int) ([]byte, error) {
	nonceSize := cipher.NonceSize()
	if nonceSize < 8 {
		return nil, errors.New("nonce size too small")
	}

	var reader io.Reader
	if seed == nil {
		reader = rand.Reader
	} else {
		info := []byte("micryptlol/cascade/" + strconv.Itoa(index))
		reader = hkdf.New(sha256.New, seed, nil, info)
	}

	nonce := make([]byte, nonceSize)
	if _, err := io.ReadFull(reader, nonce); err != nil {
		return nil, err
	}

	return nonce, nil
}

func deriveSubKey(masterKey []byte, index int) []byte {
	h := sha256.New()
	h.Write(masterKey)
	h.Write([]byte{byte(index)})
	return h.Sum(nil)
}
