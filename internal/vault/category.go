package vault

type FileCategory string

const (
	CategoryPassword    FileCategory = "passwords"
	CategoryImage       FileCategory = "images"
	CategoryVideo       FileCategory = "videos"
	CategoryAudio       FileCategory = "audio"
	CategoryDocument    FileCategory = "documents"
	CategoryCode        FileCategory = "code"
	CategoryAPI         FileCategory = "apis"
	CategoryKey         FileCategory = "keys"
	CategoryCertificate FileCategory = "certificates"
	CategoryArchive     FileCategory = "archives"
	CategoryOther       FileCategory = "other"
)

func GetCategoryFromFilename(filename string) FileCategory {
	lower := filename
	for i, c := range lower {
		if c >= 'A' && c <= 'Z' {
			lower = lower[:i] + string(c+32) + lower[i+1:]
		}
	}

	if containsAny(lower, []string{"password", "pass", "pwd", "credential", "cred", "login"}) {
		return CategoryPassword
	}

	if containsAny(lower, []string{".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".ico", ".tiff", ".heic"}) {
		return CategoryImage
	}

	if containsAny(lower, []string{".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm", ".m4v", ".mpeg"}) {
		return CategoryVideo
	}

	if containsAny(lower, []string{".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a"}) {
		return CategoryAudio
	}

	if containsAny(lower, []string{".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".md"}) {
		return CategoryDocument
	}

	if containsAny(lower, []string{".go", ".py", ".js", ".java", ".c", ".cpp", ".h", ".rs", ".swift", ".php", ".rb"}) {
		return CategoryCode
	}

	if containsAny(lower, []string{"api", "key", "token", "secret", ".env", "config"}) {
		return CategoryAPI
	}

	if containsAny(lower, []string{".pem", ".key", ".pub", ".ppk", "ssh", "rsa", "dsa", "ecdsa"}) {
		return CategoryKey
	}

	if containsAny(lower, []string{".crt", ".cer", ".cert", ".p12", ".pfx", "certificate"}) {
		return CategoryCertificate
	}

	if containsAny(lower, []string{".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"}) {
		return CategoryArchive
	}

	return CategoryOther
}

func containsAny(str string, substrs []string) bool {
	for _, substr := range substrs {
		if contains(str, substr) {
			return true
		}
	}
	return false
}

func contains(str, substr string) bool {
	if len(substr) > len(str) {
		return false
	}
	for i := 0; i <= len(str)-len(substr); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			if str[i+j] != substr[j] {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func GetCategoryEmoji(category FileCategory) string {
	switch category {
	case CategoryPassword:
		return "🔐"
	case CategoryImage:
		return "🖼️"
	case CategoryVideo:
		return "🎬"
	case CategoryAudio:
		return "🎵"
	case CategoryDocument:
		return "📄"
	case CategoryCode:
		return "💻"
	case CategoryAPI:
		return "🔑"
	case CategoryKey:
		return "🗝️"
	case CategoryCertificate:
		return "📜"
	case CategoryArchive:
		return "📦"
	default:
		return "📁"
	}
}

func GetCategoryName(category FileCategory) string {
	switch category {
	case CategoryPassword:
		return "Passwords"
	case CategoryImage:
		return "Images"
	case CategoryVideo:
		return "Videos"
	case CategoryAudio:
		return "Audio"
	case CategoryDocument:
		return "Documents"
	case CategoryCode:
		return "Code"
	case CategoryAPI:
		return "API Keys"
	case CategoryKey:
		return "SSH Keys"
	case CategoryCertificate:
		return "Certificates"
	case CategoryArchive:
		return "Archives"
	default:
		return "Other"
	}
}

func GetAllCategories() []FileCategory {
	return []FileCategory{
		CategoryPassword,
		CategoryImage,
		CategoryVideo,
		CategoryAudio,
		CategoryDocument,
		CategoryCode,
		CategoryAPI,
		CategoryKey,
		CategoryCertificate,
		CategoryArchive,
		CategoryOther,
	}
}

func GetCategoryColor() string {
	return "#C8C8C8"
}
