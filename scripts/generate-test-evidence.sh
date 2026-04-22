#!/bin/bash
# =============================================================================
# Test Evidence Generator for StoryWeaver
# Generates verifiable test evidence for each step
# =============================================================================

set -e

# Configuration
EVIDENCE_DIR=".evidence"
STEP_NAME="${STEP_NAME:-$(date +%s)}"
LANGUAGE="${LANGUAGE:-go}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Generating test evidence for step...${NC}"

# Create evidence directory
mkdir -p "$EVIDENCE_DIR"

# =============================================================================
# GO Language
# =============================================================================
generate_go_evidence() {
    local test_output="$EVIDENCE_DIR/test-output-go.json"
    local coverage_output="$EVIDENCE_DIR/coverage-go.out"

    echo "Running Go tests with JSON output..."

    # Run tests and capture JSON output
    go test ./... -json 2>&1 | tee "$EVIDENCE_DIR/test-raw-output.txt" || true

    # Generate coverage
    echo "Generating coverage report..."
    go test ./... -coverprofile="$coverage_output" 2>&1 || true

    # Calculate coverage percentage
    COVERAGE_PERCENT=0
    if [ -f "$coverage_output" ]; then
        COVERAGE_PERCENT=$(go tool cover -func="$coverage_output" | grep total | awk '{print $3}' | tr -d '%' || echo "0")
    fi

    # Count passing tests
    PASS_COUNT=$(grep -c '"Action":"pass"' "$EVIDENCE_DIR/test-raw-output.txt" 2>/dev/null || echo "0")
    FAIL_COUNT=$(grep -c '"Action":"fail"' "$EVIDENCE_DIR/test-raw-output.txt" 2>/dev/null || echo "0")

    # Determine pass/fail status
    TESTS_PASSED="false"
    if [ "$FAIL_COUNT" -eq 0 ] && [ "$PASS_COUNT" -gt 0 ]; then
        TESTS_PASSED="true"
    fi

    # Generate evidence manifest
    cat > "$test_output" << EOF
{
  "step": "$STEP_NAME",
  "language": "go",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "passed": $TESTS_PASSED,
  "test_count": {
    "passed": $PASS_COUNT,
    "failed": $FAIL_COUNT,
    "total": $((PASS_COUNT + FAIL_COUNT))
  },
  "coverage_percent": ${COVERAGE_PERCENT:-0},
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'uncommitted')",
  "verification": {
    "test_output_exists": true,
    "coverage_above_80": $([ "${COVERAGE_PERCENT:-0}" -ge 80 ] && echo "true" || echo "false")
  }
}
EOF

    echo -e "${GREEN}✅ Evidence generated at $test_output${NC}"
    cat "$test_output"
}

# =============================================================================
# Node.js Language
# =============================================================================
generate_node_evidence() {
    local test_output="$EVIDENCE_DIR/test-output-node.json"
    local coverage_output="$EVIDENCE_DIR/coverage-node.out"

    echo "Running Node.js tests..."

    # Run tests with coverage
    npx jest --coverage --json --outputFile="$EVIDENCE_DIR/jest-results.json" 2>&1 || true

    # Parse coverage from Jest output
    if [ -f "$EVIDENCE_DIR/jest-results.json" ]; then
        COVERAGE_PERCENT=$(cat "$EVIDENCE_DIR/jest-results.json" | jq -r '.total.coveragePercent // 0')
    else
        COVERAGE_PERCENT=0
    fi

    # Check test results
    if [ -f "$EVIDENCE_DIR/jest-results.json" ]; then
        PASS_COUNT=$(cat "$EVIDENCE_DIR/jest-results.json" | jq -r '.numPassedTests // 0')
        FAIL_COUNT=$(cat "$EVIDENCE_DIR/jest-results.json" | jq -r '.numFailedTests // 0')
        TESTS_PASSED=$(cat "$EVIDENCE_DIR/jest-results.json" | jq -r '.success // false')
    else
        PASS_COUNT=0
        FAIL_COUNT=0
        TESTS_PASSED="false"
    fi

    cat > "$test_output" << EOF
{
  "step": "$STEP_NAME",
  "language": "nodejs",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "passed": $TESTS_PASSED,
  "test_count": {
    "passed": $PASS_COUNT,
    "failed": $FAIL_COUNT,
    "total": $((PASS_COUNT + FAIL_COUNT))
  },
  "coverage_percent": ${COVERAGE_PERCENT:-0},
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'uncommitted')",
  "verification": {
    "test_output_exists": true,
    "coverage_above_80": $([ "${COVERAGE_PERCENT:-0}" -ge 80 ] && echo "true" || echo "false")
  }
}
EOF

    echo -e "${GREEN}✅ Evidence generated at $test_output${NC}"
    cat "$test_output"
}

