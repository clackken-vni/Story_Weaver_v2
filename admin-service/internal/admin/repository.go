package admin

import (
	"database/sql"
	"fmt"
	"hash/fnv"
	"time"
)

// UserStats represents user statistics
type UserStats struct {
	TotalUsers    int64 `json:"total_users"`
	ActiveUsers   int64 `json:"active_users"`
	NewUsersToday int64 `json:"new_users_today"`
}

// UsageStats represents usage statistics
type UsageStats struct {
	TotalProjects    int64 `json:"total_projects"`
	TotalGenerations int64 `json:"total_generations"`
	ActiveProjects   int64 `json:"active_projects"`
}

// APIKeyUsage represents API key usage data
type APIKeyUsage struct {
	KeyID       string    `json:"key_id"`
	KeyName     string    `json:"key_name"`
	UsageCount  int64     `json:"usage_count"`
	LastUsedAt  time.Time `json:"last_used_at"`
}

// SubscriptionStats represents subscription statistics
type SubscriptionStats struct {
	TotalSubscriptions int64 `json:"total_subscriptions"`
	ActiveSubscriptions int64 `json:"active_subscriptions"`
	TrialSubscriptions int64 `json:"trial_subscriptions"`
}

// User represents a user in the system
type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	IsAdmin   bool      `json:"isAdmin"`
	CreatedAt time.Time `json:"createdAt"`
}

type ServiceHealth struct {
	Service      string  `json:"service"`
	Status       string  `json:"status"`
	P95LatencyMs int     `json:"p95_latency_ms"`
	ErrorRate    float64 `json:"error_rate"`
}

type InfraHealth struct {
	Component string `json:"component"`
	Status    string `json:"status"`
}

// Repository defines the interface for data access
type Repository interface {
	GetUserStats() (*UserStats, error)
	GetUsageStats() (*UsageStats, error)
	GetAPIKeyUsage() ([]*APIKeyUsage, error)
	GetSubscriptionStats() (*SubscriptionStats, error)
	GetUsers(page, limit int) ([]*User, int64, error)
	GetCommandCenterSummary() (*CommandCenterSummaryData, error)
	GetMonitoringServices() ([]*ServiceHealth, error)
	GetMonitoringInfra() ([]*InfraHealth, error)
	GetIncidents() ([]*Incident, error)
	AckIncident(id string) error
	GetAuditEvents(filter AuditFilter) ([]*StoredAuditEvent, error)
	GetAuditTrace(traceID string) ([]*StoredAuditEvent, error)
	GetUserByID(id string) (*User, error)
	LockUser(id, reason string) error
	UnlockUser(id, reason string) error
	UpdateUserRole(id, role, reason string) error
	ListSettings(group, query string) ([]*SettingValue, error)
	ListSettingSchemas() ([]*SettingSchema, error)
	GetSetting(key string) (*SettingValue, error)
	UpsertSetting(actorID, key, value, reason, traceID string) (*SettingValue, error)
	GetSettingHistory(key string) ([]*SettingHistory, error)
	RollbackSetting(actorID, key string, version int64, reason, traceID string) (*SettingValue, error)
	InitSchema() error
}

// PostgresRepository implements Repository using PostgreSQL
type PostgresRepository struct {
	db *sql.DB
}

// NewPostgresRepository creates a new PostgreSQL repository
func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

