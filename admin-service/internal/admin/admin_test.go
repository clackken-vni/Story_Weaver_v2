package admin

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// MockRepository implements Repository for testing
type MockRepository struct {
	UserStatsFn                func() (*UserStats, error)
	UsageStatsFn               func() (*UsageStats, error)
	APIKeyUsageFn              func() ([]*APIKeyUsage, error)
	SubscriptionStatsFn        func() (*SubscriptionStats, error)
	InitSchemaFn               func() error
	GetUsersFn                 func(page, limit int) ([]*User, int64, error)
	CommandCenterSummaryFn     func() (*CommandCenterSummaryData, error)
	MonitoringServicesFn       func() ([]*ServiceHealth, error)
	MonitoringInfraFn          func() ([]*InfraHealth, error)
}

func (m *MockRepository) GetUserStats() (*UserStats, error) {
	return m.UserStatsFn()
}

func (m *MockRepository) GetUsageStats() (*UsageStats, error) {
	return m.UsageStatsFn()
}

func (m *MockRepository) GetAPIKeyUsage() ([]*APIKeyUsage, error) {
	return m.APIKeyUsageFn()
}

func (m *MockRepository) GetSubscriptionStats() (*SubscriptionStats, error) {
	return m.SubscriptionStatsFn()
}

func (m *MockRepository) GetUsers(page, limit int) ([]*User, int64, error) {
	return m.GetUsersFn(page, limit)
}

func (m *MockRepository) InitSchema() error {
	return m.InitSchemaFn()
}

func (m *MockRepository) GetCommandCenterSummary() (*CommandCenterSummaryData, error) {
	if m.CommandCenterSummaryFn != nil {
		return m.CommandCenterSummaryFn()
	}
	return &CommandCenterSummaryData{OpenIncidents: 0, DegradedServices: 0, TopAlerts: []string{}}, nil
}

func (m *MockRepository) GetMonitoringServices() ([]*ServiceHealth, error) {
	if m.MonitoringServicesFn != nil {
		return m.MonitoringServicesFn()
	}
	return []*ServiceHealth{}, nil
}

func (m *MockRepository) GetMonitoringInfra() ([]*InfraHealth, error) {
	if m.MonitoringInfraFn != nil {
		return m.MonitoringInfraFn()
	}
	return []*InfraHealth{}, nil
}

func (m *MockRepository) GetIncidents() ([]*Incident, error) {
	return []*Incident{}, nil
}

func (m *MockRepository) AckIncident(id string) error {
	return nil
}

func (m *MockRepository) GetAuditEvents(filter AuditFilter) ([]*StoredAuditEvent, error) {
	return []*StoredAuditEvent{}, nil
}

func (m *MockRepository) GetAuditTrace(traceID string) ([]*StoredAuditEvent, error) {
	return []*StoredAuditEvent{}, nil
}

func (m *MockRepository) GetUserByID(id string) (*User, error) {
	return &User{ID: id, Email: "test@example.com", Role: "user"}, nil
}

func (m *MockRepository) LockUser(id, reason string) error {
	return nil
}

func (m *MockRepository) UnlockUser(id, reason string) error {
	return nil
}

func (m *MockRepository) UpdateUserRole(id, role, reason string) error {
	return nil
}

// MockServiceRepository is a mock implementation for testing
type MockServiceRepository struct {
	GetUserStatsFn          func() (*UserStats, error)
	GetUsageStatsFn         func() (*UsageStats, error)
	GetSubscriptionStatsFn  func() (*SubscriptionStats, error)
	GetAPIKeyUsageFn        func() ([]*APIKeyUsage, error)
	InitSchemaFn            func() error
	GetUsersFn              func(page, limit int) ([]*User, int64, error)
}

func (m *MockServiceRepository) GetUserStats() (*UserStats, error) {
	return m.GetUserStatsFn()
}