# =============================================================================
# Python Language
# =============================================================================
generate_python_evidence() {
    local test_output="$EVIDENCE_DIR/test-output-python.json"
    local coverage_output="$EVIDENCE_DIR/coverage-python.out"

    echo "Running Python tests with pytest..."

    # Run pytest with coverage
    python -m pytest --cov=. --cov-report=json:"$EVIDENCE_DIR/coverage.json" --json-report --json-report-file="$EVIDENCE_DIR/pytest-results.json" 2>&1 || true

    # Parse coverage
    if [ -f "$EVIDENCE_DIR/coverage.json" ]; then
        COVERAGE_PERCENT=$(cat "$EVIDENCE_DIR/coverage.json" | jq -r '.totals.percent_covered // 0')
    else
        COVERAGE_PERCENT=0
    fi

    # Parse test results
    if [ -f "$EVIDENCE_DIR/pytest-results.json" ]; then
        PASS_COUNT=$(cat "$EVIDENCE_DIR/pytest-results.json" | jq -r '.summary.num_passed // 0')
        FAIL_COUNT=$(cat "$EVIDENCE_DIR/pytest-results.json" | jq -r '.summary.num_failed // 0')
        TESTS_PASSED=$(cat "$EVIDENCE_DIR/pytest-results.json" | jq -r '.success // false')
    else
        PASS_COUNT=0
        FAIL_COUNT=0
        TESTS_PASSED="false"
    fi

    cat > "$test_output" << EOF
{
  "step": "$STEP_NAME",
  "language": "python",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "passed": $TESTS_PASSED,
  "test_count": {
    "passed": $PASS_COUNT,
    "failed": $FAIL_COUNT,
    "total": $((PASS_COUNT + FAIL_COUNT))
  },
  "coverage_percent": ${COVERAGE_PERCENT:-0},
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'uncommitted')",
  "verification": {
    "test_output_exists": true,
    "coverage_above_80": $([ "${COVERAGE_PERCENT:-0}" -ge 80 ] && echo "true" || echo "false")
  }
}
EOF

    echo -e "${GREEN}✅ Evidence generated at $test_output${NC}"
    cat "$test_output"
}

# =============================================================================
# Next.js / TypeScript
# =============================================================================
generate_nextjs_evidence() {
    local test_output="$EVIDENCE_DIR/test-output-nextjs.json"

    echo "Running Next.js tests..."

    # Run tests with coverage
    npm run test -- --coverage --json --outputFile="$EVIDENCE_DIR/vitest-results.json" 2>&1 || true

    # Parse coverage
    if [ -f "$EVIDENCE_DIR/vitest-results.json" ]; then
        COVERAGE_PERCENT=$(cat "$EVIDENCE_DIR/vitest-results.json" | jq -r '.coverage.percentage // 0')
        PASS_COUNT=$(cat "$EVIDENCE_DIR/vitest-results.json" | jq -r '.tests.passed // 0')
        FAIL_COUNT=$(cat "$EVIDENCE_DIR/vitest-results.json" | jq -r '.tests.failed # 0')
        TESTS_PASSED=$(cat "$EVIDENCE_DIR/vitest-results.json" | jq -r '.success # false')
    else
        COVERAGE_PERCENT=0
        PASS_COUNT=0
        FAIL_COUNT=0
        TESTS_PASSED="false"
    fi

    cat > "$test_output" << EOF
{
  "step": "$STEP_NAME",
  "language": "typescript",
  "framework": "nextjs",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "passed": $TESTS_PASSED,
  "test_count": {
    "passed": $PASS_COUNT,
    "failed": $FAIL_COUNT,
    "total": $((PASS_COUNT + FAIL_COUNT))
  },
  "coverage_percent": ${COVERAGE_PERCENT:-0},
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'uncommitted')",
  "verification": {
    "test_output_exists": true,
    "coverage_above_80": $([ "${COVERAGE_PERCENT:-0}" -ge 80 ] && echo "true" || echo "false")
  }
}
EOF

    echo -e "${GREEN}✅ Evidence generated at $test_output${NC}"
    cat "$test_output"
}

# =============================================================================
# Main Execution
# =============================================================================
case "$LANGUAGE" in
    go)
        generate_go_evidence
        ;;
    nodejs|node)
        generate_node_evidence
        ;;
    python|py)
        generate_python_evidence
        ;;
    nextjs|typescript|ts)
        generate_nextjs_evidence
        ;;
    *)
        echo -e "${RED}❌ Unknown language: $LANGUAGE${NC}"
        echo "Supported: go, nodejs, python, nextjs"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Test evidence generation complete${NC}"
echo "Files created in $EVIDENCE_DIR/"
ls -la "$EVIDENCE_DIR/"