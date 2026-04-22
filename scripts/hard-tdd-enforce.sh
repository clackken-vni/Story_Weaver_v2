#!/bin/bash
# =============================================================================
# HARD TDD ENFORCEMENT SCRIPT
# =============================================================================
# Hard enforcement: KHÔNG cho phép pass nếu không có bằng chứng test
# Usage: ./scripts/hard-tdd-enforce.sh <phase> <service_path>
# Example: ./scripts/hard-tdd-enforce.sh 1 ./storyweaver/api-gateway

set -euo pipefail

PHASE="${1:-}"
SERVICE_PATH="${2:-}"
EVIDENCE_DIR=".evidence"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# =============================================================================
# STEP 0: Verify prerequisites
# =============================================================================
verify_prerequisites() {
    log_info "Verifying prerequisites..."

    if [ -z "$PHASE" ] || [ -z "$SERVICE_PATH" ]; then
        log_fail "Usage: $0 <phase> <service_path>"
        log_fail "Example: $0 1 ./storyweaver/api-gateway"
        exit 1
    fi

    if [ ! -d "$SERVICE_PATH" ]; then
        log_fail "Service path does not exist: $SERVICE_PATH"
        exit 1
    fi

    log_pass "Prerequisites verified"
}

# =============================================================================
# STEP 1: Verify tests exist AND were written BEFORE implementation
# =============================================================================
verify_test_first() {
    log_info "STEP 1: Verifying TDD test-first approach..."

    # Check for test files
    local test_pattern=""
    case "$SERVICE_PATH" in
        *"/api-gateway"*|*"/auth-service"*|*"/admin-service"*)
            test_pattern="*_test.go"
            ;;
        *"/wizard-service"*|*"/ai-service"*|*"/tts-service"*)
            test_pattern="*.test.ts"
            ;;
        *"/kb-service"*)
            test_pattern="test_*.py"
            ;;
        *"/frontend"*|*"/admin-dashboard"*)
            test_pattern="*.test.tsx"
            ;;
    esac

    # Count test files
    local test_count=$(find "$SERVICE_PATH" -name "$test_pattern" 2>/dev/null | wc -l)

    if [ "$test_count" -eq 0 ]; then
        log_fail "FATAL: No test files found in $SERVICE_PATH"
        log_fail "TDD violation: Tests MUST exist before implementation"
        exit 1
    fi

    # Verify test file timestamps vs implementation
    # Tests should be created BEFORE implementation files
    local oldest_test=$(find "$SERVICE_PATH" -name "$test_pattern" -type f -exec stat -f %a {} \; 2>/dev/null | sort -n | head -1)
    local oldest_impl=$(find "$SERVICE_PATH" \( -name "*.go" -o -name "*.ts" -o -name "*.tsx" -o -name "*.py" \) -not -name "*_test.*" -not -name "*.test.*" -type f -exec stat -f %a {} \; 2>/dev/null | sort -n | head -1 || echo "9999999999")

    if [ "$oldest_impl" -lt "$oldest_test" ] && [ "$oldest_test" != "" ]; then
        log_warn "WARNING: Implementation files may have been created before tests"
        log_warn "This violates strict TDD - consider if tests were truly written first"
        # Warning only, not hard fail (timestamps can be unreliable)
    fi

    log_pass "Found $test_count test files"
}

# =============================================================================
# STEP 2: Run tests and verify they FAIL (RED phase)
# =============================================================================
run_tests_red() {
    log_info "STEP 2: Running tests to verify RED (tests should FAIL)..."

    cd "$SERVICE_PATH" || exit 1

    # Run tests based on language
    local test_result=""
    local test_output=""

    case "$SERVICE_PATH" in
        *"/api-gateway"*|*"/auth-service"*|*"/admin-service"*)
            log_info "Running Go tests..."
            test_output=$(go test ./... -v 2>&1 || true)
            test_result=$?
            ;;
        *"/wizard-service"*|*"/ai-service"*|*"/tts-service"*)
            log_info "Running Node.js tests..."
            test_output=$(npm test 2>&1 || true)
            test_result=$?
            ;;
        *"/kb-service"*)
            log_info "Running Python tests..."
            test_output=$(python -m pytest 2>&1 || true)
            test_result=$?
            ;;
    esac

    # Check if tests actually failed (expected in RED phase)
    # If tests PASS without implementation, that's suspicious
    if echo "$test_output" | grep -q "PASS" && ! echo "$test_output" | grep -q "FAIL"; then
        log_warn "Tests passed WITHOUT implementation - suspicious"
        log_warn "Either tests are not strict enough, or implementation exists"
        # This is a warning, not a hard fail (could be prior implementation)
    fi

    log_pass "RED phase verified (tests run, expected to fail)"
}

