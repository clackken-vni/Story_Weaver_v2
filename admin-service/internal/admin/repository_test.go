package admin

import (
	"database/sql"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestNewPostgresRepository(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)
	if repo == nil {
		t.Error("expected non-nil repository")
	}
	if repo.db != db {
		t.Error("expected db to be set")
	}
}

func TestPostgresRepository_InitSchema(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	// The schema has 7 separate statements
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS users").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS api_keys").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS subscriptions").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS idx_users_email").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS idx_users_last_login").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id").
		WillReturnResult(sqlmock.NewResult(0, 0))

	err = repo.InitSchema()
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestPostgresRepository_GetUserStats(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	rows := sqlmock.NewRows([]string{"total_users", "active_users", "new_users_today"}).
		AddRow(100, 50, 10)

	mock.ExpectQuery("SELECT").
		WillReturnRows(rows)

	stats, err := repo.GetUserStats()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stats.TotalUsers != 100 {
		t.Errorf("expected TotalUsers=100, got %d", stats.TotalUsers)
	}
	if stats.ActiveUsers != 50 {
		t.Errorf("expected ActiveUsers=50, got %d", stats.ActiveUsers)
	}
	if stats.NewUsersToday != 10 {
		t.Errorf("expected NewUsersToday=10, got %d", stats.NewUsersToday)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestPostgresRepository_GetUserStats_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	mock.ExpectQuery("SELECT").
		WillReturnError(sql.ErrConnDone)

	_, err = repo.GetUserStats()
	if err == nil {
		t.Error("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestPostgresRepository_GetUsageStats(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	rows := sqlmock.NewRows([]string{"total_projects", "total_generations", "active_projects"}).
		AddRow(500, 1000, 200)

	mock.ExpectQuery("SELECT").
		WillReturnRows(rows)

	stats, err := repo.GetUsageStats()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stats.TotalProjects != 500 {
		t.Errorf("expected TotalProjects=500, got %d", stats.TotalProjects)
	}
	if stats.TotalGenerations != 1000 {
		t.Errorf("expected TotalGenerations=1000, got %d", stats.TotalGenerations)
	}
	if stats.ActiveProjects != 200 {
		t.Errorf("expected ActiveProjects=200, got %d", stats.ActiveProjects)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestPostgresRepository_GetUsageStats_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	mock.ExpectQuery("SELECT").
		WillReturnError(sql.ErrConnDone)

	_, err = repo.GetUsageStats()
	if err == nil {
		t.Error("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestPostgresRepository_GetAPIKeyUsage(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	lastUsed := time.Now()
	rows := sqlmock.NewRows([]string{"id", "name", "usage_count", "last_used_at"}).
		AddRow("key-1", "Test Key 1", 100, lastUsed).
		AddRow("key-2", "Test Key 2", 200, lastUsed)

	mock.ExpectQuery("SELECT").
		WillReturnRows(rows)

	usage, err := repo.GetAPIKeyUsage()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(usage) != 2 {
		t.Errorf("expected 2 API keys, got %d", len(usage))
	}

	if usage[0].KeyID != "key-1" {
		t.Errorf("expected KeyID='key-1', got %s", usage[0].KeyID)
	}
	if usage[0].KeyName != "Test Key 1" {
		t.Errorf("expected KeyName='Test Key 1', got %s", usage[0].KeyName)
	}
	if usage[0].UsageCount != 100 {
		t.Errorf("expected UsageCount=100, got %d", usage[0].UsageCount)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestPostgresRepository_GetAPIKeyUsage_Empty(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	rows := sqlmock.NewRows([]string{"id", "name", "usage_count", "last_used_at"})

	mock.ExpectQuery("SELECT").
		WillReturnRows(rows)

	usage, err := repo.GetAPIKeyUsage()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(usage) != 0 {
		t.Errorf("expected 0 API keys, got %d", len(usage))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestPostgresRepository_GetAPIKeyUsage_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	mock.ExpectQuery("SELECT").
		WillReturnError(sql.ErrConnDone)

	_, err = repo.GetAPIKeyUsage()
	if err == nil {
		t.Error("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestPostgresRepository_GetSubscriptionStats(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	rows := sqlmock.NewRows([]string{"total_subscriptions", "active_subscriptions", "trial_subscriptions"}).
		AddRow(200, 150, 25)

	mock.ExpectQuery("SELECT").
		WillReturnRows(rows)

	stats, err := repo.GetSubscriptionStats()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stats.TotalSubscriptions != 200 {
		t.Errorf("expected TotalSubscriptions=200, got %d", stats.TotalSubscriptions)
	}
	if stats.ActiveSubscriptions != 150 {
		t.Errorf("expected ActiveSubscriptions=150, got %d", stats.ActiveSubscriptions)
	}
	if stats.TrialSubscriptions != 25 {
		t.Errorf("expected TrialSubscriptions=25, got %d", stats.TrialSubscriptions)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestPostgresRepository_GetSubscriptionStats_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPostgresRepository(db)

	mock.ExpectQuery("SELECT").
		WillReturnError(sql.ErrConnDone)

	_, err = repo.GetSubscriptionStats()
	if err == nil {
		t.Error("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}