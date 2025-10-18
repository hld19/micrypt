package crypto

import (
	"fmt"
	"unicode"
)

type PasswordStrength int

const (
	PasswordWeak PasswordStrength = iota
	PasswordFair
	PasswordGood
	PasswordStrong
	PasswordVeryStrong
)

type PasswordRequirements struct {
	MinLength      int
	RequireUpper   bool
	RequireLower   bool
	RequireNumber  bool
	RequireSpecial bool
}

func DefaultPasswordRequirements() *PasswordRequirements {
	return &PasswordRequirements{
		MinLength:      12,
		RequireUpper:   true,
		RequireLower:   true,
		RequireNumber:  true,
		RequireSpecial: true,
	}
}

func ValidatePassword(password string, reqs *PasswordRequirements) (bool, []string) {
	var issues []string

	if len(password) < reqs.MinLength {
		issues = append(issues, fmt.Sprintf("Password must be at least %d characters", reqs.MinLength))
	}

	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		if unicode.IsUpper(char) {
			hasUpper = true
		}
		if unicode.IsLower(char) {
			hasLower = true
		}
		if unicode.IsDigit(char) {
			hasNumber = true
		}
		if unicode.IsPunct(char) || unicode.IsSymbol(char) {
			hasSpecial = true
		}
	}

	if reqs.RequireUpper && !hasUpper {
		issues = append(issues, "Password must contain at least one uppercase letter")
	}
	if reqs.RequireLower && !hasLower {
		issues = append(issues, "Password must contain at least one lowercase letter")
	}
	if reqs.RequireNumber && !hasNumber {
		issues = append(issues, "Password must contain at least one number")
	}
	if reqs.RequireSpecial && !hasSpecial {
		issues = append(issues, "Password must contain at least one special character")
	}

	return len(issues) == 0, issues
}

func GetPasswordStrength(password string) PasswordStrength {
	score := 0

	if len(password) >= 8 {
		score++
	}
	if len(password) >= 12 {
		score++
	}
	if len(password) >= 16 {
		score++
	}

	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		if unicode.IsUpper(char) {
			hasUpper = true
		}
		if unicode.IsLower(char) {
			hasLower = true
		}
		if unicode.IsDigit(char) {
			hasNumber = true
		}
		if unicode.IsPunct(char) || unicode.IsSymbol(char) {
			hasSpecial = true
		}
	}

	if hasUpper {
		score++
	}
	if hasLower {
		score++
	}
	if hasNumber {
		score++
	}
	if hasSpecial {
		score++
	}

	switch {
	case score <= 2:
		return PasswordWeak
	case score == 3:
		return PasswordFair
	case score == 4:
		return PasswordGood
	case score == 5:
		return PasswordStrong
	default:
		return PasswordVeryStrong
	}
}

func GetPasswordStrengthString(strength PasswordStrength) string {
	switch strength {
	case PasswordWeak:
		return "Weak"
	case PasswordFair:
		return "Fair"
	case PasswordGood:
		return "Good"
	case PasswordStrong:
		return "Strong"
	case PasswordVeryStrong:
		return "Very Strong"
	default:
		return "Unknown"
	}
}

func GetPasswordStrengthColor(strength PasswordStrength) string {
	switch strength {
	case PasswordWeak:
		return "#EF4444"
	case PasswordFair:
		return "#F59E0B"
	case PasswordGood:
		return "#EAB308"
	case PasswordStrong:
		return "#22C55E"
	case PasswordVeryStrong:
		return "#10B981"
	default:
		return "#6B7280"
	}
}
