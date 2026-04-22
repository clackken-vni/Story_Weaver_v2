# StoryWeaver Quality Gates & Workflow

> **Created:** 2026-04-19
> **Branch:** `task/refactor-code-90y`
> **Status:** Active

---

## 1. Quality Gates Overview

Quality gates are **kill switches** that prevent progression until conditions are met. They enforce the "no broken code" principle.

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUALITY GATES PIPELINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  BUILD   │ →  │   TEST   │ →  │COVERAGE  │ →  │  LINT    │   │
│  │  Gate    │    │   Gate   │    │  Gate    │    │   Gate   │   │
│  │  ❌ FAIL │    │  ❌ FAIL  │    │  < 80%   │    │  ❌ FAIL  │   │
│  │  STOP    │    │   STOP   │    │   STOP   │    │   STOP   │   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘   │
│       ↓              ↓               ↓              ↓         │
│       └──────────────┴───────────────┴──────────────┘          │
│                           ↓                                     │
│                    ┌──────────┐                                │
│                    │  REVIEW   │                                │
│                    │   Gate    │                                │
│                    │ CRITICAL  │                                │
│                    │  STOP ❌   │                                │
│                    └──────────┘                                 │
│                           ↓                                     │
│                    ┌──────────┐                                │
│                    │  COMMIT   │ ← Only if ALL gates pass ✅    │
│                    └──────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Kill Switch Definitions

### 2.1 Build Gate

| Condition | Action | Command |
|-----------|--------|---------|
| Build fails | ❌ STOP | `go build ./...` hoặc `npm run build` |
| Compilation errors | ❌ STOP | `go vet ./...` hoặc `npm run typecheck` |

**When:** Every commit, every PR
**Enforcement:** Git hook (pre-commit) + CI/CD

---

### 2.2 Test Gate

| Condition | Action | Command |
|-----------|--------|---------|
| Any test fails | ❌ STOP | `go test ./...` hoặc `npm test` |
| Flaky tests detected | ⚠️ WARN | Mark and track flaky tests |

**When:** Every commit, every PR
**Enforcement:** Git hook (pre-commit) + CI/CD

---

### 2.3 Coverage Gate

| Condition | Action | Threshold |
|-----------|--------|----------|
| Coverage below minimum | ❌ STOP | **80% minimum** |
| Coverage per service | ⚠️ WARN | Service-specific targets |

**Service Coverage Targets:**
| Service | Min Coverage |
|---------|--------------|
| API Gateway | 85% |
| Auth Service | 85% |
| Wizard Service | 80% |
| AI Service | 80% |
| TTS Service | 80% |
| KB Service | 80% |
| Frontend | 80% |
| Admin Dashboard | 80% |

**Command:** `go test ./... -coverprofile=coverage.out`

---

### 2.4 Lint Gate

| Condition | Action | Command |
|-----------|--------|---------|
| Lint errors | ❌ STOP | `golangci-lint run` (Go) |
| Type errors | ❌ STOP | `npm run lint` (Node.js) |
| Format issues | ⚠️ WARN | Auto-fix via pre-commit hook |

**Enforcement:** Claude Code hooks (PostToolUse) + CI/CD

---

### 2.5 Security Gate

| Severity | Action | Scanner |
|----------|--------|---------|
| CRITICAL | ❌ STOP, block merge | `gosec`, `snyk` |
| HIGH | ⚠️ WARN, must fix | `gosec`, `snyk` |
| MEDIUM | ℹ️ INFO, consider fix | `gosec` |
| LOW | ✅ PASS | - |

**Required Scans:**
- SAST (Static Application Security Testing)
- Dependency vulnerability scan
- Secret detection

---

### 2.6 Code Review Gate

| Severity | Action | Requirement |
|----------|--------|------------|
| CRITICAL | ❌ BLOCK | Must fix before merge |
| HIGH | ⚠️ WARN | Should fix before merge |
| MEDIUM | ℹ️ INFO | Consider fixing |
| LOW | ✅ PASS | Optional improvements |

