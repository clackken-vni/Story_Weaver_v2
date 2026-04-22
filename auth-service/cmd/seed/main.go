package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"storyweaver/auth-service/internal/models"
	"storyweaver/auth-service/internal/repository"
	"storyweaver/auth-service/pkg/password"

	_ "github.com/lib/pq"
)

func main() {
	email := os.Getenv("SUPER_ADMIN_EMAIL")
	pw := os.Getenv("SUPER_ADMIN_PASSWORD")

	if email == "" || pw == "" {
		log.Fatal("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://sw_user:sw_secret@localhost:5432/storyweaver?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("failed to ping db: %v", err)
	}

	repo := repository.NewPostgresRepository(db)
	if err := repo.InitSchema(ctx); err != nil {
		log.Fatalf("failed to init schema: %v", err)
	}

	if err := seedSuperAdmin(ctx, repo, email, pw); err != nil {
		log.Fatalf("seed super admin failed: %v", err)
	}

	log.Printf("Super admin ready: %s", email)
}

func seedSuperAdmin(ctx context.Context, repo *repository.PostgresRepository, email, plainPassword string) error {
	existing, err := repo.FindByEmail(ctx, email)
	if err != nil && err != repository.ErrNotFound {
		return fmt.Errorf("lookup failed: %w", err)
	}

	hash, err := password.HashPassword(plainPassword)
	if err != nil {
		return fmt.Errorf("hash password failed: %w", err)
	}

	if existing != nil {
		// user exists — ensure role is super_admin
		if existing.Role == models.RoleSuperAdmin {
			log.Printf("super admin already exists with correct role, skipping")
			return nil
		}
		_, err := repo.UpdateRole(ctx, existing.ID, models.RoleSuperAdmin)
		if err != nil {
			return fmt.Errorf("update role failed: %w", err)
		}
		log.Printf("updated existing user %s to super_admin", email)
		return nil
	}

	// create new super admin
	user := models.NewUser(email, hash, models.RoleSuperAdmin)
	if err := repo.Create(ctx, user); err != nil {
		return fmt.Errorf("create user failed: %w", err)
	}
	log.Printf("created super admin: %s (id: %s)", email, user.ID)
	return nil
}
