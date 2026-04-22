package admin

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestCommandCenterSummaryData_JSONShape(t *testing.T) {
	payload := Envelope[CommandCenterSummaryData]{
		Success: true,
		Data: CommandCenterSummaryData{
			OpenIncidents:    3,
			DegradedServices: 1,
			TopAlerts:        []string{"ai timeout"},
		},
		Meta: EnvelopeMeta{Version: "v1"},
	}

	b, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal failed: %v", err)
	}

	s := string(b)
	if !strings.Contains(s, "open_incidents") {
		t.Fatalf("expected open_incidents in json: %s", s)
	}
	if !strings.Contains(s, "degraded_services") {
		t.Fatalf("expected degraded_services in json: %s", s)
	}
	if !strings.Contains(s, "top_alerts") {
		t.Fatalf("expected top_alerts in json: %s", s)
	}
}
