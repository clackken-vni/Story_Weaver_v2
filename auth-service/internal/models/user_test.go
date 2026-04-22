package models_test

import (
	"testing"
	"time"

	"storyweaver/auth-service/internal/models"
)

func TestNewUser(t *testing.T) {
	email := "test@example.com"
	passHash := "hash123"
	role := models.RoleUser

	user := models.NewUser(email, passHash, role)

	if user.Email != email {
		t.Errorf("expected Email %s, got %s", email, user.Email)
	}
	if user.PasswordHash != passHash {
		t.Errorf("expected PasswordHash %s, got %s", passHash, user.PasswordHash)
	}
	if user.Role != role {
		t.Errorf("expected Role %s, got %s", role, user.Role)
	}
	if user.ID == "" {
		t.Error("expected non-empty ID")
	}
	if user.CreatedAt.IsZero() {
		t.Error("expected non-zero CreatedAt")
	}
	if user.UpdatedAt.IsZero() {
		t.Error("expected non-zero UpdatedAt")
	}
}

func TestUser_SetRole(t *testing.T) {
	user := &models.User{Role: models.RoleUser}

	user.SetRole(models.RoleAdmin)

	if user.Role != models.RoleAdmin {
		t.Errorf("expected Role admin, got %s", user.Role)
	}
}

func TestUser_IsAdmin(t *testing.T) {
	tests := []struct {
		role    models.UserRole
		isAdmin bool
	}{
		{models.RoleUser, false},
		{models.RoleAdmin, true},
		{models.RoleSuperAdmin, true},
	}

	for _, tt := range tests {
		user := &models.User{Role: tt.role}
		if user.IsAdmin() != tt.isAdmin {
			t.Errorf("Role %s: expected IsAdmin=%v, got %v", tt.role, tt.isAdmin, user.IsAdmin())
		}
	}
}

func TestUser_Validate(t *testing.T) {
	tests := []struct {
		name    string
		user    *models.User
		wantErr bool
	}{
		{
			name:    "valid user",
			user:    models.NewUser("test@example.com", "hash123", models.RoleUser),
			wantErr: false,
		},
		{
			name:    "invalid email",
			user:    &models.User{ID: "123", Email: "", PasswordHash: "hash", Role: models.RoleUser},
			wantErr: true,
		},
		{
			name:    "invalid role",
			user:    &models.User{ID: "123", Email: "test@example.com", PasswordHash: "hash", Role: ""},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.user.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestUser_Timestamps(t *testing.T) {
	before := time.Now().Add(-time.Second)

	user := models.NewUser("test@example.com", "hash", models.RoleUser)

	after := time.Now().Add(time.Second)

	if user.CreatedAt.Before(before) || user.CreatedAt.After(after) {
		t.Error("CreatedAt not within expected range")
	}
	if user.UpdatedAt.Before(before) || user.UpdatedAt.After(after) {
		t.Error("UpdatedAt not within expected range")
	}
}