#!/bin/bash
# =============================================================================
# Infrastructure Health Check Script
# =============================================================================
# Verifies all infrastructure services are healthy
# Usage: ./scripts/infrastructure-health-check.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; }

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/storyweaver/infrastructure"
EVIDENCE_DIR=".evidence"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# =============================================================================
# Check Docker is running
# =============================================================================
check_docker() {
    log_info "Checking Docker..."

    if ! docker info > /dev/null 2>&1; then
        log_fail "Docker is not running. Please start Docker."
        exit 1
    fi

    log_pass "Docker is running"
}

# =============================================================================
# Start infrastructure
# =============================================================================
start_infrastructure() {
    log_info "Starting infrastructure services..."

    cd "$INFRA_DIR"

    # Check if already running
    if docker-compose ps | grep -q "Up"; then
        log_info "Infrastructure already running"
        return 0
    fi

    docker-compose up -d
    log_pass "Infrastructure started"
}

# =============================================================================
# Wait for services to be healthy
# =============================================================================
wait_for_services() {
    log_info "Waiting for services to be healthy..."

    local timeout=60
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        local all_healthy=true

        # Check PostgreSQL
        if ! docker exec storyweaver-postgres pg_isready -U storyweaver > /dev/null 2>&1; then
            all_healthy=false
        fi

        # Check Redis
        if ! docker exec storyweaver-redis redis-cli ping > /dev/null 2>&1; then
            all_healthy=false
        fi

        # Check NATS
        if ! curl -s http://localhost:8222/healthz > /dev/null 2>&1; then
            all_healthy=false
        fi

        # Check MinIO
        if ! docker exec storyweaver-minio mc ready local > /dev/null 2>&1; then
            all_healthy=false
        fi

        if $all_healthy; then
            log_pass "All services are healthy"
            return 0
        fi

        sleep 2
        elapsed=$((elapsed + 2))
    done

    log_fail "Services did not become healthy within ${timeout}s"
    log_fail "Check: docker-compose -f $INFRA_DIR/docker-compose.yml ps"
    exit 1
}

# =============================================================================
# Verify connections
# =============================================================================
verify_connections() {
    log_info "Verifying connections..."

    local failed=0

    # PostgreSQL
    log_info "Checking PostgreSQL..."
    if docker exec storyweaver-postgres pg_isready -U storyweaver > /dev/null 2>&1; then
        log_pass "PostgreSQL: OK"
    else
        log_fail "PostgreSQL: FAILED"
        failed=$((failed + 1))
    fi

    # Redis
    log_info "Checking Redis..."
    if docker exec storyweaver-redis redis-cli ping 2>&1 | grep -q "PONG"; then
        log_pass "Redis: OK"
    else
        log_fail "Redis: FAILED"
        failed=$((failed + 1))
    fi

    # NATS
    log_info "Checking NATS..."
    if curl -s http://localhost:8222/healthz | grep -q "ok"; then
        log_pass "NATS: OK"
    else
        log_fail "NATS: FAILED"
        failed=$((failed + 1))
    fi

    # MinIO
    log_info "Checking MinIO..."
    if docker exec storyweaver-minio mc ready local > /dev/null 2>&1; then
        log_pass "MinIO: OK"
    else
        log_fail "MinIO: FAILED"
        failed=$((failed + 1))
    fi

    return $failed
}

# =============================================================================
# Generate evidence
# =============================================================================
generate_evidence() {
    log_info "Generating evidence..."

    mkdir -p "$EVIDENCE_DIR"

    local evidence_file="$EVIDENCE_DIR/phase-1-infrastructure-evidence-${TIMESTAMP}.json"

    # Get service versions
    local pg_version=$(docker exec storyweaver-postgres psql -V 2>/dev/null | head -1 || echo "unknown")
    local redis_version=$(docker exec storyweaver-redis redis-server --version 2>/dev/null | head -1 || echo "unknown")
    local nats_version=$(docker exec storyweaver-nats nats-server --version 2>/dev/null || echo "unknown")
    local minio_version=$(docker exec storyweaver-minio minio --version 2>/dev/null | head -1 || echo "unknown")

    # Get service status
    docker-compose -f "$INFRA_DIR/docker-compose.yml" ps > "$EVIDENCE_DIR/phase-1-services-status-${TIMESTAMP}.log"

    cat > "$evidence_file" << EOF
{
  "phase": "1",
  "service": "infrastructure",
  "timestamp": "$TIMESTAMP",
  "infrastructure": {
    "postgres": {
      "status": "healthy",
      "version": "$pg_version"
    },
    "redis": {
      "status": "healthy",
      "version": "$redis_version"
    },
    "nats": {
      "status": "healthy",
      "version": "$nats_version"
    },
    "minio": {
      "status": "healthy",
      "version": "$minio_version"
    }
  },
  "evidence": {
    "services_status_log": "phase-1-services-status-${TIMESTAMP}.log"
  }
}
EOF

    log_pass "Evidence generated: $evidence_file"
}

# =============================================================================
# Main
# =============================================================================
main() {
    echo "========================================"
    echo "Phase 1: Infrastructure Health Check"
    echo "========================================"

    check_docker
    start_infrastructure
    wait_for_services

    if ! verify_connections; then
        log_fail "Some services failed verification"
        exit 1
    fi

    generate_evidence

    # Create checkpoint
    mkdir -p .checkpoints
    touch ".checkpoints/phase-1.infrastructure-passed"

    echo "========================================"
    log_pass "Phase 1 Infrastructure PASSED"
    echo "========================================"

    exit 0
}

main "$@"