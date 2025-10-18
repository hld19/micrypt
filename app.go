package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"micryptlol/internal/bip39"
	"micryptlol/internal/crypto"
	"micryptlol/internal/vault"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx              context.Context
	currentVault     *vault.Vault
	vaultPath        string
	entropyCollector *crypto.EntropyCollector
	pendingMnemonic  []string
	storedMnemonic   []string
}

type FileInfo struct {
	EncryptedName string    `json:"encryptedName"`
	OriginalName  string    `json:"originalName"`
	Size          int64     `json:"size"`
	Category      string    `json:"category"`
	EncryptedAt   time.Time `json:"encryptedAt"`
}

type VaultStats struct {
	TotalFiles int    `json:"totalFiles"`
	TotalSize  int64  `json:"totalSize"`
	VaultPath  string `json:"vaultPath"`
	IsUnlocked bool   `json:"isUnlocked"`
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) StartEntropyCollection() {
	a.entropyCollector = crypto.NewEntropyCollector()
}

func (a *App) AddEntropyEvent(x, y int32, timestamp int64) {
	if a.entropyCollector != nil {
		a.entropyCollector.AddEvent(x, y, timestamp)
	}
}

func (a *App) GetEntropyProgress() float64 {
	if a.entropyCollector == nil {
		return 0.0
	}
	return a.entropyCollector.GetProgress()
}

func (a *App) IsEntropyComplete() bool {
	if a.entropyCollector == nil {
		return false
	}
	return a.entropyCollector.IsComplete()
}

func (a *App) CreateVault(password string, algorithm int, pim uint32, keyfiles []string, directory string) (string, error) {
	if len(password) < 8 {
		return "", fmt.Errorf("password must be at least 8 characters")
	}

	location := directory
	var err error
	if location == "" {
		location, err = runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
			Title:           "Select Location for New Vault",
			DefaultFilename: "MicryptVault.mvault",
			Filters: []runtime.FileFilter{
				{DisplayName: "Micrypt Vault (*.mvault)", Pattern: "*.mvault"},
			},
		})
		if err != nil {
			return "", err
		}
		if location == "" {
			return "", fmt.Errorf("no location selected")
		}
	}

	if info, statErr := os.Stat(location); statErr == nil && info.IsDir() {
		// Allow legacy directory input; backend will derive a container path inside.
	} else {
		if filepath.Ext(location) == "" {
			location += ".mvault"
		}
		if vault.VaultExists(location) {
			return "", fmt.Errorf("a vault already exists at this location")
		}
	}

	vaultPath := location
	var cascadeMode crypto.CascadeMode
	switch algorithm {
	case 0:
		cascadeMode = crypto.SingleCipher
	case 1:
		cascadeMode = crypto.AESSerpent
	case 2:
		cascadeMode = crypto.AESTwofish
	case 3:
		cascadeMode = crypto.AESTwofishSerpent
	default:
		cascadeMode = crypto.AESTwofishSerpent
	}

	var entropySeed []byte
	if a.entropyCollector != nil && a.entropyCollector.IsComplete() {
		entropySeed, err = a.entropyCollector.GenerateSeed()
		if err != nil {
			return "", err
		}
		a.entropyCollector = nil
	}

	keyfileBytes, err := decodeKeyfiles(keyfiles)
	if err != nil {
		return "", err
	}
	defer wipeKeyfiles(keyfileBytes)

	options := &vault.VaultCreationOptions{Keyfiles: keyfileBytes, PIM: pim, Entropy: entropySeed}
	v, mnemonic, err := vault.CreateVaultWithEntropyOptions(vaultPath, password, cascadeMode, entropySeed, options)
	if err != nil {
		crypto.WipeBytes(entropySeed)
		return "", err
	}

	a.currentVault = v
	actualPath := v.GetPath()
	a.vaultPath = actualPath
	a.pendingMnemonic = append([]string(nil), mnemonic.Words...)
	a.storedMnemonic = append([]string(nil), mnemonic.Words...)
	crypto.WipeBytes(mnemonic.Seed)
	crypto.WipeBytes(entropySeed)

	return actualPath, nil
}