**Review Checklist:**
- [ ] No CRITICAL/HIGH security issues
- [ ] Functions < 50 lines
- [ ] Files < 800 lines
- [ ] No deep nesting (> 4 levels)
- [ ] Proper error handling
- [ ] Tests exist for new functionality
- [ ] 80%+ test coverage

---

## 3. Service → Skills Mapping

Each service implementation must load the appropriate skills before coding:

### 3.1 Go Services

| Service | Skills | Purpose |
|---------|--------|---------|
| **API Gateway** | `golang-pro` | Go best practices, project structure |
| | `golang-observability` | Metrics, tracing, logging |
| | `golang-code-style` | Code style conventions |
| **Auth Service** | `golang-pro` | Go patterns |
| | `golang-error-handling` | Error wrapping, handling |
| | `microservices-patterns` | Service communication |
| **Admin Service** | `golang-pro` | Go patterns |
| | `golang-observability` | Observability setup |
| **All Go Services** | `golang-testing` | Testing patterns |
| | `tdd` | TDD workflow |

### 3.2 Node.js Services

| Service | Skills | Purpose |
|---------|--------|---------|
| **Wizard Service** | `nodejs-backend-patterns` | Fastify, API patterns |
| | `tdd` | TDD workflow |
| | `api-testing-patterns` | API endpoint testing |
| **AI Service** | `nodejs-backend-patterns` | Backend patterns |
| | `api-contract-testing` | Contract testing |
| **TTS Service** | `nodejs-backend-patterns` | Backend patterns |
| | `api-testing-patterns` | API testing |
| **All Node.js** | `tdd-workflow` | TDD process |
| | `playwright-best-practices` | E2E testing |

### 3.3 Python Service

| Service | Skills | Purpose |
|---------|--------|---------|
| **KB Service** | `python-observability` | Logging, metrics |
| | `python-testing-patterns` | pytest, testing |
| | `tdd` | TDD workflow |

### 3.4 Frontend (Next.js)

| App | Skills | Purpose |
|-----|--------|---------|
| **Frontend** | `next-best-practices` | Next.js 15 patterns |
| | `typescript-advanced-types` | TypeScript |
| | `webapp-testing` | Testing strategy |
| | `web-accessibility` | A11Y compliance |
| | `web-performance` | Core Web Vitals |
| | `playwright-best-practices` | E2E testing |
| **Admin Dashboard** | `next-best-practices` | Next.js patterns |
| | `typescript-advanced-types` | Type safety |
| | `web-accessibility` | A11Y |

### 3.5 Quality & Testing (All Services)

| Purpose | Skills | Usage |
|---------|--------|-------|
| Test-driven | `tdd` | Every feature starts with tests |
| TDD workflow | `tdd-workflow` | RED → GREEN → REFACTOR |
| Code review | `requesting-code-review` | Before commit |
| Review excellence | `code-review-excellence` | Review process |
| E2E testing | `playwright-best-practices` | Frontend validation |
| API testing | `api-testing-patterns` | Backend validation |
| Contract testing | `api-contract-testing` | Service integration |

---

## 4. Workflow per Service Implementation

### Standard Service Workflow

```
┌──────────────────────────────────────────────────────────────┐
│  1. LOAD SKILLS                                             │
│     └── Load appropriate skills for service type            │
│         e.g., golang-pro, tdd, api-testing-patterns         │
├──────────────────────────────────────────────────────────────┤
│  2. WRITE TESTS (RED)                                       │
│     └── Use `tdd` skill                                     │
│         - Write failing test first                          │
│         - Define expected behavior                          │
│         - Run test → MUST FAIL                              │
├──────────────────────────────────────────────────────────────┤
│  3. IMPLEMENT (GREEN)                                       │
│     └── Load `golang-pro` or `nodejs-backend-patterns`      │
│         - Write minimal code to pass test                  │
│         - Use skills for best practices                      │
│         - Run test → MUST PASS                              │
├──────────────────────────────────────────────────────────────┤
│  4. REFACTOR (IMPROVE)                                      │
│     └── Use `golang-code-style` or `typescript-advanced-types│
│         - Clean up code                                     │
│         - Apply patterns                                    │
│         - Ensure tests still pass                          │
├──────────────────────────────────────────────────────────────┤
│  5. VERIFY COVERAGE                                         │
│     └── Run coverage report                                 │
│         - Must be ≥ 80%                                    │
│         - If not, add more tests                            │
├──────────────────────────────────────────────────────────────┤
│  6. CODE REVIEW                                             │
│     └── Use `code-review-excellence`                        │
│         - Security check (CRITICAL/HIGH → STOP)             │
│         - Quality check                                    │
│         - Best practices check                              │
├──────────────────────────────────────────────────────────────┤
│  7. COMMIT & PUSH                                           │
│     └── Only if ALL gates pass                              │
│         - Conventional commits                              │
│         - PR to main (if applicable)                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Git Hooks Setup

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "🔍 Running Quality Gates..."

