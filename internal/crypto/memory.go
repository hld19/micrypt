package crypto

import (
	"crypto/rand"
)

func WipeBytes(data []byte) {
	if data == nil || len(data) == 0 {
		return
	}

	for i := range data {
		data[i] = 0
	}

	randomData := make([]byte, len(data))
	rand.Read(randomData)
	copy(data, randomData)

	for i := range data {
		data[i] = 0xFF
	}

	for i := range data {
		data[i] = 0
	}
}

func WipeString(s string) {
	if len(s) == 0 {
		return
	}
	data := []byte(s)
	WipeBytes(data)
}

type SecureBuffer struct {
	data []byte
}

func NewSecureBuffer(size int) *SecureBuffer {
	return &SecureBuffer{
		data: make([]byte, size),
	}
}

func (sb *SecureBuffer) Bytes() []byte {
	return sb.data
}

func (sb *SecureBuffer) Write(p []byte) (n int, err error) {
	n = copy(sb.data, p)
	return n, nil
}

func (sb *SecureBuffer) Wipe() {
	WipeBytes(sb.data)
}

func (sb *SecureBuffer) Destroy() {
	sb.Wipe()
	sb.data = nil
}

func (sb *SecureBuffer) Lock() {
	if sb == nil {
		return
	}
	lockMemory(sb.data)
}

func (sb *SecureBuffer) Unlock() {
	if sb == nil {
		return
	}
	unlockMemory(sb.data)
}

func LockBytes(data []byte) {
	lockMemory(data)
}

func UnlockBytes(data []byte) {
	unlockMemory(data)
}
