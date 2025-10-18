//go:build !windows && !plan9

package crypto

import "golang.org/x/sys/unix"

func lockMemory(data []byte) {
	if len(data) == 0 {
		return
	}
	_ = unix.Mlock(data)
}

func unlockMemory(data []byte) {
	if len(data) == 0 {
		return
	}
	_ = unix.Munlock(data)
}
