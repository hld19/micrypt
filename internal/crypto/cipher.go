package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/binary"
	"errors"
	"io"

	"github.com/aead/serpent"
	"golang.org/x/crypto/chacha20poly1305"
	"golang.org/x/crypto/twofish"
)

type CipherType int

const (
	AES256GCM CipherType = iota
	Serpent256GCM
	Twofish256GCM
	XChaCha20Poly1305
)

const chunkSize = 64 * 1024

type Cipher struct {
	Type CipherType
	aead cipher.AEAD
}

func NewCipher(cipherType CipherType, key []byte) (*Cipher, error) {
	var aead cipher.AEAD
	var err error

	switch cipherType {
	case AES256GCM:
		if len(key) != 32 {
			return nil, errors.New("AES-256 requires 32-byte key")
		}
		block, err := aes.NewCipher(key)
		if err != nil {
			return nil, err
		}
		aead, err = cipher.NewGCM(block)
		if err != nil {
			return nil, err
		}

	case Serpent256GCM:
		if len(key) != 32 {
			return nil, errors.New("Serpent-256 requires 32-byte key")
		}
		block, err := serpent.NewCipher(key)
		if err != nil {
			return nil, err
		}
		aead, err = cipher.NewGCM(block)
		if err != nil {
			return nil, err
		}

	case Twofish256GCM:
		if len(key) != 32 {
			return nil, errors.New("Twofish-256 requires 32-byte key")
		}
		block, err := twofish.NewCipher(key)
		if err != nil {
			return nil, err
		}
		aead, err = cipher.NewGCM(block)
		if err != nil {
			return nil, err
		}

	case XChaCha20Poly1305:
		if len(key) != 32 {
			return nil, errors.New("XChaCha20-Poly1305 requires 32-byte key")
		}
		aead, err = chacha20poly1305.NewX(key)
		if err != nil {
			return nil, err
		}

	default:
		return nil, errors.New("unsupported cipher type")
	}

	return &Cipher{
		Type: cipherType,
		aead: aead,
	}, nil
}

func (c *Cipher) Encrypt(plaintext []byte) ([]byte, error) {
	nonce := make([]byte, c.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := c.aead.Seal(nonce, nonce, plaintext, nil)
	return ciphertext, nil
}

func (c *Cipher) Decrypt(ciphertext []byte) ([]byte, error) {
	nonceSize := c.aead.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := c.aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}

func (c *Cipher) EncryptStream(plaintext io.Reader, ciphertext io.Writer) error {
	baseNonce := make([]byte, c.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, baseNonce); err != nil {
		return err
	}

	return c.EncryptStreamWithNonce(plaintext, ciphertext, baseNonce)
}

func (c *Cipher) DecryptStream(ciphertext io.Reader, plaintext io.Writer) error {
	baseNonce := make([]byte, c.aead.NonceSize())
	if _, err := io.ReadFull(ciphertext, baseNonce); err != nil {
		return err
	}

	chunkNum := uint64(0)
	chunkLenBuf := make([]byte, 4)

	for {
		_, err := io.ReadFull(ciphertext, chunkLenBuf)
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		chunkLen := binary.LittleEndian.Uint32(chunkLenBuf)
		if chunkLen > chunkSize+uint32(c.aead.Overhead())*2 {
			return errors.New("invalid chunk size")
		}

		encryptedChunk := make([]byte, chunkLen)
		if _, err := io.ReadFull(ciphertext, encryptedChunk); err != nil {
			return err
		}

		chunkNonce := deriveChunkNonce(baseNonce, chunkNum)

		decrypted, derr := c.aead.Open(nil, chunkNonce, encryptedChunk, nil)
		if derr != nil {
			return derr
		}

		if _, werr := plaintext.Write(decrypted); werr != nil {
			return werr
		}

		chunkNum++
	}

	return nil
}

func (c *Cipher) EncryptStreamWithNonce(plaintext io.Reader, ciphertext io.Writer, baseNonce []byte) error {
	if len(baseNonce) != c.aead.NonceSize() {
		return errors.New("invalid base nonce length")
	}

	if _, err := ciphertext.Write(baseNonce); err != nil {
		return err
	}

	return c.encryptStreamChunks(plaintext, ciphertext, baseNonce)
}

func (c *Cipher) NonceSize() int {
	return c.aead.NonceSize()
}

func (c *Cipher) encryptStreamChunks(plaintext io.Reader, ciphertext io.Writer, baseNonce []byte) error {
	buf := make([]byte, chunkSize)
	chunkNum := uint64(0)

	for {
		n, err := plaintext.Read(buf)
		if n > 0 {
			chunkNonce := deriveChunkNonce(baseNonce, chunkNum)

			encrypted := c.aead.Seal(nil, chunkNonce, buf[:n], nil)

			chunkLen := make([]byte, 4)
			binary.LittleEndian.PutUint32(chunkLen, uint32(len(encrypted)))

			if _, werr := ciphertext.Write(chunkLen); werr != nil {
				return werr
			}
			if _, werr := ciphertext.Write(encrypted); werr != nil {
				return werr
			}

			chunkNum++
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}

	return nil
}

func deriveChunkNonce(base []byte, chunkNum uint64) []byte {
	nonce := append([]byte(nil), base...)
	carry := uint64(0)

	for i := 0; i < 8; i++ {
		idx := len(nonce) - 1 - i
		if idx < 0 {
			break
		}
		byteToAdd := byte(chunkNum >> (i * 8))
		sum := uint16(nonce[idx]) + uint16(byteToAdd) + uint16(carry)
		nonce[idx] = byte(sum)
		carry = uint64(sum >> 8)
	}

	for idx := len(nonce) - 1 - 8; idx >= 0 && carry > 0; idx-- {
		sum := uint16(nonce[idx]) + uint16(carry)
		nonce[idx] = byte(sum)
		carry = uint64(sum >> 8)
	}

	return nonce
}