func (m *MockServiceRepository) GetUsageStats() (*UsageStats, error) {
	return m.GetUsageStatsFn()
}

func (m *MockServiceRepository) GetSubscriptionStats() (*SubscriptionStats, error) {
	return m.GetSubscriptionStatsFn()
}

func (m *MockServiceRepository) GetAPIKeyUsage() ([]*APIKeyUsage, error) {
	return m.GetAPIKeyUsageFn()
}

func (m *MockServiceRepository) GetUsers(page, limit int) ([]*User, int64, error) {
	if m.GetUsersFn == nil {
		return []*User{}, 0, nil
	}
	return m.GetUsersFn(page, limit)
}

func (m *MockServiceRepository) InitSchema() error {
	if m.InitSchemaFn == nil {
		return nil
	}
	return m.InitSchemaFn()
}

func (m *MockServiceRepository) GetCommandCenterSummary() (*CommandCenterSummaryData, error) {
	return &CommandCenterSummaryData{}, nil
}

func (m *MockServiceRepository) GetMonitoringServices() ([]*ServiceHealth, error) {
	return []*ServiceHealth{}, nil
}

func (m *MockServiceRepository) GetMonitoringInfra() ([]*InfraHealth, error) {
	return []*InfraHealth{}, nil
}

func (m *MockServiceRepository) GetIncidents() ([]*Incident, error) {
	return []*Incident{}, nil
}

func (m *MockServiceRepository) AckIncident(id string) error {
	return nil
}

func (m *MockServiceRepository) GetAuditEvents(filter AuditFilter) ([]*StoredAuditEvent, error) {
	return []*StoredAuditEvent{}, nil
}

func (m *MockServiceRepository) GetAuditTrace(traceID string) ([]*StoredAuditEvent, error) {
	return []*StoredAuditEvent{}, nil
}

func (m *MockServiceRepository) GetUserByID(id string) (*User, error) {
	return &User{ID: id, Email: "test@example.com", Role: "user"}, nil
}

func (m *MockServiceRepository) LockUser(id, reason string) error {
	return nil
}

func (m *MockServiceRepository) UnlockUser(id, reason string) error {
	return nil
}

func (m *MockServiceRepository) UpdateUserRole(id, role, reason string) error {
	return nil
}

type MockAuditPublisher struct {
	PublishFn func(ctx context.Context, evt AuditEvent) error
	Calls     []AuditEvent
}

func (m *MockAuditPublisher) Publish(ctx context.Context, evt AuditEvent) error {
	m.Calls = append(m.Calls, evt)
	if m.PublishFn != nil {
		return m.PublishFn(ctx, evt)
	}
	return nil
}

// testError is a test error
type testError struct {
	msg string
}

func (e *testError) Error() string {
	return e.msg
}

// ErrDatabaseFailure is a test error for database failures
var ErrDatabaseFailure = &testError{msg: "database failure"}

// Handler tests