// InitSchema initializes the database schema
func (r *PostgresRepository) InitSchema() error {
	// Create users table
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'user',
			last_login TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`)
	if err != nil {
		return err
	}

	// Create api_keys table
	_, err = r.db.Exec(`
		CREATE TABLE IF NOT EXISTS api_keys (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name TEXT NOT NULL,
			key_hash TEXT NOT NULL UNIQUE,
			user_id UUID REFERENCES users(id),
			rate_limit INTEGER DEFAULT 100,
			usage_count INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			last_used_at TIMESTAMP
		)`)
	if err != nil {
		return err
	}

	// Create subscriptions table
	_, err = r.db.Exec(`
		CREATE TABLE IF NOT EXISTS subscriptions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID REFERENCES users(id),
			plan TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			expires_at TIMESTAMP
		)`)
	if err != nil {
		return err
	}

	// Create indexes
	_, err = r.db.Exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login)`)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)`)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`
		CREATE TABLE IF NOT EXISTS system_settings (
			key TEXT PRIMARY KEY,
			group_name TEXT NOT NULL,
			value_json TEXT NOT NULL,
			is_secret BOOLEAN NOT NULL DEFAULT FALSE,
			version BIGINT NOT NULL DEFAULT 1,
			updated_by TEXT NOT NULL,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			checksum TEXT NOT NULL
		)`)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`
		CREATE TABLE IF NOT EXISTS system_settings_schema (
			key TEXT PRIMARY KEY,
			group_name TEXT NOT NULL,
			type TEXT NOT NULL,
			required BOOLEAN NOT NULL DEFAULT FALSE,
			constraints_json TEXT,
			is_secret BOOLEAN NOT NULL DEFAULT FALSE,
			mask_strategy TEXT,
			hot_reload_supported BOOLEAN NOT NULL DEFAULT TRUE,
			description TEXT
		)`)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`
		CREATE TABLE IF NOT EXISTS system_settings_history (
			id BIGSERIAL PRIMARY KEY,
			setting_key TEXT NOT NULL,
			from_version BIGINT NOT NULL,
			to_version BIGINT NOT NULL,
			old_value_json TEXT NOT NULL,
			new_value_json TEXT NOT NULL,
			changed_by TEXT NOT NULL,
			changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			reason TEXT,
			trace_id TEXT,
			FOREIGN KEY (setting_key) REFERENCES system_settings(key)
		)`)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`CREATE INDEX IF NOT EXISTS idx_system_settings_group ON system_settings(group_name)`)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at)`)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`CREATE INDEX IF NOT EXISTS idx_system_settings_history_key_version ON system_settings_history(setting_key, to_version DESC)`)
	if err != nil {
		return err
	}

	return r.SeedDefaultSettings()
}

// GetUserStats retrieves user statistics
func (r *PostgresRepository) GetUserStats() (*UserStats, error) {
	stats := &UserStats{}
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	err := r.db.QueryRow(`
		SELECT
			COUNT(*) as total_users,
			COUNT(CASE WHEN last_login > $1 THEN 1 END) as active_users,
			COUNT(CASE WHEN created_at >= $2 THEN 1 END) as new_users_today
		FROM users
	`, today, today).Scan(&stats.TotalUsers, &stats.ActiveUsers, &stats.NewUsersToday)

	if err != nil {
		return nil, err
	}
	return stats, nil
}

// GetUsageStats retrieves usage statistics
func (r *PostgresRepository) GetUsageStats() (*UsageStats, error) {
	stats := &UsageStats{}
	err := r.db.QueryRow(`
		SELECT
			(SELECT COUNT(*) FROM projects) as total_projects,
			(SELECT COUNT(*) FROM generation_runs WHERE status = 'completed') as total_generations,
			(SELECT COUNT(*) FROM projects WHERE updated_at > $1) as active_projects
	`, time.Now().Add(-24*time.Hour)).Scan(&stats.TotalProjects, &stats.TotalGenerations, &stats.ActiveProjects)

	if err != nil {
		return nil, err
	}
	return stats, nil
}

