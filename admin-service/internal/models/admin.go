package models

import (
	crand "crypto/rand"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// UserRole defines the role of a user
type UserRole string

const (
	RoleAdmin     UserRole = "admin"
	RoleSuperAdmin UserRole = "super_admin"
)

// User represents an admin user
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         UserRole  `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// NewAdmin creates a new admin user with hashed password
func NewAdmin(email, password string) *User {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	now := time.Now()
	return &User{
		ID:           generateID(),
		Email:        email,
		PasswordHash: string(hash),
		Role:         RoleAdmin,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

// IsAdmin returns true if the user has admin role
func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin || u.Role == RoleSuperAdmin
}

// SetPassword sets the user's password hash
func (u *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

// CheckPassword verifies the password against the hash
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

func generateID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	randomBytes := make([]byte, n)
	if _, err := crand.Read(randomBytes); err != nil {
		for i := range b {
			b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
		}
		return string(b)
	}
	for i := range b {
		b[i] = letters[int(randomBytes[i])%len(letters)]
	}
	return string(b)
}