func TestHandler_GetUserStats_PublishesAuditEvent(t *testing.T) {
	mockRepo := &MockRepository{
		UserStatsFn: func() (*UserStats, error) {
			return &UserStats{TotalUsers: 100, ActiveUsers: 50, NewUsersToday: 10}, nil
		},
	}
	mockPublisher := &MockAuditPublisher{}
	handler := NewHandlerWithPublisher(mockRepo, mockPublisher)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/users", nil)

	handler.GetUserStats(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	if len(mockPublisher.Calls) != 1 {
		t.Fatalf("expected 1 audit event, got %d", len(mockPublisher.Calls))
	}
	if mockPublisher.Calls[0].Action != "admin.stats.users.read" {
		t.Fatalf("expected action admin.stats.users.read, got %s", mockPublisher.Calls[0].Action)
	}
	if mockPublisher.Calls[0].Outcome != "success" {
		t.Fatalf("expected outcome success, got %s", mockPublisher.Calls[0].Outcome)
	}
}

func TestHandler_GetUserStats_AuditFailureDoesNotBreakAPI(t *testing.T) {
	mockRepo := &MockRepository{
		UserStatsFn: func() (*UserStats, error) {
			return &UserStats{TotalUsers: 100, ActiveUsers: 50, NewUsersToday: 10}, nil
		},
	}
	mockPublisher := &MockAuditPublisher{PublishFn: func(ctx context.Context, evt AuditEvent) error {
		return errors.New("nats unavailable")
	}}
	handler := NewHandlerWithPublisher(mockRepo, mockPublisher)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/users", nil)

	handler.GetUserStats(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
}

func TestHandler_GetUserStats_Error(t *testing.T) {
	mockRepo := &MockRepository{
		UserStatsFn: func() (*UserStats, error) {
			return nil, ErrDatabaseFailure
		},
	}

	handler := NewHandler(mockRepo)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/users", nil)

	handler.GetUserStats(c)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", w.Code)
	}
}

func TestHandler_GetUsageStats_Success(t *testing.T) {
	mockRepo := &MockRepository{
		UsageStatsFn: func() (*UsageStats, error) {
			return &UsageStats{TotalProjects: 500, TotalGenerations: 1000, ActiveProjects: 200}, nil
		},
	}

	handler := NewHandler(mockRepo)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/usage", nil)

	handler.GetUsageStats(c)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestHandler_GetUsageStats_Error(t *testing.T) {
	mockRepo := &MockRepository{
		UsageStatsFn: func() (*UsageStats, error) {
			return nil, ErrDatabaseFailure
		},
	}

	handler := NewHandler(mockRepo)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/usage", nil)

	handler.GetUsageStats(c)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", w.Code)
	}
}

func TestHandler_GetAPIKeyUsage_Success(t *testing.T) {
	mockRepo := &MockRepository{
		APIKeyUsageFn: func() ([]*APIKeyUsage, error) {
			return []*APIKeyUsage{
				{KeyID: "key-1", KeyName: "Test Key 1", UsageCount: 100, LastUsedAt: time.Now()},
				{KeyID: "key-2", KeyName: "Test Key 2", UsageCount: 200, LastUsedAt: time.Now()},
			}, nil
		},
	}

	handler := NewHandler(mockRepo)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/api-keys", nil)

	handler.GetAPIKeyUsage(c)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestHandler_GetAPIKeyUsage_Error(t *testing.T) {
	mockRepo := &MockRepository{
		APIKeyUsageFn: func() ([]*APIKeyUsage, error) {
			return nil, ErrDatabaseFailure
		},
	}

	handler := NewHandler(mockRepo)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/api-keys", nil)

	handler.GetAPIKeyUsage(c)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", w.Code)
	}
}

func TestHandler_GetAPIKeyUsage_Empty(t *testing.T) {
	mockRepo := &MockRepository{
		APIKeyUsageFn: func() ([]*APIKeyUsage, error) {
			return []*APIKeyUsage{}, nil
		},
	}

	handler := NewHandler(mockRepo)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/api-keys", nil)

	handler.GetAPIKeyUsage(c)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestHandler_GetSubscriptionStats_Success(t *testing.T) {
	mockRepo := &MockRepository{
		SubscriptionStatsFn: func() (*SubscriptionStats, error) {
			return &SubscriptionStats{TotalSubscriptions: 200, ActiveSubscriptions: 150, TrialSubscriptions: 25}, nil
		},
	}

	handler := NewHandler(mockRepo)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/subscriptions", nil)

	handler.GetSubscriptionStats(c)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestHandler_GetSubscriptionStats_Error(t *testing.T) {
	mockRepo := &MockRepository{
		SubscriptionStatsFn: func() (*SubscriptionStats, error) {
			return nil, ErrDatabaseFailure
		},
	}

	handler := NewHandler(mockRepo)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/stats/subscriptions", nil)

	handler.GetSubscriptionStats(c)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", w.Code)
	}
}

func TestHandler_RegisterRoutes(t *testing.T) {
	mockRepo := &MockRepository{}
	handler := NewHandler(mockRepo)

	r := gin.New()
	authMiddleware := func(c *gin.Context) {
		c.Next()
	}
	adminMiddleware := func(c *gin.Context) {
		c.Next()
	}

	handler.RegisterRoutes(r, authMiddleware, adminMiddleware)

	routes := r.Routes()
	expectedRoutes := map[string]string{
		"/api/v1/admin/stats/users":         "GET",
		"/api/v1/admin/stats/usage":         "GET",
		"/api/v1/admin/stats/api-keys":      "GET",
		"/api/v1/admin/stats/subscriptions": "GET",
		"/api/v1/admin/users":               "GET",
	}

	found := make(map[string]bool)
	for _, route := range routes {
		if expectedMethod, ok := expectedRoutes[route.Path]; ok {
			if route.Method != expectedMethod {
				t.Errorf("route %s: expected %s, got %s", route.Path, expectedMethod, route.Method)
			}
			found[route.Path] = true
		}
	}

	for path := range expectedRoutes {
		if !found[path] {
			t.Errorf("route %s not found", path)
		}
	}
}

func TestHandler_RegisterRoutes_WithAuth(t *testing.T) {
	mockRepo := &MockRepository{}
	handler := NewHandler(mockRepo)

	r := gin.New()

	authMiddleware := func(c *gin.Context) {
		c.Set("admin", true)
		c.Next()
	}
	adminMiddleware := func(c *gin.Context) {
		c.Next()
	}

	handler.RegisterRoutes(r, authMiddleware, adminMiddleware)

	routes := r.Routes()
	if len(routes) != 17 {
		t.Errorf("expected 17 routes, got %d", len(routes))
	}
}

// Service tests

func TestNewService(t *testing.T) {
	mockRepo := &MockServiceRepository{}
	svc := NewService(mockRepo)
	if svc == nil {
		t.Error("expected non-nil service")
	}
}

func TestService_GetUserStats(t *testing.T) {
	expected := &UserStats{TotalUsers: 100, ActiveUsers: 50, NewUsersToday: 10}
	mockRepo := &MockServiceRepository{
		GetUserStatsFn: func() (*UserStats, error) {
			return expected, nil
		},
	}
	svc := NewService(mockRepo)

	result, err := svc.GetUserStats(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.TotalUsers != 100 {
		t.Errorf("expected TotalUsers=100, got %d", result.TotalUsers)
	}
}

func TestService_GetUserStats_Error(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetUserStatsFn: func() (*UserStats, error) {
			return nil, errors.New("database error")
		},
	}
	svc := NewService(mockRepo)

	_, err := svc.GetUserStats(context.Background())
	if err == nil {
		t.Error("expected error, got nil")
	}
}

func TestService_GetUsageStats(t *testing.T) {
	expected := &UsageStats{TotalProjects: 500, TotalGenerations: 1000, ActiveProjects: 200}
	mockRepo := &MockServiceRepository{
		GetUsageStatsFn: func() (*UsageStats, error) {
			return expected, nil
		},
	}
	svc := NewService(mockRepo)

	result, err := svc.GetUsageStats(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.TotalProjects != 500 {
		t.Errorf("expected TotalProjects=500, got %d", result.TotalProjects)
	}
}

func TestService_GetUsageStats_Error(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetUsageStatsFn: func() (*UsageStats, error) {
			return nil, errors.New("database error")
		},
	}
	svc := NewService(mockRepo)

	_, err := svc.GetUsageStats(context.Background())
	if err == nil {
		t.Error("expected error, got nil")
	}
}

func TestService_GetSubscriptionStats(t *testing.T) {
	expected := &SubscriptionStats{TotalSubscriptions: 200, ActiveSubscriptions: 150, TrialSubscriptions: 25}
	mockRepo := &MockServiceRepository{
		GetSubscriptionStatsFn: func() (*SubscriptionStats, error) {
			return expected, nil
		},
	}
	svc := NewService(mockRepo)

	result, err := svc.GetSubscriptionStats(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.TotalSubscriptions != 200 {
		t.Errorf("expected TotalSubscriptions=200, got %d", result.TotalSubscriptions)
	}
}

func TestService_GetSubscriptionStats_Error(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetSubscriptionStatsFn: func() (*SubscriptionStats, error) {
			return nil, errors.New("database error")
		},
	}
	svc := NewService(mockRepo)

	_, err := svc.GetSubscriptionStats(context.Background())
	if err == nil {
		t.Error("expected error, got nil")
	}
}

func TestService_GetDashboardStats(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetUserStatsFn: func() (*UserStats, error) {
			return &UserStats{TotalUsers: 100}, nil
		},
		GetUsageStatsFn: func() (*UsageStats, error) {
			return &UsageStats{TotalProjects: 500}, nil
		},
		GetSubscriptionStatsFn: func() (*SubscriptionStats, error) {
			return &SubscriptionStats{TotalSubscriptions: 200}, nil
		},
	}
	svc := NewService(mockRepo)

	result, err := svc.GetDashboardStats(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Users.TotalUsers != 100 {
		t.Errorf("expected Users.TotalUsers=100, got %d", result.Users.TotalUsers)
	}
	if result.Usage.TotalProjects != 500 {
		t.Errorf("expected Usage.TotalProjects=500, got %d", result.Usage.TotalProjects)
	}
	if result.Subscriptions.TotalSubscriptions != 200 {
		t.Errorf("expected Subscriptions.TotalSubscriptions=200, got %d", result.Subscriptions.TotalSubscriptions)
	}
}

func TestService_GetDashboardStats_UserStatsError(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetUserStatsFn: func() (*UserStats, error) {
			return nil, errors.New("database error")
		},
	}
	svc := NewService(mockRepo)

	_, err := svc.GetDashboardStats(context.Background())
	if err == nil {
		t.Error("expected error, got nil")
	}
}

func TestService_GetDashboardStats_UsageStatsError(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetUserStatsFn: func() (*UserStats, error) {
			return &UserStats{TotalUsers: 100}, nil
		},
		GetUsageStatsFn: func() (*UsageStats, error) {
			return nil, errors.New("database error")
		},
	}
	svc := NewService(mockRepo)

	_, err := svc.GetDashboardStats(context.Background())
	if err == nil {
		t.Error("expected error, got nil")
	}
}