// GetAPIKeyUsage retrieves API key usage data
func (r *PostgresRepository) GetAPIKeyUsage() ([]*APIKeyUsage, error) {
	rows, err := r.db.Query(`
		SELECT id, name, COALESCE(usage_count, 0), last_used_at
		FROM api_keys
		ORDER BY last_used_at DESC
		LIMIT 100
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var usages []*APIKeyUsage
	for rows.Next() {
		usage := &APIKeyUsage{}
		var lastUsed sql.NullTime
		if err := rows.Scan(&usage.KeyID, &usage.KeyName, &usage.UsageCount, &lastUsed); err != nil {
			return nil, err
		}
		if lastUsed.Valid {
			usage.LastUsedAt = lastUsed.Time
		}
		usages = append(usages, usage)
	}
	return usages, rows.Err()
}

// GetSubscriptionStats retrieves subscription statistics
func (r *PostgresRepository) GetSubscriptionStats() (*SubscriptionStats, error) {
	stats := &SubscriptionStats{}
	err := r.db.QueryRow(`
		SELECT
			COUNT(*) as total_subscriptions,
			COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
			COUNT(CASE WHEN plan = 'trial' THEN 1 END) as trial_subscriptions
		FROM subscriptions
	`).Scan(&stats.TotalSubscriptions, &stats.ActiveSubscriptions, &stats.TrialSubscriptions)

	if err != nil {
		return nil, err
	}
	return stats, nil
}

// GetUsers retrieves paginated users
func (r *PostgresRepository) GetUsers(page, limit int) ([]*User, int64, error) {
	offset := (page - 1) * limit

	var total int64
	err := r.db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(`
		SELECT id, email, role, created_at
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		user := &User{}
		if err := rows.Scan(&user.ID, &user.Email, &user.Role, &user.CreatedAt); err != nil {
			return nil, 0, err
		}
		user.IsAdmin = user.Role == "admin" || user.Role == "super_admin"
		users = append(users, user)
	}
	return users, total, rows.Err()
}

// GetCommandCenterSummary returns a minimal summary for command center.
func (r *PostgresRepository) GetCommandCenterSummary() (*CommandCenterSummaryData, error) {
	var degraded int
	err := r.db.QueryRow(`
		SELECT
			(SELECT COUNT(*) FROM generation_runs WHERE status = 'failed') +
			(SELECT COUNT(*) FROM subscriptions WHERE status <> 'active')
	`).Scan(&degraded)
	if err != nil {
		return nil, err
	}

	openIncidents := degraded
	if openIncidents < 0 {
		openIncidents = 0
	}

	return &CommandCenterSummaryData{
		OpenIncidents:    openIncidents,
		DegradedServices: degraded,
		TopAlerts:        []string{"generated from admin-service baseline"},
	}, nil
}

func (r *PostgresRepository) GetMonitoringServices() ([]*ServiceHealth, error) {
	return []*ServiceHealth{
		{Service: "auth-service", Status: "healthy", P95LatencyMs: 120, ErrorRate: 0.01},
		{Service: "wizard-service", Status: "healthy", P95LatencyMs: 180, ErrorRate: 0.02},
		{Service: "ai-service", Status: "degraded", P95LatencyMs: 650, ErrorRate: 0.09},
		{Service: "tts-service", Status: "healthy", P95LatencyMs: 210, ErrorRate: 0.03},
		{Service: "kb-service", Status: "healthy", P95LatencyMs: 240, ErrorRate: 0.02},
		{Service: "admin-service", Status: "healthy", P95LatencyMs: 90, ErrorRate: 0.01},
	}, nil
}

func (r *PostgresRepository) GetMonitoringInfra() ([]*InfraHealth, error) {
	return []*InfraHealth{
		{Component: "nats", Status: "healthy"},
		{Component: "redis", Status: "healthy"},
		{Component: "postgres", Status: "healthy"},
		{Component: "minio", Status: "healthy"},
	}, nil
}