func (a *App) UnlockVault(password string, pim uint32, keyfiles []string, directory string) error {
	location := directory
	if location == "" {
		var err error
		location, err = runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
			Title: "Select Vault File",
			Filters: []runtime.FileFilter{
				{DisplayName: "Micrypt Vault (*.mvault)", Pattern: "*.mvault"},
				{DisplayName: "All Files", Pattern: "*"},
			},
		})
		if err != nil {
			return err
		}
		if location == "" {
			return fmt.Errorf("no vault file selected")
		}
	}

	if info, err := os.Stat(location); err == nil && info.IsDir() {
		return fmt.Errorf("expected a vault file but got a directory")
	}

	if !vault.VaultExists(location) {
		return fmt.Errorf("no vault found at this location")
	}

	keyfileBytes, err := decodeKeyfiles(keyfiles)
	if err != nil {
		return err
	}
	defer wipeKeyfiles(keyfileBytes)

	unlockOpts := &vault.UnlockOptions{Keyfiles: keyfileBytes, PIM: pim}
	v, err := vault.OpenVaultWithOptions(location, password, unlockOpts)
	if err != nil {
		return err
	}

	a.currentVault = v
	a.vaultPath = v.GetPath()

	return nil
}

func (a *App) LockVault() error {
	if a.currentVault == nil {
		return fmt.Errorf("no vault is currently open")
	}

	a.currentVault.Lock()
	a.currentVault = nil
	a.vaultPath = ""
	a.pendingMnemonic = nil
	a.storedMnemonic = nil

	return nil
}

func (a *App) DeleteVault() error {
	path := ""
	if a.currentVault != nil {
		path = a.currentVault.GetPath()
		a.currentVault.Lock()
		a.currentVault = nil
	} else if a.vaultPath != "" {
		path = a.vaultPath
	} else {
		return fmt.Errorf("no vault is currently open")
	}

	if err := vault.DeleteVault(path); err != nil {
		return err
	}

	a.vaultPath = ""
	a.pendingMnemonic = nil
	a.storedMnemonic = nil
	a.entropyCollector = nil
	return nil
}

func (a *App) IsVaultUnlocked() bool {
	return a.currentVault != nil && a.currentVault.IsUnlocked()
}

func (a *App) GetRecoveryMnemonic() []string {
	if len(a.pendingMnemonic) > 0 {
		words := append([]string(nil), a.pendingMnemonic...)
		a.pendingMnemonic = nil
		a.storedMnemonic = append([]string(nil), words...)
		return words
	}
	if len(a.storedMnemonic) > 0 {
		return append([]string(nil), a.storedMnemonic...)
	}
	if a.currentVault != nil {
		if words := a.currentVault.StoredMnemonic(); len(words) > 0 {
			a.storedMnemonic = append([]string(nil), words...)
			return append([]string(nil), words...)
		}
	}
	return nil
}

func (a *App) RequestRecoveryMnemonic(password string, pim uint32) ([]string, error) {
	if a.currentVault == nil {
		return nil, fmt.Errorf("no vault is currently open")
	}
	if err := a.currentVault.VerifyPassword(password, &vault.UnlockOptions{PIM: pim}); err != nil {
		return nil, err
	}
	words := a.currentVault.StoredMnemonic()
	if len(words) == 0 {
		return nil, fmt.Errorf("no recovery phrase available")
	}
	a.storedMnemonic = append([]string(nil), words...)
	return append([]string(nil), words...), nil
}

func (a *App) RecoverVaultWithSeed(words []string, directory string) (string, error) {
	if len(words) == 0 {
		return "", fmt.Errorf("mnemonic words required")
	}
	mnemonic, err := bip39.RestoreFromMnemonic(words, "")
	if err != nil {
		return "", err
	}
	defer crypto.WipeBytes(mnemonic.Seed)

	location := directory
	if location == "" {
		location, err = runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
			Title: "Select Vault File",
			Filters: []runtime.FileFilter{
				{DisplayName: "Micrypt Vault (*.mvault)", Pattern: "*.mvault"},
				{DisplayName: "All Files", Pattern: "*"},
			},
		})
		if err != nil {
			return "", err
		}
		if location == "" {
			return "", fmt.Errorf("no vault file selected")
		}
	}

	if info, err := os.Stat(location); err == nil && info.IsDir() {
		return "", fmt.Errorf("expected a vault file but got a directory")
	}

	if !vault.VaultExists(location) {
		return "", fmt.Errorf("no vault found at this location")
	}

	v, err := vault.OpenVaultFromMnemonicSeed(location, mnemonic.Seed)
	if err != nil {
		return "", err
	}

	a.currentVault = v
	a.vaultPath = v.GetPath()
	a.pendingMnemonic = append([]string(nil), words...)
	a.storedMnemonic = append([]string(nil), words...)
	return location, nil
}

