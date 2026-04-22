#!/bin/bash
# =============================================================================
# Progress State Manager
# Updates the .progress/state.json for resumable execution
# =============================================================================

set -e

PROGRESS_DIR=".progress"
STATE_FILE="$PROGRESS_DIR/state.json"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# =============================================================================
# Init - Create initial state
# =============================================================================
init() {
    mkdir -p "$PROGRESS_DIR"

    if [ ! -f "$STATE_FILE" ]; then
        cat > "$STATE_FILE" << 'EOF'
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
    fi
}

# =============================================================================
# Show - Display current state
# =============================================================================
show() {
    if [ ! -f "$STATE_FILE" ]; then
        echo "No progress state found. Run 'make progress-init' first."
        exit 1
    fi

    echo ""
    echo -e "${YELLOW}📊 Current Progress State${NC}"
    echo ""
    jq '.' "$STATE_FILE"
    echo ""
}

# =============================================================================
# Update - Update specific fields
# =============================================================================
update() {
    local phase=$1
    local task=$2
    local step=$3
    local checkpoint=$4

    init

    # Read current state
    CURRENT=$(cat "$STATE_FILE")

    # Update fields
    UPDATED=$(echo "$CURRENT" | jq "
        .current_phase = $phase |
        .current_task = \"$task\" |
        .current_step = $step |
        .last_checkpoint = \"$checkpoint\" |
        .updated_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    ")

    echo "$UPDATED" > "$STATE_FILE"

    echo -e "${GREEN}✅ State updated:${NC}"
    echo "  Phase: $phase"
    echo "  Task: $task"
    echo "  Step: $step"
    echo "  Checkpoint: $checkpoint"
}

# =============================================================================
# Complete Phase - Mark a phase as done
# =============================================================================
complete-phase() {
    local phase=$1

    init

    # Add to completed phases
    UPDATED=$(cat "$STATE_FILE" | jq "
        .completed_phases += [$phase] |
        .completed_phases = (.completed_phases | unique) |
        .updated_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    ")

    echo "$UPDATED" > "$STATE_FILE"

    echo -e "${GREEN}✅ Phase $phase marked as complete${NC}"
}

# =============================================================================
# Resume - Show resume information
# =============================================================================
resume() {
    if [ ! -f "$STATE_FILE" ]; then
        echo "No progress state found."
        exit 1
    fi

    PHASE=$(jq -r '.current_phase' "$STATE_FILE")
    TASK=$(jq -r '.current_task' "$STATE_FILE")
    STEP=$(jq -r '.current_step' "$STATE_FILE")
    CHECKPOINT=$(jq -r '.last_checkpoint' "$STATE_FILE")

    echo ""
    echo -e "${YELLOW}📍 Resume Information${NC}"
    echo ""
    echo "To resume from last position, run:"
    echo ""
    echo "  Phase: $PHASE"
    echo "  Task: $TASK"
    echo "  Step: $STEP"
    echo "  Checkpoint: $CHECKPOINT"
    echo ""

    if [ -n "$CHECKPOINT" ] && [ "$CHECKPOINT" != "null" ]; then
        echo "To restore exact checkpoint:"
        echo "  git checkout $CHECKPOINT"
        echo ""
    fi
}

# =============================================================================
# Main
# =============================================================================
COMMAND=${1:-show}

case "$COMMAND" in
    init)
        init
        echo -e "${GREEN}✅ State initialized${NC}"
        ;;
    show)
        show
        ;;
    update)
        update "$2" "$3" "$4" "$5"
        ;;
    complete-phase)
        complete-phase "$2"
        ;;
    resume)
        resume
        ;;
    *)
        echo "Usage: $0 {init|show|update|complete-phase|resume}"
        echo ""
        echo "Commands:"
        echo "  init           - Initialize state file"
        echo "  show           - Display current state"
        echo "  update PHASE TASK STEP CHECKPOINT - Update state"
        echo "  complete-phase PHASE - Mark phase as complete"
        echo "  resume         - Show resume information"
        exit 1
        ;;
esac