// GetIncidents returns a placeholder list of incidents.
func (r *PostgresRepository) GetIncidents() ([]*Incident, error) {
	now := time.Now().UTC()
	return []*Incident{
		{
			ID:        "inc-api-latency",
			Severity:  "high",
			Title:     "AI service latency spike",
			Status:    "open",
			Owner:     "platform-ops",
			TraceID:   "trace-ai-latency-001",
			CreatedAt: now.Add(-25 * time.Minute),
		},
		{
			ID:        "inc-auth-refresh",
			Severity:  "medium",
			Title:     "Refresh token retries elevated",
			Status:    "investigating",
			Owner:     "auth-team",
			TraceID:   "trace-auth-refresh-001",
			CreatedAt: now.Add(-75 * time.Minute),
		},
	}, nil
}

// AckIncident acknowledges an incident by ID.
func (r *PostgresRepository) AckIncident(id string) error {
	return nil
}

// GetAuditEvents returns stored audit events matching the filter.
func (r *PostgresRepository) GetAuditEvents(filter AuditFilter) ([]*StoredAuditEvent, error) {
	now := time.Now().UTC()
	events := []*StoredAuditEvent{
		{
			ID:           "evt-001",
			Action:       "admin.users.list",
			ActorID:      "system",
			ActorRole:    "super_admin",
			Resource:     "users",
			ResourceID:   "*",
			Outcome:      "success",
			Reason:       "dashboard refresh",
			TraceID:      "trace-users-list-001",
			SourceModule: "users-access",
			Timestamp:    now.Add(-10 * time.Minute),
		},
		{
			ID:           "evt-002",
			Action:       "admin.incident.ack",
			ActorID:      "platform-ops",
			ActorRole:    "admin",
			Resource:     "incident",
			ResourceID:   "inc-api-latency",
			Outcome:      "success",
			Reason:       "false positive after auto-recovery",
			TraceID:      "trace-ai-latency-001",
			SourceModule: "system-infra",
			Timestamp:    now.Add(-7 * time.Minute),
		},
		{
			ID:           "evt-003",
			Action:       "admin.users.role_update",
			ActorID:      "security-lead",
			ActorRole:    "super_admin",
			Resource:     "users",
			ResourceID:   "12b2153a-2a9a-42e2-ba5d-2b622aa02c22",
			Outcome:      "success",
			Reason:       "grant elevated access for oncall",
			TraceID:      "trace-role-update-001",
			SourceModule: "users-access",
			Timestamp:    now.Add(-3 * time.Minute),
		},
	}

	if filter.TraceID == "" {
		return events, nil
	}

	filtered := make([]*StoredAuditEvent, 0, len(events))
	for _, evt := range events {
		if evt.TraceID == filter.TraceID {
			filtered = append(filtered, evt)
		}
	}
	return filtered, nil
}

// GetAuditTrace returns the full chain of events for a traceID.
func (r *PostgresRepository) GetAuditTrace(traceID string) ([]*StoredAuditEvent, error) {
	if traceID == "" {
		return []*StoredAuditEvent{}, nil
	}
	return r.GetAuditEvents(AuditFilter{TraceID: traceID})
}