func decodeKeyfiles(encoded []string) ([][]byte, error) {
	if len(encoded) == 0 {
		return nil, nil
	}
	result := make([][]byte, 0, len(encoded))
	for _, item := range encoded {
		if item == "" {
			continue
		}
		data, err := base64.StdEncoding.DecodeString(item)
		if err != nil {
			return nil, err
		}
		result = append(result, data)
	}
	return result, nil
}

func wipeKeyfiles(keyfiles [][]byte) {
	for _, data := range keyfiles {
		crypto.WipeBytes(data)
	}
}

func (a *App) AddFiles() error {
	if a.currentVault == nil {
		return fmt.Errorf("no vault is currently open")
	}

	files, err := runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Files to Encrypt",
	})
	if err != nil {
		return err
	}
	if len(files) == 0 {
		return nil
	}

	for _, filePath := range files {
		_, err := a.currentVault.EncryptFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to encrypt %s: %v", filepath.Base(filePath), err)
		}
	}

	return nil
}

func (a *App) ListFiles() ([]FileInfo, error) {
	if a.currentVault == nil {
		return nil, fmt.Errorf("no vault is currently open")
	}

	entries := a.currentVault.ListFiles()
	files := make([]FileInfo, len(entries))

	for i, entry := range entries {
		category := vault.GetCategoryFromFilename(entry.OriginalName)
		files[i] = FileInfo{
			EncryptedName: entry.EncryptedName,
			OriginalName:  entry.OriginalName,
			Size:          entry.Size,
			Category:      string(category),
			EncryptedAt:   entry.EncryptedAt,
		}
	}

	return files, nil
}

func (a *App) ExtractFile(encryptedName string) error {
	if a.currentVault == nil {
		return fmt.Errorf("no vault is currently open")
	}

	originalName := a.currentVault.GetOriginalFilename(encryptedName)

	destPath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Decrypted File",
		DefaultFilename: originalName,
	})
	if err != nil {
		return err
	}
	if destPath == "" {
		return nil
	}

	return a.currentVault.DecryptFile(encryptedName, destPath)
}

func (a *App) DeleteFile(encryptedName string) error {
	if a.currentVault == nil {
		return fmt.Errorf("no vault is currently open")
	}

	return a.currentVault.DeleteFile(encryptedName)
}

func (a *App) GetVaultStats() (VaultStats, error) {
	stats := VaultStats{
		IsUnlocked: a.IsVaultUnlocked(),
		VaultPath:  a.vaultPath,
	}

	if a.currentVault == nil {
		return stats, nil
	}

	files := a.currentVault.ListFiles()
	stats.TotalFiles = len(files)

	var totalSize int64
	for _, file := range files {
		totalSize += file.Size
	}
	stats.TotalSize = totalSize

	return stats, nil
}

func (a *App) GetCategoryStats() (map[string]int, error) {
	if a.currentVault == nil {
		return nil, fmt.Errorf("no vault is currently open")
	}

	files := a.currentVault.ListFiles()
	categories := make(map[string]int)

	for _, file := range files {
		category := string(vault.GetCategoryFromFilename(file.OriginalName))
		categories[category]++
	}

	return categories, nil
}

func (a *App) SelectVaultDirectory() (string, error) {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Select Location for New Vault",
		DefaultFilename: "MicryptVault.mvault",
		Filters: []runtime.FileFilter{
			{DisplayName: "Micrypt Vault (*.mvault)", Pattern: "*.mvault"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

func (a *App) VaultExistsAtPath(path string) bool {
	return vault.VaultExists(path)
}

func (a *App) SelectVaultFile() (string, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Vault File",
		Filters: []runtime.FileFilter{
			{DisplayName: "Micrypt Vault (*.mvault)", Pattern: "*.mvault"},
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

func (a *App) GetHomeDirectory() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return home, nil
}
