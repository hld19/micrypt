package vault

import (
	"bytes"
	"encoding/binary"
	"os"
	"path/filepath"
	"testing"
)

func TestLoadContainerFileRejectsLargeMetadata(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "vault.mvault")
	buf := new(bytes.Buffer)
	buf.WriteString(containerMagic)
	if err := binary.Write(buf, binary.BigEndian, uint32(containerVersion)); err != nil {
		t.Fatalf("write version: %v", err)
	}
	if err := binary.Write(buf, binary.BigEndian, uint32(maxMetadataSize+1)); err != nil {
		t.Fatalf("write meta len: %v", err)
	}
	if err := os.WriteFile(path, buf.Bytes(), 0o600); err != nil {
		t.Fatalf("write file: %v", err)
	}
	_, _, _, err := loadContainerFile(path)
	if err == nil {
		t.Fatal("expected error for large metadata")
	}
}

func TestLoadContainerFileRejectsLargeIndex(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "vault.mvault")
	buf := new(bytes.Buffer)
	buf.WriteString(containerMagic)
	if err := binary.Write(buf, binary.BigEndian, uint32(containerVersion)); err != nil {
		t.Fatalf("write version: %v", err)
	}
	if err := binary.Write(buf, binary.BigEndian, uint32(4)); err != nil {
		t.Fatalf("write meta len: %v", err)
	}
	buf.Write([]byte{0, 0, 0, 0})
	if err := binary.Write(buf, binary.BigEndian, uint32(maxIndexSize+1)); err != nil {
		t.Fatalf("write index len: %v", err)
	}
	if err := os.WriteFile(path, buf.Bytes(), 0o600); err != nil {
		t.Fatalf("write file: %v", err)
	}
	_, _, _, err := loadContainerFile(path)
	if err == nil {
		t.Fatal("expected error for large index")
	}
}
