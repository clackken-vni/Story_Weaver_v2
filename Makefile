# =============================================================================
# StoryWeaver Quality Gates Makefile
# =============================================================================

.PHONY: help test-evidence test-all verify setup progress-init progress-show

# Default target
help:
	@echo "StoryWeaver Quality Gates"
	@echo ""
	@echo "Available targets:"
	@echo "  make test-evidence STEP=<name> LANG=<go|nodejs|python|nextjs>"
	@echo "                   - Generate test evidence for current step"
	@echo "  make test-all      - Run all tests with evidence"
	@echo "  make verify        - Verify all quality gates (pre-commit hook)"
	@echo "  make setup         - Re-run setup (install hooks)"
	@echo "  make progress-show - Show current progress state"
	@echo "  make progress-init - Initialize progress state"

test-evidence:
	@./scripts/generate-test-evidence.sh

test-all:
	@echo "Running all tests..."
	@go test ./... || true
	@npm test 2>/dev/null || true
	@python -m pytest 2>/dev/null || true

verify:
	@./scripts/pre-commit-hook.sh

setup:
	@./scripts/setup.sh

progress-init:
	@./scripts/progress-state.sh init

progress-show:
	@./scripts/progress-state.sh show

progress-resume:
	@./scripts/progress-state.sh resume

# Quick test for Go
test-go:
	@go test ./... -v -coverprofile=.evidence/coverage.out

# Quick test for Node
test-node:
	@npx jest --coverage --json --outputFile=.evidence/jest-results.json

# Quick test for Python
test-py:
	@python -m pytest --cov=. --cov-report=json:.evidence/coverage.json --json-report --json-report-file=.evidence/pytest-results.json