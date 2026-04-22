#!/bin/bash
# =============================================================================
# Pre-commit Hook - StoryWeaver Quality Gate Enforcement
# =============================================================================
# This hook runs BEFORE every commit and BLOCKS if test evidence is not valid.
#
# Usage: Copy to .git/hooks/pre-commit and make executable
#        cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#
# To bypass (NOT RECOMMENDED): git commit --no-verify
# =============================================================================

set -e

# Configuration
EVIDENCE_DIR=".evidence"
MIN_COVERAGE=80

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  StoryWeaver Quality Gate Check${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# =============================================================================
# Check 1: Evidence directory must exist
# =============================================================================
echo -e "${YELLOW}📋 Check 1: Test evidence exists?${NC}"

if [ ! -d "$EVIDENCE_DIR" ]; then
    echo -e "${RED}❌ FAIL: $EVIDENCE_DIR not found${NC}"
    echo -e "${RED}   Run 'make test-evidence' or './scripts/generate-test-evidence.sh' first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Evidence directory exists${NC}"
echo ""

# =============================================================================
# Check 2: Test output file must exist and be valid JSON
# =============================================================================
echo -e "${YELLOW}📋 Check 2: Test output valid?${NC}"

# Find the most recent test output (could be go, node, python, or nextjs)
TEST_FILES=(
    "$EVIDENCE_DIR/test-output-go.json"
    "$EVIDENCE_DIR/test-output-node.json"
    "$EVIDENCE_DIR/test-output-python.json"
    "$EVIDENCE_DIR/test-output-nextjs.json"
)

TEST_OUTPUT=""
for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        TEST_OUTPUT="$file"
        break
    fi
done

if [ -z "$TEST_OUTPUT" ] || [ ! -f "$TEST_OUTPUT" ]; then
    echo -e "${RED}❌ FAIL: No test output file found${NC}"
    echo -e "${RED}   Expected one of: ${TEST_FILES[*]}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Test output found: $TEST_OUTPUT${NC}"

# Validate JSON
if ! jq -e '.' "$TEST_OUTPUT" > /dev/null 2>&1; then
    echo -e "${RED}❌ FAIL: Invalid JSON in $TEST_OUTPUT${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Valid JSON format${NC}"
echo ""

# =============================================================================
# Check 3: Tests must have passed
# =============================================================================
echo -e "${YELLOW}📋 Check 3: Tests passed?${NC}"

PASSED=$(jq -r '.passed' "$TEST_OUTPUT")

if [ "$PASSED" != "true" ]; then
    echo -e "${RED}❌ FAIL: Tests did not pass${NC}"
    echo -e "${RED}   Test output shows: passed=$PASSED${NC}"

    # Show details
    PASS_COUNT=$(jq -r '.test_count.passed // 0' "$TEST_OUTPUT")
    FAIL_COUNT=$(jq -r '.test_count.failed // 0' "$TEST_OUTPUT")
    echo -e "${RED}   Passed: $PASS_COUNT, Failed: $FAIL_COUNT${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All tests passed${NC}"
echo ""

# =============================================================================
# Check 4: Coverage must be >= 80%
# =============================================================================
echo -e "${YELLOW}📋 Check 4: Coverage >= ${MIN_COVERAGE}%?${NC}"

COVERAGE=$(jq -r '.coverage_percent // 0' "$TEST_OUTPUT")

echo "   Coverage: ${COVERAGE}%"

# Compare coverage (handle decimal)
COVERAGE_INT=${COVERAGE%.*}

if [ "$COVERAGE_INT" -lt "$MIN_COVERAGE" ]; then
    echo -e "${RED}❌ FAIL: Coverage ${COVERAGE}% < ${MIN_COVERAGE}%${NC}"
    echo -e "${RED}   Increase test coverage before committing${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Coverage ${COVERAGE}% >= ${MIN_COVERAGE}%${NC}"
echo ""

# =============================================================================
# Check 5: Test count verification
# =============================================================================
echo -e "${YELLOW}📋 Check 5: Test count?${NC}"

PASS_COUNT=$(jq -r '.test_count.passed // 0' "$TEST_OUTPUT")
FAIL_COUNT=$(jq -r '.test_count.failed // 0' "$TEST_OUTPUT")
TOTAL_COUNT=$(jq -r '.test_count.total // 0' "$TEST_OUTPUT")

echo "   Passed: $PASS_COUNT"
echo "   Failed: $FAIL_COUNT"
echo "   Total:  $TOTAL_COUNT"

if [ "$TOTAL_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ FAIL: No tests were run${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tests executed: $TOTAL_COUNT${NC}"
echo ""

# =============================================================================
# Check 6: Git commit hash must exist (code was committed)
# =============================================================================
echo -e "${YELLOW}📋 Check 6: Code committed?${NC}"

GIT_COMMIT=$(jq -r '.git_commit // "uncommitted"' "$TEST_OUTPUT")

if [ "$GIT_COMMIT" == "uncommitted" ] || [ -z "$GIT_COMMIT" ]; then
    echo -e "${RED}❌ FAIL: Code not yet committed${NC}"
    echo -e "${RED}   Commit code before generating evidence${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Code committed: $GIT_COMMIT${NC}"
echo ""

# =============================================================================
# ALL CHECKS PASSED
# =============================================================================
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  ✅ ALL QUALITY GATES PASSED${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Commit ready!"
echo ""
echo "Evidence summary:"
echo "  - Step:        $(jq -r '.step // "unknown"' "$TEST_OUTPUT")"
echo "  - Language:     $(jq -r '.language // "unknown"' "$TEST_OUTPUT")"
echo "  - Tests:       $PASS_COUNT passed"
echo "  - Coverage:    ${COVERAGE}%"
echo "  - Commit:      $GIT_COMMIT"

exit 0