func TestService_ValidateAPIKey(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetAPIKeyUsageFn: func() ([]*APIKeyUsage, error) {
			return []*APIKeyUsage{
				{KeyID: "key-1", KeyName: "Test Key", UsageCount: 100},
			}, nil
		},
	}
	svc := NewService(mockRepo)

	result, err := svc.ValidateAPIKey(context.Background(), "key-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !result.Valid {
		t.Error("expected valid=true")
	}
	if result.KeyName != "Test Key" {
		t.Errorf("expected KeyName='Test Key', got %s", result.KeyName)
	}
}

func TestService_ValidateAPIKey_Invalid(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetAPIKeyUsageFn: func() ([]*APIKeyUsage, error) {
			return []*APIKeyUsage{
				{KeyID: "key-1", KeyName: "Test Key", UsageCount: 100},
			}, nil
		},
	}
	svc := NewService(mockRepo)

	result, err := svc.ValidateAPIKey(context.Background(), "invalid-key")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Valid {
		t.Error("expected valid=false")
	}
}

func TestService_ValidateAPIKey_Error(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetAPIKeyUsageFn: func() ([]*APIKeyUsage, error) {
			return nil, errors.New("database error")
		},
	}
	svc := NewService(mockRepo)

	_, err := svc.ValidateAPIKey(context.Background(), "key-1")
	if err == nil {
		t.Error("expected error, got nil")
	}
}