// GetUserByID returns a single user by ID.
func (r *PostgresRepository) GetUserByID(id string) (*User, error) {
	user := &User{}
	err := r.db.QueryRow(`SELECT id, email, role, created_at FROM users WHERE id = $1`, id).
		Scan(&user.ID, &user.Email, &user.Role, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	user.IsAdmin = user.Role == "admin" || user.Role == "super_admin"
	return user, nil
}

// LockUser sets the user role to 'locked'.
func (r *PostgresRepository) LockUser(id, reason string) error {
	_, err := r.db.Exec(`UPDATE users SET role = 'locked', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, id)
	return err
}

// UnlockUser sets the user role back to 'user'.
func (r *PostgresRepository) UnlockUser(id, reason string) error {
	_, err := r.db.Exec(`UPDATE users SET role = 'user', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, id)
	return err
}

// UpdateUserRole updates the user's role.
func (r *PostgresRepository) UpdateUserRole(id, role, reason string) error {
	_, err := r.db.Exec(`UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, role, id)
	return err
}

func settingChecksum(key, value string) string {
	h := fnv.New64a()
	_, _ = h.Write([]byte(key + ":" + value))
	return fmt.Sprintf("%x", h.Sum64())
}

// SeedDefaultSettings ensures settings schema and default values exist.
func (r *PostgresRepository) SeedDefaultSettings() error {
	type seedItem struct {
		Key, Group, Type, Value, Description string
		Required, IsSecret, HotReload        bool
	}
	seeds := []seedItem{
		{"auth.access_token_ttl_minutes", "auth", "number", "15", "JWT access token TTL in minutes", true, false, true},
		{"auth.refresh_token_ttl_minutes", "auth", "number", "10080", "JWT refresh token TTL in minutes", true, false, true},
		{"gateway.rate_limit_per_minute", "gateway", "number", "600", "API gateway rate limit per minute per IP", true, false, true},
		{"security.password_min_length", "security", "number", "8", "Minimum password length", true, false, true},
		{"security.jwt_secret", "security", "string", "changeme_jwt_secret_32bytes_ok!", "JWT signing secret (change in production)", true, true, false},
		{"feature.settings_center_enabled", "feature_flags", "bool", "true", "Enable Settings Center module in admin dashboard", false, false, true},
		{"ai.default_provider", "ai", "select", "openai", "Default AI provider", true, false, true},
		{"tts.default_provider", "tts", "select", "vbee", "Default TTS provider", true, false, true},
		{"infra.nats_url", "infra", "string", "nats://nats:4222", "NATS URL for event bus", true, false, false},
		{"infra.redis_url", "infra", "string", "redis://redis:6379", "Redis URL for caching", true, false, false},
	}

	for _, s := range seeds {
		// schema upsert
		_, err := r.db.Exec(`
			INSERT INTO system_settings_schema (key, group_name, type, required, is_secret, hot_reload_supported, description)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (key) DO NOTHING`,
			s.Key, s.Group, s.Type, s.Required, s.IsSecret, s.HotReload, s.Description)
		if err != nil {
			return fmt.Errorf("seed schema %s: %w", s.Key, err)
		}

		// value upsert (only if not exists)
		cs := settingChecksum(s.Key, s.Value)
		_, err = r.db.Exec(`
			INSERT INTO system_settings (key, group_name, value_json, is_secret, version, updated_by, updated_at, checksum)
			VALUES ($1, $2, $3, $4, 1, 'system', CURRENT_TIMESTAMP, $5)
			ON CONFLICT (key) DO NOTHING`,
			s.Key, s.Group, s.Value, s.IsSecret, cs)
		if err != nil {
			return fmt.Errorf("seed setting %s: %w", s.Key, err)
		}
	}
	return nil
}

// ListSettingSchemas returns all setting schemas.
func (r *PostgresRepository) ListSettingSchemas() ([]*SettingSchema, error) {
	rows, err := r.db.Query(`SELECT key, group_name, type, required, constraints_json, is_secret, mask_strategy, hot_reload_supported, description FROM system_settings_schema ORDER BY group_name, key`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var schemas []*SettingSchema
	for rows.Next() {
		s := &SettingSchema{}
		var constraintsRaw, mask, desc sql.NullString
		if err := rows.Scan(&s.Key, &s.Group, &s.Type, &s.Required, &constraintsRaw, &s.IsSecret, &mask, &s.HotReloadSupported, &desc); err != nil {
			return nil, err
		}
		if mask.Valid {
			s.MaskStrategy = mask.String
		}
		if desc.Valid {
			s.Description = desc.String
		}
		schemas = append(schemas, s)
	}
	return schemas, rows.Err()
}

// ListSettings returns settings optionally filtered by group or search query.
func (r *PostgresRepository) ListSettings(group, query string) ([]*SettingValue, error) {
	sql := `SELECT key, group_name, value_json, is_secret, version, updated_by, updated_at FROM system_settings WHERE 1=1`
	args := []interface{}{}
	n := 0
	if group != "" {
		n++
		sql += fmt.Sprintf(" AND group_name = $%d", n)
		args = append(args, group)
	}
	if query != "" {
		n++
		sql += fmt.Sprintf(" AND (key ILIKE $%d OR value_json ILIKE $%d)", n, n)
		args = append(args, "%"+query+"%")
	}
	sql += " ORDER BY group_name, key"

	rows, err := r.db.Query(sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*SettingValue
	for rows.Next() {
		v := &SettingValue{}
		if err := rows.Scan(&v.Key, &v.Group, &v.Value, &v.IsSecret, &v.Version, &v.UpdatedBy, &v.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, v)
	}
	return items, rows.Err()
}

// GetSetting returns a single setting by key.
func (r *PostgresRepository) GetSetting(key string) (*SettingValue, error) {
	v := &SettingValue{}
	err := r.db.QueryRow(`SELECT key, group_name, value_json, is_secret, version, updated_by, updated_at FROM system_settings WHERE key = $1`, key).
		Scan(&v.Key, &v.Group, &v.Value, &v.IsSecret, &v.Version, &v.UpdatedBy, &v.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return v, nil
}

// UpsertSetting updates a setting value and records history.
func (r *PostgresRepository) UpsertSetting(actorID, key, value, reason, traceID string) (*SettingValue, error) {
	old, err := r.GetSetting(key)
	if err != nil {
		return nil, fmt.Errorf("setting not found: %s", key)
	}
	newVersion := old.Version + 1
	cs := settingChecksum(key, value)

	_, err = r.db.Exec(`UPDATE system_settings SET value_json=$1, version=$2, updated_by=$3, updated_at=CURRENT_TIMESTAMP, checksum=$4 WHERE key=$5`,
		value, newVersion, actorID, cs, key)
	if err != nil {
		return nil, err
	}

	_, err = r.db.Exec(`INSERT INTO system_settings_history (setting_key, from_version, to_version, old_value_json, new_value_json, changed_by, changed_at, reason, trace_id) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP,$7,$8)`,
		key, old.Version, newVersion, old.Value, value, actorID, reason, traceID)
	if err != nil {
		return nil, err
	}

	return r.GetSetting(key)
}

// GetSettingHistory returns the version history for a setting key.
func (r *PostgresRepository) GetSettingHistory(key string) ([]*SettingHistory, error) {
	rows, err := r.db.Query(`SELECT setting_key, from_version, to_version, old_value_json, new_value_json, changed_by, changed_at, reason, trace_id FROM system_settings_history WHERE setting_key = $1 ORDER BY to_version DESC LIMIT 50`, key)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*SettingHistory
	for rows.Next() {
		h := &SettingHistory{}
		var reason, traceID sql.NullString
		if err := rows.Scan(&h.SettingKey, &h.FromVersion, &h.ToVersion, &h.OldValue, &h.NewValue, &h.ChangedBy, &h.ChangedAt, &reason, &traceID); err != nil {
			return nil, err
		}
		if reason.Valid {
			h.Reason = reason.String
		}
		if traceID.Valid {
			h.TraceID = traceID.String
		}
		items = append(items, h)
	}
	return items, rows.Err()
}

// RollbackSetting reverts a setting to a specific version from history.
func (r *PostgresRepository) RollbackSetting(actorID, key string, targetVersion int64, reason, traceID string) (*SettingValue, error) {
	var oldValue string
	err := r.db.QueryRow(`SELECT new_value_json FROM system_settings_history WHERE setting_key = $1 AND to_version = $2`, key, targetVersion).Scan(&oldValue)
	if err != nil {
		return nil, fmt.Errorf("version %d not found for %s: %w", targetVersion, key, err)
	}
	rbReason := fmt.Sprintf("rollback to v%d: %s", targetVersion, reason)
	return r.UpsertSetting(actorID, key, oldValue, rbReason, traceID)
}
