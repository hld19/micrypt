package crypto

import (
	"bytes"
	"encoding/hex"
	"math"
	"testing"
)

func TestDeriveChunkNonceDoesNotMutateBase(t *testing.T) {
	base := []byte{0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b}
	baseCopy := append([]byte(nil), base...)

	nonce := deriveChunkNonce(base, 1)

	if !bytes.Equal(base, baseCopy) {
		t.Fatalf("deriveChunkNonce mutated base nonce: got %s want %s", hex.EncodeToString(base), hex.EncodeToString(baseCopy))
	}
	if bytes.Equal(nonce, base) {
		t.Fatalf("expected derived nonce to differ from base when chunk != 0")
	}
}

func TestDeriveChunkNonceMonotonic(t *testing.T) {
	base := []byte{0xde, 0xad, 0xbe, 0xef, 0x10, 0x20, 0x30, 0x40, 0x00, 0x00, 0x00, 0x00}

	prev := deriveChunkNonce(base, 0)
	for i := uint64(1); i < 1_000; i++ {
		next := deriveChunkNonce(base, i)
		if bytes.Equal(prev, next) {
			t.Fatalf("derived nonce collision at chunk %d", i)
		}
		prev = next
	}
}

func TestDeriveChunkNonceHighCounter(t *testing.T) {
	base := []byte{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00}
	nonce := deriveChunkNonce(base, math.MaxUint64)
	if bytes.Equal(nonce, base) {
		t.Fatalf("expected high counter to alter nonce")
	}
}

func TestCipherRoundTrip(t *testing.T) {
	payload := bytes.Repeat([]byte("micrypt"), 8)
	cipherTypes := []CipherType{
		AES256GCM,
		Serpent256GCM,
		Twofish256GCM,
		XChaCha20Poly1305,
	}

	for _, ct := range cipherTypes {
		key := bytes.Repeat([]byte{byte(ct + 1)}, 32)
		c, err := NewCipher(ct, key)
		if err != nil {
			t.Fatalf("NewCipher(%d) error: %v", ct, err)
		}
		encrypted, err := c.Encrypt(payload)
		if err != nil {
			t.Fatalf("Encrypt failed for type %d: %v", ct, err)
		}
		decrypted, err := c.Decrypt(encrypted)
		if err != nil {
			t.Fatalf("Decrypt failed for type %d: %v", ct, err)
		}
		if !bytes.Equal(payload, decrypted) {
			t.Fatalf("Decrypt mismatch for type %d", ct)
		}

		var buf bytes.Buffer
		if err := c.EncryptStream(bytes.NewReader(payload), &buf); err != nil {
			t.Fatalf("EncryptStream failed for type %d: %v", ct, err)
		}
		var out bytes.Buffer
		if err := c.DecryptStream(&buf, &out); err != nil {
			t.Fatalf("DecryptStream failed for type %d: %v", ct, err)
		}
		if !bytes.Equal(payload, out.Bytes()) {
			t.Fatalf("DecryptStream mismatch for type %d", ct)
		}
	}
}
