package models

import (
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func TestUser_ID(t *testing.T) {
	user := &User{}
	if user.ID != "" {
		t.Errorf("expected empty ID, got %s", user.ID)
	}
}

func TestUser_Fields(t *testing.T) {
	now := time.Now()
	user := &User{
		ID:           "user-123",
		Email:        "admin@example.com",
		PasswordHash: "hash123",
		Role:         RoleAdmin,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if user.ID != "user-123" {
		t.Errorf("expected ID 'user-123', got %s", user.ID)
	}
	if user.Email != "admin@example.com" {
		t.Errorf("expected Email 'admin@example.com', got %s", user.Email)
	}
	if user.Role != RoleAdmin {
		t.Errorf("expected Role 'admin', got %s", user.Role)
	}
}

func TestUserRole_String(t *testing.T) {
	tests := []struct {
		role UserRole
		want string
	}{
		{RoleAdmin, "admin"},
		{RoleSuperAdmin, "super_admin"},
	}

	for _, tt := range tests {
		if string(tt.role) != tt.want {
			t.Errorf("Role %v: expected %s, got %s", tt.role, tt.want, string(tt.role))
		}
	}
}

func TestNewAdmin(t *testing.T) {
	user := NewAdmin("admin@example.com", "password123")

	if user.Email != "admin@example.com" {
		t.Errorf("expected email 'admin@example.com', got %s", user.Email)
	}
	if !user.IsAdmin() {
		t.Error("expected IsAdmin() to return true")
	}
}

func TestUser_IsAdmin(t *testing.T) {
	tests := []struct {
		role    UserRole
		isAdmin bool
	}{
		{RoleAdmin, true},
		{RoleSuperAdmin, true},
		{UserRole("user"), false},
	}

	for _, tt := range tests {
		user := &User{Role: tt.role}
		if user.IsAdmin() != tt.isAdmin {
			t.Errorf("Role %s: expected IsAdmin=%v, got %v", tt.role, tt.isAdmin, user.IsAdmin())
		}
	}
}

func TestUser_SetPassword(t *testing.T) {
	user := &User{}
	err := user.SetPassword("testpassword123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify password was hashed
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte("testpassword123"))
	if err != nil {
		t.Error("password hash does not match original password")
	}
}

func TestUser_CheckPassword(t *testing.T) {
	user := &User{PasswordHash: ""}
	hash, _ := bcrypt.GenerateFromPassword([]byte("correctpassword"), bcrypt.DefaultCost)
	user.PasswordHash = string(hash)

	if !user.CheckPassword("correctpassword") {
		t.Error("expected CheckPassword to return true for correct password")
	}

	if user.CheckPassword("wrongpassword") {
		t.Error("expected CheckPassword to return false for wrong password")
	}
}

func TestUser_Fields_AllRoles(t *testing.T) {
	roles := []UserRole{RoleAdmin, RoleSuperAdmin}
	for _, role := range roles {
		user := NewAdmin("test@example.com", "password")
		user.Role = role
		if !user.IsAdmin() {
			t.Errorf("expected role %s to be admin", role)
		}
	}
}

func TestGenerateID(t *testing.T) {
	id1 := generateID()

	// IDs should contain a timestamp-like prefix with random suffix
	if len(id1) < 10 {
		t.Errorf("ID too short: %s", id1)
	}

	// IDs should contain a hyphen
	found := false
	for _, c := range id1 {
		if c == '-' {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected ID to contain hyphen")
	}
}

func TestRandomString(t *testing.T) {
	s1 := randomString(8)
	s2 := randomString(8)

	if len(s1) != 8 {
		t.Errorf("expected length 8, got %d", len(s1))
	}
	if len(s2) != 8 {
		t.Errorf("expected length 8, got %d", len(s2))
	}

	// Different calls should produce different results
	if s1 == s2 {
		t.Error("expected different strings")
	}
}