package vault

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDeleteVaultRejectsSymlink(t *testing.T) {
	dir := t.TempDir()
	target := filepath.Join(dir, "target.mvault")
	content := []byte("secret")
	if err := os.WriteFile(target, content, 0o600); err != nil {
		t.Fatalf("write target: %v", err)
	}
	link := filepath.Join(dir, "link.mvault")
	if err := os.Symlink(target, link); err != nil {
		t.Fatalf("symlink: %v", err)
	}
	err := DeleteVault(link)
	if err == nil {
		t.Fatal("expected error when deleting symlink")
	}
	data, err := os.ReadFile(target)
	if err != nil {
		t.Fatalf("read target: %v", err)
	}
	if string(data) != string(content) {
		t.Fatal("target file modified")
	}
}

func TestDeleteVaultRemovesFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "vault.mvault")
	if err := os.WriteFile(path, []byte("secret"), 0o600); err != nil {
		t.Fatalf("write vault: %v", err)
	}
	if err := DeleteVault(path); err != nil {
		t.Fatalf("delete vault: %v", err)
	}
	_, err := os.Stat(path)
	if !os.IsNotExist(err) {
		t.Fatalf("expected file removed, got err %v", err)
	}
}