# 1. Build check
echo "📦 Building..."
if ! go build ./...; then
    echo "❌ BUILD FAILED"
    exit 1
fi

# 2. Test check
echo "🧪 Running tests..."
if ! go test ./...; then
    echo "❌ TESTS FAILED"
    exit 1
fi

# 3. Coverage check
echo "📊 Checking coverage..."
COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | tr -d '%')
if [ "$COVERAGE" -lt 80 ]; then
    echo "❌ Coverage $COVERAGE% < 80%"
    exit 1
fi

# 4. Lint check
echo "🔎 Running linter..."
if ! golangci-lint run; then
    echo "❌ LINT FAILED"
    exit 1
fi

echo "✅ All gates passed!"
```

### Claude Code Hooks

```json
// In .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "pnpm prettier --write \"$FILE_PATH\"",
        "description": "Format frontend files"
      },
      {
        "matcher": "Write|Edit",
        "command": "pnpm eslint --fix \"$FILE_PATH\"",
        "description": "Lint check"
      }
    ],
    "Stop": [
      {
        "command": "pnpm build && pnpm test",
        "description": "Final verification before session end"
      }
    ]
  }
}
```

---

## 6. CI/CD Quality Gates

```yaml
# .github/workflows/quality-gates.yml

name: Quality Gates

on:
  push:
    branches: [main, task/*]
  pull_request:
    branches: [main]

jobs:
  # Gate 1: Build
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: go build ./...

  # Gate 2: Test
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test
        run: go test ./... -coverprofile=coverage.out

  # Gate 3: Coverage
  coverage:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Check Coverage
        run: |
          COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | tr -d '%')
          if [ "$COVERAGE" -lt 80 ]; then exit 1; fi

  # Gate 4: Security
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Security Scan
        run: gosec ./...

  # Gate 5: Lint
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint
        run: golangci-lint run
```

---

## 7. Kill Switch Summary

| Gate | Fail Condition | Blocking Level | Enforced By |
|------|----------------|----------------|-------------|
| Build | Compilation errors | 🔴 CRITICAL | Git hook + CI |
| Test | Any test fails | 🔴 CRITICAL | Git hook + CI |
| Coverage | < 80% | 🔴 CRITICAL | Git hook + CI |
| Lint | Errors found | 🔴 CRITICAL | CI |
| Security | CRITICAL vulns | 🔴 CRITICAL | CI |
| Review | CRITICAL/HIGH issues | 🔴 CRITICAL | Human + CI |

**Legend:**
- ❌ STOP = Cannot proceed until fixed
- ⚠️ WARN = Proceed but document issue
- ✅ PASS = Continue

---

## 8. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                  BEFORE YOU COMMIT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ ] go build ./...                    ✅ PASS             │
│  [ ] go test ./...                     ✅ PASS             │
│  [ ] go test -coverprofile=out         📊 ≥ 80%            │
│  [ ] golangci-lint run                 ✅ PASS             │
│  [ ] gosec ./...                       🔒 No CRITICAL      │
│  [ ] code review (CRITICAL/HIGH)       ✅ PASS             │
│                                                             │
│  ALL MUST BE ✅ TO COMMIT                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*This document is the source of truth for StoryWeaver quality enforcement.*