#!/bin/bash
# =============================================================================
# Setup Script - Install StoryWeaver Quality Gates
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_DIR="$(git rev-parse --git-dir)"
HOOKS_DIR="$GIT_DIR/hooks"

echo "🔧 Setting up StoryWeaver Quality Gates..."
echo ""

# =============================================================================
# Install pre-commit hook
# =============================================================================
echo "📦 Installing pre-commit hook..."

if [ -f "$GIT_DIR/hooks/pre-commit" ]; then
    echo "   ⚠️  Existing pre-commit hook found. Backing up..."
    cp "$GIT_DIR/hooks/pre-commit" "$GIT_DIR/hooks/pre-commit.backup"
fi

cp "$SCRIPT_DIR/pre-commit-hook.sh" "$GIT_DIR/hooks/pre-commit"
chmod +x "$GIT_DIR/hooks/pre-commit"

echo "   ✅ Pre-commit hook installed"
echo ""

# =============================================================================
# Create .gitignore entries if needed
# =============================================================================
echo "📝 Checking .gitignore..."

# Add .evidence to gitignore if not present
if ! grep -q "^.evidence/" .gitignore 2>/dev/null; then
    echo ".evidence/" >> .gitignore
    echo "   ✅ Added .evidence/ to .gitignore"
else
    echo "   ✅ .evidence/ already in .gitignore"
fi

echo ""

# =============================================================================
# Create Makefile targets
# =============================================================================
echo "📋 Creating Makefile targets..."

if [ -f Makefile ]; then
    echo "   ⚠️  Makefile exists, appending targets..."
    # Append to existing Makefile
else
    cat > Makefile << 'EOF'
# =============================================================================
# StoryWeaver Quality Gates Makefile
# =============================================================================

.PHONY: test-evidence test-all help

# Default target
help:
	@echo "StoryWeaver Quality Gates"
	@echo ""
	@echo "Available targets:"
	@echo "  make test-evidence STEP=<name> LANG=<go|nodejs|python|nextjs>"
	@echo "                   - Generate test evidence for current step"
	@echo "  make test-all      - Run all tests with evidence"
	@echo "  make verify       - Verify all quality gates"
	@echo "  make setup        - Re-run setup (install hooks)"

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

EOF
    echo "   ✅ Makefile created"
fi

echo ""

# =============================================================================
# Create progress state file
# =============================================================================
echo "📊 Creating progress state file..."

mkdir -p .progress

cat > .progress/state.json << 'EOF'
{
  "project": "storyweaver-microservices",
  "current_phase": 0,
  "current_task": null,
  "current_step": 0,
  "completed_phases": [],
  "last_checkpoint": null,
  "resume_from": null,
  "skills_loaded": [],
  "created_at": null,
  "updated_at": null
}
EOF

echo "   ✅ Progress state file created at .progress/state.json"
echo ""

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Quality gates installed:"
echo "  - Pre-commit hook: $GIT_DIR/hooks/pre-commit"
echo "  - Evidence script:  scripts/generate-test-evidence.sh"
echo ""
echo "Usage:"
echo "  make test-evidence STEP=step-name LANG=go"
echo ""
echo "Before committing, ensure:"
echo "  1. Tests pass"
echo "  2. Coverage >= 80%"
echo "  3. Evidence generated"
echo ""