func TestService_HealthCheck_Success(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetUserStatsFn: func() (*UserStats, error) {
			return &UserStats{}, nil
		},
	}
	svc := NewService(mockRepo)

	err := svc.HealthCheck(context.Background())
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestService_HealthCheck_Failure(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetUserStatsFn: func() (*UserStats, error) {
			return nil, errors.New("database error")
		},
	}
	svc := NewService(mockRepo)

	err := svc.HealthCheck(context.Background())
	if err == nil {
		t.Error("expected error, got nil")
	}
}

func TestDashboardStats_Aggregation(t *testing.T) {
	stats := &DashboardStats{
		Users: &UserStats{
			TotalUsers:    100,
			ActiveUsers:   50,
			NewUsersToday: 10,
		},
		Usage: &UsageStats{
			TotalProjects:    500,
			TotalGenerations: 1000,
			ActiveProjects:   200,
		},
		Subscriptions: &SubscriptionStats{
			TotalSubscriptions:  200,
			ActiveSubscriptions: 150,
			TrialSubscriptions:  25,
		},
	}

	if stats.Users.TotalUsers != 100 {
		t.Errorf("expected TotalUsers=100, got %d", stats.Users.TotalUsers)
	}
	if stats.Usage.TotalProjects != 500 {
		t.Errorf("expected TotalProjects=500, got %d", stats.Usage.TotalProjects)
	}
	if stats.Subscriptions.ActiveSubscriptions != 150 {
		t.Errorf("expected ActiveSubscriptions=150, got %d", stats.Subscriptions.ActiveSubscriptions)
	}
}

