package events

import (
	"context"
	"testing"
	"time"

	"storyweaver/admin-service/internal/admin"
)

func TestNewNATSAuditPublisher_RequiresURL(t *testing.T) {
	_, err := NewNATSAuditPublisher("", "admin.audit.events")
	if err == nil {
		t.Fatal("expected error when url is empty")
	}
}

func TestNoopPublisher_Publish(t *testing.T) {
	publisher := NewNoopPublisher()
	err := publisher.Publish(context.Background(), admin.AuditEvent{
		Action:    "admin.stats.users.read",
		ActorID:   "u-1",
		ActorRole: "admin",
		Resource:  "users",
		Outcome:   "success",
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}
