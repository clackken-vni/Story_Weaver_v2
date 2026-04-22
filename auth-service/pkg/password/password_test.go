package password_test

import (
	"testing"

	"storyweaver/auth-service/pkg/password"
)

func TestHashPassword(t *testing.T) {
	plain := "testpassword123"

	hash, err := password.HashPassword(plain)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if hash == "" {
		t.Error("expected non-empty hash")
	}

	if hash == plain {
		t.Error("hash should not equal plain password")
	}
}

func TestCheckPassword(t *testing.T) {
	plain := "testpassword123"

	hash, err := password.HashPassword(plain)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if !password.CheckPassword(hash, plain) {
		t.Error("CheckPassword should return true for correct password")
	}

	if password.CheckPassword(hash, "wrongpassword") {
		t.Error("CheckPassword should return false for incorrect password")
	}
}

func TestHashPassword_DifferentSalts(t *testing.T) {
	plain := "samepassword"

	hash1, _ := password.HashPassword(plain)
	hash2, _ := password.HashPassword(plain)

	if hash1 == hash2 {
		t.Error("same password should produce different hashes (due to salt)")
	}
}