// Additional coverage tests

func TestNewHandler(t *testing.T) {
	mockRepo := &MockRepository{}
	handler := NewHandler(mockRepo)
	if handler == nil {
		t.Error("expected non-nil handler")
	}
	if handler.repo == nil {
		t.Error("expected repo to be set")
	}
}

func TestRegisterRoutes_MultipleMiddlewares(t *testing.T) {
	testCases := []struct {
		name             string
		authMiddleware   gin.HandlerFunc
		adminMiddleware  gin.HandlerFunc
	}{
		{"nil middlewares", nil, nil},
		{"auth middleware", func(c *gin.Context) { c.Next() }, nil},
		{"admin middleware", nil, func(c *gin.Context) { c.Next() }},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockRepo := &MockRepository{}
			handler := NewHandler(mockRepo)
			r := gin.New()
			handler.RegisterRoutes(r, tc.authMiddleware, tc.adminMiddleware)

			routes := r.Routes()
			if len(routes) != 17 {
				t.Errorf("expected 17 routes, got %d", len(routes))
			}
		})
	}
}

func TestService_GetDashboardStats_AllNil(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetUserStatsFn: func() (*UserStats, error) { return &UserStats{}, nil },
		GetUsageStatsFn: func() (*UsageStats, error) { return &UsageStats{}, nil },
		GetSubscriptionStatsFn: func() (*SubscriptionStats, error) { return &SubscriptionStats{}, nil },
	}
	svc := NewService(mockRepo)

	result, err := svc.GetDashboardStats(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Users == nil || result.Usage == nil || result.Subscriptions == nil {
		t.Error("expected non-nil stats")
	}
}

func TestService_GetDashboardStats_SubscriptionStatsError(t *testing.T) {
	mockRepo := &MockServiceRepository{
		GetUserStatsFn: func() (*UserStats, error) { return &UserStats{}, nil },
		GetUsageStatsFn: func() (*UsageStats, error) { return &UsageStats{}, nil },
		GetSubscriptionStatsFn: func() (*SubscriptionStats, error) {
			return nil, errors.New("subscription error")
		},
	}
	svc := NewService(mockRepo)

	_, err := svc.GetDashboardStats(context.Background())
	if err == nil {
		t.Error("expected error, got nil")
	}
}