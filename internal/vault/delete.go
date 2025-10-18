package vault

import (
	"crypto/rand"
	"errors"
	"io"
	"os"
	"path/filepath"
)

const (
	defaultWipePasses = 3
	wipeBufferSize    = 1024 * 1024 // 1 MiB
)

func DeleteVault(path string) error {
	if path == "" {
		return errors.New("vault path cannot be empty")
	}

	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return errors.New("expected vault file but found directory")
	}

	if err := secureOverwrite(path, info.Size(), defaultWipePasses); err != nil {
		return err
	}

	if err := os.Remove(path); err != nil {
		return err
	}

	dir := filepath.Dir(path)
	if dir != "" {
		_ = syncDirectory(dir)
	}
	return nil
}

func secureOverwrite(path string, size int64, passes int) error {
	if passes <= 0 {
		passes = 1
	}
	if size == 0 {
		return nil
	}

	handle, err := os.OpenFile(path, os.O_WRONLY, 0)
	if err != nil {
		return err
	}
	defer handle.Close()

	buf := make([]byte, wipeBufferSize)

	for pass := 0; pass < passes; pass++ {
		if _, err := handle.Seek(0, io.SeekStart); err != nil {
			return err
		}

		remaining := size
		for remaining > 0 {
			toWrite := len(buf)
			if int64(toWrite) > remaining {
				toWrite = int(remaining)
			}

			if _, err := rand.Read(buf[:toWrite]); err != nil {
				return err
			}
			if _, err := handle.Write(buf[:toWrite]); err != nil {
				return err
			}

			remaining -= int64(toWrite)
		}

		if err := handle.Sync(); err != nil {
			return err
		}
	}

	return nil
}

func syncDirectory(path string) error {
	dir, err := os.Open(path)
	if err != nil {
		return err
	}
	defer dir.Close()
	return dir.Sync()
}
