package admin

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type SettingSchema struct {
	Key                string
	Group              string
	Type               string
	Required           bool
	Constraints        []string
	IsSecret           bool
	MaskStrategy       string
	HotReloadSupported bool
	Description        string
}

type SettingValue struct {
	Key       string
	Group     string
	Value     string
	IsSecret  bool
	Version   int64
	UpdatedBy string
	UpdatedAt time.Time
}

type SettingHistory struct {
	SettingKey  string
	FromVersion int64
	ToVersion   int64
	OldValue    string
	NewValue    string
	ChangedBy   string
	ChangedAt   time.Time
	Reason      string
	TraceID     string
}

type SettingsUpdateRequest struct {
	Value  string `json:"value"`
	Reason string `json:"reason"`
}

func (s SettingValue) ToMasked() string {
	if !s.IsSecret {
		return s.Value
	}
	if len(s.Value) <= 4 {
		return "****"
	}
	return strings.Repeat("*", len(s.Value)-4) + s.Value[len(s.Value)-4:]
}

func ValidateBySchema(schema *SettingSchema, rawValue string) error {
	if schema == nil {
		return fmt.Errorf("schema is required")
	}

	if schema.Required && strings.TrimSpace(rawValue) == "" {
		return fmt.Errorf("value is required")
	}

	switch schema.Type {
	case "number":
		if _, err := strconv.ParseFloat(rawValue, 64); err != nil {
			return fmt.Errorf("value must be number")
		}
	case "bool":
		if rawValue != "true" && rawValue != "false" {
			return fmt.Errorf("value must be bool")
		}
	case "string", "json", "select":
		// validated by constraints below
	default:
		return fmt.Errorf("unsupported setting type: %s", schema.Type)
	}

	for _, c := range schema.Constraints {
		if strings.HasPrefix(c, "regex:") {
			pattern := strings.TrimPrefix(c, "regex:")
			r, err := regexp.Compile(pattern)
			if err != nil {
				return fmt.Errorf("invalid regex constraint")
			}
			if !r.MatchString(rawValue) {
				return fmt.Errorf("value does not match regex")
			}
		}
	}

	return nil
}

func EncryptSecretValue(secret, key string) (string, error) {
	if len(key) != 32 {
		return "", fmt.Errorf("encryption key must be 32 bytes")
	}
	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	ciphertext := gcm.Seal(nonce, nonce, []byte(secret), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func DecryptSecretValue(ciphertext, key string) (string, error) {
	if len(key) != 32 {
		return "", fmt.Errorf("encryption key must be 32 bytes")
	}
	decoded, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonceSize := gcm.NonceSize()
	if len(decoded) < nonceSize {
		return "", fmt.Errorf("invalid ciphertext")
	}
	nonce, payload := decoded[:nonceSize], decoded[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, payload, nil)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}
