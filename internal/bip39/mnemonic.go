package bip39

import (
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"strings"

	"github.com/tyler-smith/go-bip39"
	"golang.org/x/crypto/pbkdf2"
)

const (
	Mnemonic12Words = 128
	Mnemonic24Words = 256
)

type Mnemonic struct {
	Words []string
	Seed  []byte
}

func GenerateMnemonic(bits int) (*Mnemonic, error) {
	if bits != Mnemonic12Words && bits != Mnemonic24Words {
		return nil, errors.New("bits must be 128 or 256")
	}

	entropy := make([]byte, bits/8)
	if _, err := rand.Read(entropy); err != nil {
		return nil, err
	}

	mnemonic, err := bip39.NewMnemonic(entropy)
	if err != nil {
		return nil, err
	}

	seed := bip39.NewSeed(mnemonic, "")

	words, err := parseMnemonic(mnemonic)
	if err != nil {
		return nil, err
	}

	return &Mnemonic{
		Words: words,
		Seed:  seed,
	}, nil
}

func RestoreFromMnemonic(words []string, passphrase string) (*Mnemonic, error) {
	mnemonic := joinWords(words)

	if !bip39.IsMnemonicValid(mnemonic) {
		return nil, errors.New("invalid mnemonic phrase")
	}

	seed := bip39.NewSeed(mnemonic, passphrase)

	return &Mnemonic{
		Words: words,
		Seed:  seed,
	}, nil
}

func (m *Mnemonic) DeriveKey(salt []byte) []byte {
	return pbkdf2.Key(m.Seed, salt, 2048, 32, sha256.New)
}

func (m *Mnemonic) GetMasterKey() []byte {
	h := sha256.New()
	h.Write(m.Seed)
	return h.Sum(nil)
}

func parseMnemonic(mnemonic string) ([]string, error) {
	words := strings.Fields(mnemonic)
	if len(words) != 12 && len(words) != 24 {
		return nil, errors.New("mnemonic must be 12 or 24 words")
	}
	return words, nil
}

func joinWords(words []string) string {
	result := ""
	for i, word := range words {
		if i > 0 {
			result += " "
		}
		result += word
	}
	return result
}

func ValidateMnemonic(words []string) bool {
	mnemonic := joinWords(words)
	return bip39.IsMnemonicValid(mnemonic)
}