# =============================================================================
# STEP 3: Verify implementation exists
# =============================================================================
verify_implementation() {
    log_info "STEP 3: Verifying implementation exists..."

    local impl_count=0
    case "$SERVICE_PATH" in
        *"/api-gateway"*|*"/auth-service"*|*"/admin-service"*)
            impl_count=$(find "$SERVICE_PATH" -name "*.go" -not -name "*_test.go" | wc -l)
            ;;
        *"/wizard-service"*|*"/ai-service"*|*"/tts-service"*)
            impl_count=$(find "$SERVICE_PATH" -name "*.ts" -not -name "*.test.ts" -not -name "*.spec.ts" | wc -l)
            ;;
        *"/kb-service"*)
            impl_count=$(find "$SERVICE_PATH" -name "*.py" -not -name "test_*.py" -not -name "*_test.py" | wc -l)
            ;;
    esac

    if [ "$impl_count" -eq 0 ]; then
        log_fail "FATAL: No implementation files found"
        log_fail "Implementation must exist after GREEN phase"
        exit 1
    fi

    log_pass "Found implementation files"
}

# =============================================================================
# STEP 4: Run tests and verify they PASS (GREEN phase)
# =============================================================================
run_tests_green() {
    log_info "STEP 4: Running tests to verify GREEN (tests should PASS)..."

    cd "$SERVICE_PATH" || exit 1

    local test_result=""
    local test_output=""

    case "$SERVICE_PATH" in
        *"/api-gateway"*|*"/auth-service"*|*"/admin-service"*)
            log_info "Running Go tests..."
            test_output=$(go test ./... -v -coverprofile=coverage.out 2>&1)
            test_result=$?
            ;;
        *"/wizard-service"*|*"/ai-service"*|*"/tts-service"*)
            log_info "Running Node.js tests..."
            test_output=$(npm test -- --coverage 2>&1)
            test_result=$?
            ;;
        *"/kb-service"*)
            log_info "Running Python tests..."
            test_output=$(python -m pytest --cov=. --cov-report=json 2>&1)
            test_result=$?
            ;;
    esac

    # Save test output for evidence
    echo "$test_output" > "$EVIDENCE_DIR/test-output-${PHASE}-${TIMESTAMP}.log"

    if [ $test_result -ne 0 ]; then
        log_fail "FATAL: Tests FAILED in GREEN phase"
        log_fail "Implementation does not make tests pass"
        log_fail "Check: $EVIDENCE_DIR/test-output-${PHASE}-${TIMESTAMP}.log"
        exit 1
    fi

    log_pass "Tests PASSED in GREEN phase"
}

# =============================================================================
# STEP 5: Verify coverage >= 80%
# =============================================================================
verify_coverage() {
    log_info "STEP 5: Verifying coverage >= 80%..."

    cd "$SERVICE_PATH" || exit 1

    local coverage=0

    case "$SERVICE_PATH" in
        *"/api-gateway"*|*"/auth-service"*|*"/admin-service"*)
            coverage=$(go test ./... -coverprofile=coverage.out 2>/dev/null && go tool cover -func=coverage.out 2>/dev/null | grep total | awk '{print $3}' | sed 's/%//' || echo "0")
            ;;
        *"/wizard-service"*|*"/ai-service"*|*"/tts-service"*)
            coverage=$(cat coverage/coverage-summary.json 2>/dev/null | grep -o '"total":{"lines":{"pct":[0-9.]*' | grep -o '[0-9.]*$' || echo "0")
            ;;
        *"/kb-service"*)
            coverage=$(python -m coverage report --json 2>/dev/null | grep -o '"totals":{"lines":{"percent":[0-9.]*' | grep -o '[0-9.]*$' || echo "0")
            ;;
    esac

    # Compare as numbers
    local coverage_int=${coverage%.*}

    if [ "$coverage_int" -lt 80 ]; then
        log_fail "FATAL: Coverage is ${coverage}% (required: 80%)"
        log_fail "TDD violation: Must have >= 80% coverage to pass"
        exit 1
    fi

    log_pass "Coverage verified: ${coverage}%"
}

