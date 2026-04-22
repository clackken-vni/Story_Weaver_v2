package admin

import (
	"context"
	"errors"
)

// Service handles admin business logic
type Service struct {
	repo Repository
}

// NewService creates a new admin service
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// GetDashboardStats returns aggregated dashboard statistics
func (s *Service) GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	userStats, err := s.repo.GetUserStats()
	if err != nil {
		return nil, err
	}

	usageStats, err := s.repo.GetUsageStats()
	if err != nil {
		return nil, err
	}

	subscriptionStats, err := s.repo.GetSubscriptionStats()
	if err != nil {
		return nil, err
	}

	return &DashboardStats{
		Users:         userStats,
		Usage:        usageStats,
		Subscriptions: subscriptionStats,
	}, nil
}

// DashboardStats aggregates all statistics
type DashboardStats struct {
	Users         *UserStats          `json:"users"`
	Usage         *UsageStats         `json:"usage"`
	Subscriptions *SubscriptionStats   `json:"subscriptions"`
}

// ValidateAPIKeyResult represents API key validation result
type ValidateAPIKeyResult struct {
	Valid   bool
	KeyID   string
	KeyName string
	RateLimit int
}

// ValidateAPIKey validates an API key and returns its info
func (s *Service) ValidateAPIKey(ctx context.Context, keyHash string) (*ValidateAPIKeyResult, error) {
	usage, err := s.repo.GetAPIKeyUsage()
	if err != nil {
		return nil, err
	}

	for _, u := range usage {
		if u.KeyID == keyHash {
			return &ValidateAPIKeyResult{
				Valid:    true,
				KeyID:    u.KeyID,
				KeyName:  u.KeyName,
				RateLimit: 100,
			}, nil
		}
	}

	return &ValidateAPIKeyResult{Valid: false}, nil
}

// GetUserStatsWithService gets user stats through service layer
func (s *Service) GetUserStats(ctx context.Context) (*UserStats, error) {
	return s.repo.GetUserStats()
}

// GetUsageStatsWithService gets usage stats through service layer
func (s *Service) GetUsageStats(ctx context.Context) (*UsageStats, error) {
	return s.repo.GetUsageStats()
}

// GetSubscriptionStatsWithService gets subscription stats through service layer
func (s *Service) GetSubscriptionStats(ctx context.Context) (*SubscriptionStats, error) {
	return s.repo.GetSubscriptionStats()
}

// HealthCheck checks if the service is healthy
func (s *Service) HealthCheck(ctx context.Context) error {
	_, err := s.repo.GetUserStats()
	if err != nil {
		return errors.New("database connection failed")
	}
	return nil
}