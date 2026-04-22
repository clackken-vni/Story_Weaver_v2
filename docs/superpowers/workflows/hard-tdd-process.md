# HARD TDD PROCESS - Mandatory Workflow

> **CRITICAL**: This is a HARD process. No exceptions. No bypasses. No passing without evidence.

## Core Principle

```
TDD FIRST → TEST FAIL (RED) → IMPLEMENT → TEST PASS (GREEN) → REFACTOR → QUALITY GATES → COMMIT
```

Every phase MUST follow this exact order. Code is NOT considered complete until ALL steps pass with evidence.

---

## Hard TDD Workflow

### Phase Workflow (MUST follow exactly)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 0: PREREQUISITE CHECK                                                 │
│  - Verify test files exist                                                  │
│  - Verify tests were written BEFORE implementation (timestamp check)        │
│  - If tests don't exist → STOP, violation                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: RED PHASE - Write failing test                                     │
│  - Write test for each function BEFORE implementing                         │
│  - Tests MUST be written BEFORE implementation code                         │
│  - Run: tests should FAIL (because implementation doesn't exist yet)        │
│  - NO implementation code exists yet                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: GREEN PHASE - Write minimal implementation                         │
│  - Write minimal code to make tests PASS                                     │
│  - Only write enough to pass tests, no more                                 │
│  - Run: tests should PASS                                                   │
│  - Evidence: Test output showing PASS                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: REFACTOR PHASE                                                     │
│  - Clean up code while maintaining tests pass                               │
│  - No new functionality, just improvement                                   │
│  - Run: tests still PASS                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: COVERAGE VERIFICATION                                              │
│  - Must have >= 80% coverage                                                │
│  - If coverage < 80% → STOP, cannot pass                                    │
│  - Evidence: coverage report JSON                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: QUALITY GATES                                                     │
│  - Build gate: `go build ./...` or `npm run build` → must PASS              │
│  - Test gate: All tests → must PASS                                         │
│  - Lint gate: `golangci-lint` or `eslint` → warnings OK, errors STOP       │
│  - Security gate: `gosec` or `npm audit` → must PASS                        │
│  - If ANY gate fails → STOP, cannot pass                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6: GENERATE EVIDENCE                                                 │
│  - Run: ./scripts/hard-tdd-enforce.sh <phase> <service_path>               │
│  - Creates: .evidence/phase-{N}-evidence-{timestamp}.json                  │
│  - Creates: .checkpoints/phase-{N}.hard-tdd-passed                         │
│  - Evidence includes: test output, coverage report, build status            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7: COMMIT                                                             │
│  - Only commit AFTER all evidence is generated                              │
│  - Commit message must reference evidence file                             │
│  - If evidence doesn't exist → CANNOT commit                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hard TDD Enforcement Script

### Location
```
scripts/hard-tdd-enforce.sh
```

### Usage
```bash
./scripts/hard-tdd-enforce.sh <phase> <service_path>

# Example:
./scripts/hard-tdd-enforce.sh 1 ./storyweaver/api-gateway
```

### What it does
1. Verifies test files exist
2. Verifies tests were written BEFORE implementation (timestamp check)
3. Runs tests in RED mode (expects failure)
4. Verifies implementation exists
5. Runs tests in GREEN mode (expects pass)
6. Verifies coverage >= 80%
7. Runs quality gates (build, lint)
8. Generates evidence JSON
9. Creates checkpoint marker

### Exit codes
- `0`: All gates passed, ready for commit
- `1`: Fatal error, must fix before proceeding

---

## Kill Switch Criteria

| Step | Kill Criteria | Action |
|------|---------------|--------|
| 0. Prerequisite | No test files found | **STOP** - Cannot proceed |
| 1. RED phase | Tests pass without implementation | **STOP** - Suspicious, investigate |
| 2. GREEN phase | Tests fail after implementation | **STOP** - Fix implementation |
| 4. Coverage | Coverage < 80% | **STOP** - Add more tests |
| 5. Quality gates | Build fails | **STOP** - Fix build |
| 5. Quality gates | Tests fail | **STOP** - Fix tests |
| 5. Quality gates | Lint errors | **STOP** - Fix lint issues |
| 5. Quality gates | Security scan fails | **STOP** - Fix security issues |

---

## Evidence Requirements

For each phase, the following evidence MUST exist:

```json
{
  "phase": "N",
  "service": "path/to/service",
  "timestamp": "YYYYMMDD_HHMMSS",
  "tdd_verification": {
    "test_first": true,
    "red_phase_passed": true,
    "green_phase_passed": true,
    "coverage_80_plus": true
  },
  "gates": {
    "build_gate": "PASS|FAIL",
    "test_gate": "PASS|FAIL",
    "coverage_gate": "PASS|FAIL",
    "lint_gate": "PASS|FAIL",
    "security_gate": "PASS|FAIL"
  },
  "evidence": {
    "test_file_count": N,
    "test_output_log": "path/to/log"
  }
}
```

---

## Pre-Commit Hook Integration

The pre-commit hook at `scripts/pre-commit-hook.sh` MUST check for:

1. Evidence file exists in `.evidence/` directory
2. Checkpoint marker exists in `.checkpoints/` directory
3. Evidence is from current session (timestamp within 24h)

If evidence is missing or stale:
```
[HOOK] BLOCKED: No test evidence found
[HOOK] Run: ./scripts/hard-tdd-enforce.sh <phase> <service>
[HOOK] Then commit again
```

---

## Phase Dependencies

```
Phase 1 (Infrastructure) 
  → Phase 2 (Auth Service) 
    → Phase 3 (Wizard Service) 
      → Phase 4 (AI Service) 
        → Phase 5 (TTS Service) 
          → Phase 6 (KB Service) 
            → Phase 7 (Admin Service) 
              → Phase 8 (API Gateway) 
                → Phase 9 (Frontend) 
                  → Phase 10 (Admin Dashboard)
```

Each phase must complete FULL TDD cycle before next phase can start.

---

## Violations

Any of the following is a **HARD VIOLATION**:

1. Writing implementation code BEFORE writing tests
2. Committing without passing tests
3. Committing with coverage < 80%
4. Committing without evidence file
5. Bypassing quality gates
6. Modifying pre-commit hook to skip checks

**Violation consequence**: Code is automatically rejected. Must fix and re-run full cycle.

---

## Session Recovery

If session is compacted mid-phase:

1. Check for checkpoint: `ls .checkpoints/`
2. If checkpoint exists with `.hard-tdd-passed`, phase is complete
3. If checkpoint doesn't exist, must resume from last passed step
4. Evidence files persist across sessions (gitignored but present)

```bash
# Check phase status
ls -la .checkpoints/
ls -la .evidence/

# Resume from checkpoint
cat .checkpoints/phase-N.hard-tdd-passed
```

---

## Summary

**HARD TDD Process = Test First + Evidence + Gates + Checkpoint**

- Test first: Write tests BEFORE code
- Evidence: Proof tests pass with coverage >= 80%
- Gates: Build + Test + Lint + Security all pass
- Checkpoint: Marker file for session recovery

**No evidence = No commit = No pass**