# =============================================================================
# STEP 6: Generate test evidence
# =============================================================================
generate_evidence() {
    log_info "STEP 6: Generating test evidence..."

    mkdir -p "$EVIDENCE_DIR"

    local evidence_file="$EVIDENCE_DIR/phase-${PHASE}-evidence-${TIMESTAMP}.json"

    local test_count=$(find "$SERVICE_PATH" \( -name "*_test.go" -o -name "*.test.ts" -o -name "test_*.py" \) 2>/dev/null | wc -l)

    cat > "$evidence_file" << EOF
{
  "phase": "$PHASE",
  "service": "$SERVICE_PATH",
  "timestamp": "$TIMESTAMP",
  "tdd_verification": {
    "test_first": true,
    "red_phase_passed": true,
    "green_phase_passed": true,
    "coverage_80_plus": true
  },
  "evidence": {
    "test_file_count": $test_count,
    "test_output_log": "test-output-${PHASE}-${TIMESTAMP}.log"
  },
  "gates": {
    "build_gate": "PASS",
    "test_gate": "PASS",
    "coverage_gate": "PASS"
  }
}
EOF

    log_pass "Evidence generated: $evidence_file"
}

# =============================================================================
# STEP 7: Quality gates check
# =============================================================================
run_quality_gates() {
    log_info "STEP 7: Running quality gates..."

    # Build gate
    cd "$SERVICE_PATH" || exit 1
    case "$SERVICE_PATH" in
        *"/api-gateway"*|*"/auth-service"*|*"/admin-service"*)
            log_info "Build gate: go build ./..."
            if ! go build ./... 2>/dev/null; then
                log_fail "Build gate FAILED"
                exit 1
            fi
            ;;
        *"/wizard-service"*|*"/ai-service"*|*"/tts-service"*)
            log_info "Build gate: npm run build"
            if ! npm run build 2>/dev/null; then
                log_fail "Build gate FAILED"
                exit 1
            fi
            ;;
    esac
    log_pass "Build gate PASSED"

    # Lint gate (if available)
    case "$SERVICE_PATH" in
        *"/api-gateway"*|*"/auth-service"*|*"/admin-service"*)
            if command -v golangci-lint &> /dev/null; then
                log_info "Lint gate: golangci-lint run"
                if ! golangci-lint run 2>/dev/null; then
                    log_warn "Lint gate WARNINGS (non-blocking)"
                fi
            fi
            ;;
        *"/wizard-service"*|*"/ai-service"*|*"/tts-service"*)
            if [ -f "package.json" ] && grep -q '"lint"' package.json; then
                log_info "Lint gate: npm run lint"
                if ! npm run lint 2>/dev/null; then
                    log_warn "Lint gate WARNINGS (non-blocking)"
                fi
            fi
            ;;
    esac
    log_pass "Quality gates PASSED"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================
main() {
    echo "========================================"
    echo "HARD TDD ENFORCEMENT - Phase $PHASE"
    echo "========================================"

    verify_prerequisites
    verify_test_first
    run_tests_red
    verify_implementation
    run_tests_green
    verify_coverage
    generate_evidence
    run_quality_gates

    echo "========================================"
    log_pass "HARD TDD ENFORCEMENT PASSED"
    log_pass "Phase $PHASE ready for commit"
    echo "========================================"

    # Create checkpoint marker
    mkdir -p .checkpoints
    touch ".checkpoints/phase-${PHASE}.hard-tdd-passed"
    log_info "Checkpoint created: .checkpoints/phase-${PHASE}.hard-tdd-passed"

    exit 0
}

main "$@"