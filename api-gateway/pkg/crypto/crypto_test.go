package crypto_test

import (
	"testing"

	"storyweaver/api-gateway/pkg/crypto"
)

func TestEncodeBase64(t *testing.T) {
	data := []byte("Hello, World!")
	encoded := crypto.EncodeBase64(data)

	if encoded == "" {
		t.Error("expected non-empty encoded string")
	}

	decoded, err := crypto.DecodeBase64(encoded)
	if err != nil {
		t.Fatalf("DecodeBase64 failed: %v", err)
	}

	if string(decoded) != string(data) {
		t.Error("round-trip failed")
	}
}

func TestDecodeBase64_Invalid(t *testing.T) {
	_, err := crypto.DecodeBase64("!!!invalid-base64!!!")
	if err == nil {
		t.Error("expected error for invalid base64")
	}
}

func TestDecodeBase64(t *testing.T) {
	original := []byte("Test data")
	encoded := crypto.EncodeBase64(original)

	decoded, err := crypto.DecodeBase64(encoded)
	if err != nil {
		t.Fatalf("DecodeBase64 failed: %v", err)
	}

	if string(decoded) != string(original) {
		t.Errorf("got %s, want %s", string(decoded), string(original))
	}
}

func TestEncryptDecrypt_LongText(t *testing.T) {
	key := []byte("1234567890123456")
	plaintext := []byte("This is a much longer piece of text that should still be encryptable and decryptable.")

	ciphertext, err := crypto.Encrypt(plaintext, key)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	decrypted, err := crypto.Decrypt(ciphertext, key)
	if err != nil {
		t.Fatalf("Decrypt failed: %v", err)
	}

	if string(decrypted) != string(plaintext) {
		t.Error("long text round-trip failed")
	}
}

func TestEncryptDecrypt_Unicode(t *testing.T) {
	key := []byte("1234567890123456")
	plaintext := []byte("Unicode: 你好世界 🌟 émojis")

	ciphertext, err := crypto.Encrypt(plaintext, key)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	decrypted, err := crypto.Decrypt(ciphertext, key)
	if err != nil {
		t.Fatalf("Decrypt failed: %v", err)
	}

	if string(decrypted) != string(plaintext) {
		t.Error("unicode round-trip failed")
	}
}

func TestDecrypt_WrongKeyProducesGarbage(t *testing.T) {
	key1 := []byte("1234567890123456")
	key2 := []byte("abcdefghijklmnop")
	plaintext := []byte("Secret")

	ciphertext, _ := crypto.Encrypt(plaintext, key1)
	decrypted, err := crypto.Decrypt(ciphertext, key2)

	// Should either error or produce garbage, not the original
	if err == nil && string(decrypted) == string(plaintext) {
		t.Error("wrong key should not decrypt correctly")
	}
}

func TestDecrypt_CiphertextTooShort(t *testing.T) {
	key := []byte("1234567890123456")

	_, err := crypto.Decrypt([]byte("short"), key)
	if err == nil {
		t.Error("expected error for short ciphertext")
	}
}

func TestNewAESKey_NotNil(t *testing.T) {
	key, err := crypto.NewAESKey()
	if err != nil {
		t.Fatalf("NewAESKey failed: %v", err)
	}
	if key == nil {
		t.Error("key should not be nil")
	}
}