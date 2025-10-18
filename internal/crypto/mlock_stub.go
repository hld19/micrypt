//go:build windows || plan9

package crypto

func lockMemory(data []byte) {}

func unlockMemory(data []byte) {}
