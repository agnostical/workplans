#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# simulate.sh — Workplans board simulation (demo timelapse)
#
# Creates a temporary workplans environment, starts a local server,
# and simulates the full lifecycle of 14 plans from backlog to done.
# Uses the same plans as the demo — a 1:1 simulation of what an
# agent would do: creating files, editing frontmatter, checking
# tasks, renaming and moving files between folders.
#
# Final state: 10/14 plans in DONE (71%)
#
# Usage:
#   ./scripts/simulate.sh              # auto mode (default)
#   ./scripts/simulate.sh --delay 2    # auto mode, 2s delay
#   ./scripts/simulate.sh -i           # interactive (press Enter)
# ─────────────────────────────────────────────────────────────────
set -e

# ── Parse arguments ──
MODE="auto"
DELAY=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto)          MODE="auto"; shift ;;
    --delay)         DELAY="$2"; shift 2 ;;
    --interactive|-i) MODE="interactive"; shift ;;
    -h|--help)
      echo "Usage: $0 [--auto] [--delay SECONDS] [--interactive|-i]"
      echo ""
      echo "  --auto          Timed transitions (default)"
      echo "  --delay N       Seconds between steps (default: 1)"
      echo "  --interactive   Wait for Enter between each step"
      echo "  -i              Shorthand for --interactive"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Colors ──
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

info()    { echo -e "${BLUE}[info]${NC}   $1"; }
action()  { echo -e "${GREEN}[+]${NC}      $1"; }
move_()   { echo -e "${CYAN}[->]${NC}     $1"; }
done_()   { echo -e "${MAGENTA}[done]${NC}  $1"; }
header()  { echo -e "\n${BOLD}═══ $1 ═══${NC}\n"; }

# ── Paths ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INIT_WP="$ROOT_DIR/init/workplans"
BOARD_REPO="$ROOT_DIR/../board"

# ── Create temp directory ──
TMPDIR=$(mktemp -d /tmp/workplans-sim-XXXXX)
WORKPLANS="$TMPDIR/workplans"

info "Creating temporary workplans at ${DIM}$WORKPLANS${NC}"
mkdir -p "$WORKPLANS"/{backlog,doing,done}

# Copy board extension if available
if [[ -d "$BOARD_REPO" ]]; then
  mkdir -p "$WORKPLANS/extend/board"
  rsync -a --exclude='.DS_Store' --exclude='.git' "$BOARD_REPO/" "$WORKPLANS/extend/board/"
  info "Installed extend/board from agnostical/board"
else
  info "Skipping board (repo not found at $BOARD_REPO)"
fi

# Copy README files
for state in backlog doing done; do
  if [[ -f "$INIT_WP/$state/README.md" ]]; then
    cp "$INIT_WP/$state/README.md" "$WORKPLANS/$state/README.md"
  fi
done
[[ -f "$INIT_WP/README.md" ]] && cp "$INIT_WP/README.md" "$WORKPLANS/README.md"

# ── Find available port ──
PORT=8000
while lsof -i :"$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

# ── Start HTTP server ──
info "Starting HTTP server on port ${BOLD}$PORT${NC}"
cd "$WORKPLANS"
python3 -m http.server "$PORT" --bind 127.0.0.1 > /dev/null 2>&1 &
SERVER_PID=$!

# ── Cleanup trap ──
cleanup() {
  echo ""
  info "Cleaning up..."
  kill "$SERVER_PID" 2>/dev/null || true
  rm -rf "$TMPDIR"
  info "Done. Goodbye!"
}
trap cleanup EXIT INT TERM

# ── Wait for server ──
sleep 1

# ── Open browser ──
URL="http://localhost:$PORT/extend/board/"
info "Opening browser: ${BOLD}$URL${NC}"
if command -v open >/dev/null 2>&1; then
  open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"
else
  info "Please open $URL in your browser"
fi

# ── Simulated Date & Time (progresses with each act) ──
# SIM_DATE is used in filenames (date only).
# SIM_TIME is combined with SIM_DATE for frontmatter timestamps (YYYY-MM-DDThh:mm).
SIM_DATE="2026-01-05"
SIM_TIME="09:00"

# ──────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ──────────────────────────────────────────────────────────────

pause_step() {
  if [[ "$MODE" == "interactive" ]]; then
    echo -e "${DIM}  Press Enter to continue...${NC}"
    read -r
  else
    sleep "$DELAY"
  fi
}

# Creates a plan file with proper frontmatter.
# Body content is read from stdin (heredoc).
# Usage: write_plan STATE SLUG TITLE AUTHOR MODEL ASSIGNEE AMODEL <<'EOF'
write_plan() {
  local state="$1" slug="$2" title="$3" author="$4" model="$5"
  local assignee="${6:-}" amodel="${7:-}"
  local prefix
  prefix=$(echo "$state" | tr '[:lower:]' '[:upper:]')
  local filename="${prefix}-${SIM_DATE}-${author}_${slug}.md"
  local filepath="$WORKPLANS/$state/$filename"

  local sim_dt="${SIM_DATE}T${SIM_TIME}"

  {
    cat <<FRONTMATTER
---
title: "$title"
state: "$state"
author: "$author"
author_model: "$model"
assignee: "$assignee"
assignee_model: "$amodel"
backlog: "$([ "$state" = "backlog" ] && echo "$sim_dt" || echo "")"
doing: ""
done: ""
---
FRONTMATTER
    cat
  } > "$filepath"

  action "Created ${BOLD}$title${NC} in ${BOLD}$state${NC}"
}

# Moves a plan between states (renames file, updates frontmatter).
move_plan() {
  local from_state="$1" to_state="$2" slug="$3"
  local from_prefix to_prefix
  from_prefix=$(echo "$from_state" | tr '[:lower:]' '[:upper:]')
  to_prefix=$(echo "$to_state" | tr '[:lower:]' '[:upper:]')

  local src
  src=$(ls "$WORKPLANS/$from_state/"*"_${slug}.md" 2>/dev/null | head -1)
  if [[ -z "$src" ]]; then
    echo "  (file not found: $slug in $from_state)"
    return
  fi

  local basename
  basename=$(basename "$src")
  local new_name="${to_prefix}${basename#"$from_prefix"}"
  local dst="$WORKPLANS/$to_state/$new_name"

  local sim_dt="${SIM_DATE}T${SIM_TIME}"

  cp "$src" "$dst"
  sed -i '' "s/^state: \"$from_state\"/state: \"$to_state\"/" "$dst"
  sed -i '' "s/^${to_state}: \"\"/${to_state}: \"$sim_dt\"/" "$dst"
  rm "$src"

  move_ "Moved ${BOLD}$slug${NC}: $from_state → ${BOLD}$to_state${NC}"
}

# Checks the next N unchecked tasks in a plan.
check_task() {
  local state="$1" slug="$2" num="$3"
  local filepath
  filepath=$(ls "$WORKPLANS/$state/"*"_${slug}.md" 2>/dev/null | head -1)
  if [[ -z "$filepath" ]]; then echo "  (not found: $slug in $state)"; return; fi

  local checked=0
  local tmpfile
  tmpfile=$(mktemp)
  while IFS= read -r line; do
    if [[ "$line" == *"- [ ]"* ]] && [[ $checked -lt $num ]]; then
      checked=$((checked + 1))
      echo "${line/- \[ \]/- [x]}" >> "$tmpfile"
    else
      echo "$line" >> "$tmpfile"
    fi
  done < "$filepath"
  mv "$tmpfile" "$filepath"

  action "Checked ${BOLD}$checked${NC} task(s) in ${BOLD}$slug${NC}"
}

# Checks ALL remaining unchecked tasks in a plan.
complete_tasks() {
  local state="$1" slug="$2"
  local filepath
  filepath=$(ls "$WORKPLANS/$state/"*"_${slug}.md" 2>/dev/null | head -1)
  if [[ -z "$filepath" ]]; then echo "  (not found: $slug in $state)"; return; fi

  sed -i '' 's/- \[ \]/- [x]/g' "$filepath"
  action "Completed all tasks in ${BOLD}$slug${NC}"
}

# Progress tracker
DONE_COUNT=0
progress() {
  local pct=$((DONE_COUNT * 100 / 14))
  done_ "${BOLD}$DONE_COUNT/14${NC} plans completed (${BOLD}${pct}%${NC})"
}


# ──────────────────────────────────────────────────────────────
# SIMULATION SEQUENCE — 15 Acts
# ──────────────────────────────────────────────────────────────

header "Simulation Starting"
info "Mode: ${BOLD}$MODE${NC} | Delay: ${BOLD}${DELAY}s${NC}"
info "Board: ${BOLD}$URL${NC}"
info "Goal: ${BOLD}10/14${NC} plans to DONE (${BOLD}71%${NC})"
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-01-05"; SIM_TIME="09:00"
header "Act 1 — Arranque del proyecto"
# ══════════════════════════════════════════════════════════════

write_plan "backlog" "project-setup" "Initial project setup" \
  "sebastianserna" "claude-opus-4" "alexgarcia" "claude-sonnet-4" "" <<'EOF'

# Initial project setup

## Progress

### Phase 1: MVP
- [ ] Initialize Node.js project with TypeScript
- [ ] Set up ESLint and Prettier
- [ ] Configure PostgreSQL with migrations
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Create Docker Compose for local development

## Objective

Set up the foundational project structure, tooling, and CI/CD so the team can start building features on a solid base.

## Implementation

### Phase 1: MVP

Node.js 20 with TypeScript strict mode. ESLint with Airbnb config. PostgreSQL 16 with node-pg-migrate. GitHub Actions runs lint, type-check, and tests on every PR. Docker Compose includes PostgreSQL and Redis containers.
EOF
pause_step

SIM_TIME="09:12"
write_plan "backlog" "database-schema" "Database schema design" \
  "sebastianserna" "gpt-4o" "" "" <<'EOF'

# Database schema design

## Progress

### Phase 1: Core tables
- [ ] Design users table with indexes
- [ ] Design projects table with foreign keys
- [ ] Design tasks table with status enum
- [ ] Create migration files
- [ ] Add seed data for development

## Objective

Design and implement the core database schema that supports users, projects, and tasks. This schema is the foundation for all application features.

## Implementation

### Phase 1: Core tables

PostgreSQL with UUIDs as primary keys. All tables include `created_at` and `updated_at` timestamps with automatic triggers. Foreign keys use `ON DELETE CASCADE` for owned resources. Indexes on all frequently queried columns.

## Verification

- [ ] All migrations run cleanly on a fresh database
- [ ] Seed data populates correctly
- [ ] Foreign key constraints work as expected
- [ ] Query performance is acceptable with seed data volume
EOF
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-01-10"; SIM_TIME="10:00"
header "Act 2 — Primer sprint"
# ══════════════════════════════════════════════════════════════

move_plan "backlog" "doing" "project-setup"
pause_step
check_task "doing" "project-setup" 2
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-01-30"; SIM_TIME="14:00"
header "Act 3 — Primera entrega"
# ══════════════════════════════════════════════════════════════

complete_tasks "doing" "project-setup"
pause_step
SIM_TIME="14:10"
move_plan "doing" "done" "project-setup"
DONE_COUNT=1; progress
pause_step

SIM_TIME="14:20"
write_plan "backlog" "user-auth-setup" "User authentication setup" \
  "sebastianserna" "claude-opus-4" "" "" <<'EOF'

# User authentication setup

## Progress

### Phase 1: MVP
- [ ] Create database migration for users table
- [ ] Implement JWT token generation and validation
- [ ] Add login and registration API endpoints
- [ ] Create authentication middleware

### Phase 2: Improvements
- [ ] Add password reset flow
- [ ] Implement rate limiting on auth endpoints

## Objective

Implement user authentication for the application using JWT tokens. This is required before any user-facing feature can be deployed, as all API endpoints need to verify user identity.

## Context

The application currently has no authentication. The database is PostgreSQL and the API is built with Express. The frontend expects a Bearer token in the Authorization header.

## Implementation

### Phase 1: MVP

Create a `users` table with `id`, `email`, `password_hash`, `created_at`. Use bcrypt for password hashing and jsonwebtoken for JWT. The middleware will extract the token from the Authorization header and attach the user to `req.user`.

### Phase 2: Improvements

Add a `password_reset_tokens` table. Implement a `/forgot-password` endpoint that sends a reset link and a `/reset-password` endpoint that validates the token and updates the password.

## Verification

- [ ] Registration creates a user and returns a valid JWT
- [ ] Login with correct credentials returns a JWT
- [ ] Login with wrong credentials returns 401
- [ ] Protected endpoints reject requests without a valid token
EOF
pause_step

SIM_TIME="14:35"
write_plan "backlog" "notification-system" "Email notification system" \
  "sebastianserna" "mistral-large" "" "" "" <<'EOF'

# Email notification system

## Progress

### Phase 1: MVP
- [ ] Set up email service (SendGrid or AWS SES)
- [ ] Create email templates for welcome and password reset
- [ ] Implement notification queue with retry logic
- [ ] Add user notification preferences

## Objective

Build an email notification system so users receive transactional emails (welcome, password reset, activity alerts). This unblocks the authentication flow which needs password reset emails.

## Implementation

### Phase 1: MVP

Use SendGrid API with a simple queue backed by the existing PostgreSQL database. Templates will use Handlebars for variable interpolation. A background worker will process the queue every 30 seconds.
EOF
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-01"; SIM_TIME="09:00"
header "Act 4 — Base de datos"
# ══════════════════════════════════════════════════════════════

move_plan "backlog" "doing" "database-schema"
pause_step
check_task "doing" "database-schema" 3
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-08"; SIM_TIME="11:00"
header "Act 5 — DB completado + nuevos planes"
# ══════════════════════════════════════════════════════════════

complete_tasks "doing" "database-schema"
pause_step
SIM_TIME="11:10"
move_plan "doing" "done" "database-schema"
DONE_COUNT=2; progress
pause_step

SIM_TIME="11:20"
write_plan "backlog" "dashboard-redesign" "Dashboard redesign" \
  "sebastianserna" "claude-opus-4, gemini-pro" "" "" <<'EOF'

# Dashboard redesign

## Progress

### Phase 1: Layout & navigation
- [ ] Create new sidebar navigation component
- [ ] Implement responsive layout grid
- [ ] Add breadcrumb navigation
- [ ] Migrate existing widgets to new layout

### Phase 2: New widgets
- [ ] Activity feed widget
- [ ] Quick actions panel
- [ ] Stats overview cards

## Objective

Redesign the main dashboard to improve usability and information density. The current layout wastes screen space and the navigation is confusing for new users.

## Implementation

### Phase 1: Layout & navigation

Replace the top navbar with a collapsible sidebar. Use CSS Grid for the main content area with a 12-column layout. Breadcrumbs will be auto-generated from the route hierarchy.

### Phase 2: New widgets

Each widget is a self-contained React component that fetches its own data. The dashboard layout will be configurable via drag-and-drop in a future phase.

## Comments

### 2026-02-10 — sebastianserna
Starting dashboard overhaul. Sidebar and grid layout are the priority.
EOF
pause_step

SIM_TIME="11:30"
write_plan "backlog" "api-rate-limiting" "API rate limiting strategy" \
  "sebastianserna" "" "" "" "" <<'EOF'

# API rate limiting strategy

## Progress

### Phase 1: Rate limiting setup
- [ ] Choose rate limiting library and strategy
- [ ] Define rate limits per endpoint category
- [ ] Implement rate limiting middleware
- [ ] Add rate limit headers to API responses

## Objective

Add rate limiting to the API to prevent abuse and prepare for external consumers. After deploying authentication, we observed automated login attempts from multiple IPs.

## Context

The API currently has no rate limiting. We already use Redis for sessions, so a Redis-based solution (`rate-limiter-flexible`) fits the existing infrastructure. Need to define limits per endpoint before promoting to backlog.

## Implementation

### Phase 1: Rate limiting setup

Use `rate-limiter-flexible` with Redis backend for shared state across instances. Sliding window algorithm for smoother rate distribution. Different tiers: auth endpoints (stricter), read endpoints (relaxed), write endpoints (moderate). Include `X-RateLimit-*` headers in responses.
EOF
pause_step

SIM_TIME="11:45"
write_plan "backlog" "logging-monitoring" "Logging and monitoring setup" \
  "sebastianserna" "claude-opus-4" "" "" <<'EOF'

# Logging and monitoring setup

## Progress

### Phase 1: Structured logging
- [ ] Install and configure Winston logger
- [ ] Add request ID tracking with correlation
- [ ] Set up log levels per environment
- [ ] Create log rotation policy

### Phase 2: Monitoring
- [ ] Health check endpoint with dependency status
- [ ] Prometheus metrics endpoint
- [ ] Grafana dashboard for API performance
- [ ] Alert rules for error rate and latency

## Objective

Implement structured logging and monitoring to gain visibility into application health and debug production issues effectively.

## Implementation

### Phase 1: Structured logging

Using Winston with JSON format for production and pretty-print for development. Each request gets a unique `requestId` via middleware that's propagated through all log calls. Logs are written to stdout for container compatibility.

### Phase 2: Monitoring

Health check at `/health` reports database, Redis, and external service status. Prometheus metrics at `/metrics` expose request duration histograms, active connections, and error counters. Grafana dashboards visualize the data with alert thresholds.

## Verification

- [ ] Logs include requestId across all service layers
- [ ] Health check correctly reports degraded state when DB is slow
- [ ] Grafana dashboard shows request latency p50, p95, p99
- [ ] Alerts fire when error rate exceeds 5% over 5 minutes
EOF
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-10"; SIM_TIME="09:00"
header "Act 6 — Trabajo en paralelo"
# ══════════════════════════════════════════════════════════════

move_plan "backlog" "doing" "logging-monitoring"
pause_step
SIM_TIME="09:30"
move_plan "backlog" "doing" "dashboard-redesign"
pause_step
check_task "doing" "dashboard-redesign" 2
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-12"; SIM_TIME="10:00"
header "Act 7 — Logging avanza"
# ══════════════════════════════════════════════════════════════

check_task "doing" "logging-monitoring" 4
pause_step

SIM_TIME="10:20"
write_plan "backlog" "api-v2-endpoints" "API v2 endpoints" \
  "sebastianserna" "claude-opus-4" "alexgarcia" "claude-opus-4" "" <<'EOF'

# API v2 endpoints

## Progress

### Phase 1: Core endpoints
- [ ] Design new REST resource structure
- [ ] Implement pagination with cursor-based navigation
- [ ] Add filtering and sorting parameters
- [ ] Write OpenAPI spec documentation

## Objective

Create v2 of the API with improved pagination, filtering, and consistent error responses. The v1 endpoints will be maintained in parallel during the migration period.

## Implementation

### Phase 1: Core endpoints

All v2 endpoints live under `/api/v2/`. Pagination uses cursor-based navigation instead of offset. Filtering uses query parameters with operators (`?status=eq:active`). Error responses follow RFC 7807 Problem Details format.

## Comments

### 2026-02-18 — sebastianserna
Resource structure and cursor pagination implemented. Working on filter parser next.
EOF
pause_step

check_task "doing" "dashboard-redesign" 1
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-15"; SIM_TIME="15:00"
header "Act 8 — Logging completado"
# ══════════════════════════════════════════════════════════════

complete_tasks "doing" "logging-monitoring"
pause_step
SIM_TIME="15:10"
move_plan "doing" "done" "logging-monitoring"
DONE_COUNT=3; progress
pause_step

SIM_TIME="15:30"
write_plan "backlog" "dark-mode-design" "Dark mode design system" \
  "sebastianserna" "gpt-4o" "" "" "" <<'EOF'

# Dark mode design system

## Progress

### Phase 1: Design tokens
- [ ] Define semantic color tokens (background, surface, text, border)
- [ ] Create dark palette based on existing brand colors
- [ ] Implement theme toggle with Tailwind `class` strategy

### Phase 2: Component migration
- [ ] Update core UI components to use semantic tokens
- [ ] Add user preference persistence (localStorage)

## Objective

Add dark mode support to the application. Users have requested it and it improves accessibility and reduces eye strain in low-light environments.

## Context

The app currently uses hardcoded colors. We already use Tailwind CSS, which has native dark mode support via the `class` strategy. Need to define semantic color tokens before implementation.

## Implementation

### Phase 1: Design tokens

Define CSS custom properties for semantic colors (`--color-bg`, `--color-surface`, `--color-text-primary`, etc.) and map them to Tailwind's dark mode classes. Toggle via a `.dark` class on `<html>`.

### Phase 2: Component migration

Replace hardcoded color classes (`bg-white`, `text-gray-900`) with semantic tokens across all components. Store user preference in localStorage and respect `prefers-color-scheme` as default.
EOF
pause_step

SIM_TIME="15:45"
write_plan "backlog" "search-functionality" "Full-text search functionality" \
  "sebastianserna" "" "" "" "" <<'EOF'

# Full-text search functionality

## Progress

### Phase 1: MVP
- [ ] Add PostgreSQL full-text search indexes
- [ ] Create search API endpoint
- [ ] Build search results UI component

## Objective

Allow users to search across all content in the application using full-text search powered by PostgreSQL's built-in tsvector capabilities.

## Implementation

### Phase 1: MVP

Add GIN indexes on the relevant text columns. Create a `/api/search?q=term` endpoint that uses `ts_query` and ranks results by relevance. The frontend will have a search bar with debounced input and a results dropdown.
EOF
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-17"; SIM_TIME="09:00"
header "Act 9 — Nuevos frentes"
# ══════════════════════════════════════════════════════════════

move_plan "backlog" "doing" "api-v2-endpoints"
pause_step

SIM_TIME="09:20"
write_plan "backlog" "ci-pipeline" "CI/CD pipeline improvements" \
  "sebastianserna" "mistral-large" "" "" <<'EOF'

# CI/CD pipeline improvements

## Progress

### Phase 1: Build optimization
- [ ] Cache node_modules across CI runs
- [ ] Parallelize lint, type-check, and tests
- [ ] Add build artifact caching

### Phase 2: Deployment
- [ ] Staging auto-deploy on merge to main
- [ ] Production deploy with manual approval gate
- [ ] Rollback mechanism with previous image tag

## Objective

Improve the CI/CD pipeline to reduce build times from ~12 minutes to under 5 minutes and add automated staging deployments.

## Implementation

### Phase 1: Build optimization

Cache `node_modules` with a hash-based key. Split lint, type-check, and test into parallel jobs. Cache build artifacts between runs.

### Phase 2: Deployment

Staging deploys automatically on merge to main. Production requires a manual approval in GitHub Actions. Rollback uses the previous Docker image tag.

## Verification

- [ ] CI pipeline completes in under 5 minutes
- [ ] Staging auto-deploys successfully after merge
- [ ] Production deploy with approval gate works correctly
- [ ] Rollback tested and documented
EOF

check_task "doing" "api-v2-endpoints" 2
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-18"; SIM_TIME="08:30"
header "Act 10 — Sprint de CI + API"
# ══════════════════════════════════════════════════════════════

move_plan "backlog" "doing" "ci-pipeline"
pause_step
check_task "doing" "ci-pipeline" 4
pause_step
check_task "doing" "api-v2-endpoints" 1
check_task "doing" "dashboard-redesign" 1
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-20"; SIM_TIME="10:00"
header "Act 11 — Doble entrega"
# ══════════════════════════════════════════════════════════════

complete_tasks "doing" "ci-pipeline"
pause_step
SIM_TIME="10:10"
move_plan "doing" "done" "ci-pipeline"
DONE_COUNT=4; progress
pause_step

complete_tasks "doing" "api-v2-endpoints"
pause_step
SIM_TIME="10:20"
move_plan "doing" "done" "api-v2-endpoints"
DONE_COUNT=5; progress
pause_step

SIM_TIME="10:30"
write_plan "backlog" "websocket-realtime" "WebSocket real-time updates" \
  "sebastianserna" "deepseek-v3" "alexgarcia" "grok-3" <<'EOF'

# WebSocket real-time updates

## Progress

### Phase 1: Infrastructure
- [ ] Set up Socket.IO server alongside Express
- [ ] Implement authentication for WebSocket connections
- [ ] Create room management for project channels
- [ ] Add reconnection logic with exponential backoff

### Phase 2: Features
- [ ] Real-time task status updates
- [ ] Live cursor presence (who's viewing what)
- [ ] Notification push via WebSocket
- [ ] Activity feed live updates

## Objective

Add real-time capabilities to the application so that multiple users working on the same project can see changes instantly without refreshing the page.

## Implementation

### Phase 1: Infrastructure

Using Socket.IO for WebSocket support with automatic fallback to long-polling. Each project gets its own room. Authentication is handled by verifying the JWT token during the WebSocket handshake.

### Phase 2: Features

When a task is updated via the REST API, the server emits an event to all clients in the project room. The frontend listens for these events and updates the local state accordingly.

## Comments

### 2026-02-20 — sebastianserna
Starting WebSocket implementation. Socket.IO is the safest choice for browser compatibility.
EOF
pause_step

SIM_TIME="10:45"
write_plan "backlog" "role-permissions" "Role-based permissions" \
  "sebastianserna" "gemini-2.5-pro" "alexgarcia" "gpt-4o" <<'EOF'

# Role-based permissions

## Progress

### Phase 1: Core RBAC
- [ ] Define roles table and seed default roles (admin, editor, viewer)
- [ ] Create permissions table with resource-action pairs
- [ ] Build authorization middleware
- [ ] Add role assignment API endpoints

### Phase 2: UI integration
- [ ] Role management page in admin panel
- [ ] Permission checks in frontend components
- [ ] Invite users with specific roles

## Objective

Implement role-based access control (RBAC) to restrict actions based on user roles. Currently all authenticated users have the same permissions, which is a security concern.

## Implementation

### Phase 1: Core RBAC

Create `roles` and `permissions` tables. Each role has many permissions. Permissions are defined as `resource:action` pairs (e.g., `project:delete`, `task:create`). The middleware checks `req.user.role.permissions` against the required permission for each endpoint.

### Phase 2: UI integration

Admin users can manage roles from a settings page. Frontend components conditionally render based on the current user's permissions using a `usePermission('resource:action')` hook.

## Comments

### 2026-02-22 — sebastianserna
Auth setup needs to be done first (dependency on user-auth-setup plan).
EOF
pause_step

SIM_TIME="11:00"
write_plan "backlog" "file-upload-system" "File upload system" \
  "sebastianserna" "grok-3" "" "" "" <<'EOF'

# File upload system

## Progress

### Phase 1: Storage setup
- [ ] Set up S3-compatible storage (MinIO for dev, S3 for prod)
- [ ] Implement file upload API endpoint with presigned URLs
- [ ] Add file metadata table in PostgreSQL
- [ ] Define file size limits and allowed MIME types

### Phase 2: Integration
- [ ] Attach files to tasks and projects
- [ ] Generate image thumbnails on upload
- [ ] Build file browser UI component

## Objective

Allow users to upload files (images, documents) associated with projects and tasks. Users have requested the ability to attach screenshots to tasks and upload project assets.

## Context

Currently the app has no file handling. The backend is Express with PostgreSQL. S3-compatible storage (MinIO for dev, AWS S3 for prod) is the preferred approach for scalability with the same API in both environments.

## Implementation

### Phase 1: Storage setup

Use the AWS SDK with S3-compatible configuration pointing to MinIO locally and S3 in production. Browser uploads via presigned URLs to avoid proxying large files through the API. File metadata (name, size, MIME type, S3 key) stored in a `files` table.

### Phase 2: Integration

Files linked to tasks/projects via a `file_attachments` junction table. Image thumbnails generated with Sharp on upload. A reusable file browser component handles upload, preview, and deletion.

## Comments

### 2026-02-25 — sebastianserna
Initial draft. Leaning towards S3 for scalability but need to evaluate cost.

### 2026-02-26 — claude-opus-4
Recommend MinIO for development and S3 for production. Same API locally without cloud costs during dev.
EOF
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-22"; SIM_TIME="09:00"
header "Act 12 — WebSocket + Auth"
# ══════════════════════════════════════════════════════════════

move_plan "backlog" "doing" "websocket-realtime"
pause_step
SIM_TIME="09:15"
move_plan "backlog" "doing" "user-auth-setup"
pause_step
check_task "doing" "websocket-realtime" 3
pause_step
check_task "doing" "user-auth-setup" 3
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-25"; SIM_TIME="11:00"
header "Act 13 — Progreso múltiple"
# ══════════════════════════════════════════════════════════════

check_task "doing" "websocket-realtime" 2
check_task "doing" "user-auth-setup" 3
pause_step
check_task "doing" "dashboard-redesign" 1
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-02-27"; SIM_TIME="14:00"
header "Act 14 — Triple entrega"
# ══════════════════════════════════════════════════════════════

complete_tasks "doing" "websocket-realtime"
pause_step
SIM_TIME="14:10"
move_plan "doing" "done" "websocket-realtime"
DONE_COUNT=6; progress
pause_step

complete_tasks "doing" "user-auth-setup"
pause_step
SIM_TIME="14:20"
move_plan "doing" "done" "user-auth-setup"
DONE_COUNT=7; progress
pause_step

complete_tasks "doing" "dashboard-redesign"
pause_step
SIM_TIME="14:30"
move_plan "doing" "done" "dashboard-redesign"
DONE_COUNT=8; progress
pause_step

SIM_TIME="14:40"
move_plan "backlog" "doing" "role-permissions"
check_task "doing" "role-permissions" 3
pause_step


# ══════════════════════════════════════════════════════════════
SIM_DATE="2026-03-01"; SIM_TIME="09:00"
header "Act 15 — Cierre del timelapse"
# ══════════════════════════════════════════════════════════════

move_plan "backlog" "doing" "notification-system"
pause_step
complete_tasks "doing" "notification-system"
SIM_TIME="09:10"
move_plan "doing" "done" "notification-system"
DONE_COUNT=9; progress
pause_step

SIM_TIME="09:20"
move_plan "backlog" "doing" "search-functionality"
pause_step
complete_tasks "doing" "search-functionality"
SIM_TIME="09:30"
move_plan "doing" "done" "search-functionality"
DONE_COUNT=10; progress
pause_step


# ──────────────────────────────────────────────────────────────
header "Simulation Complete"
echo -e ""
echo -e "  ${BOLD}Final board state:${NC}"
echo -e ""
echo -e "  ${DIM}BACKLOG (3)${NC}         ${DIM}DOING (1)${NC}              ${BOLD}DONE (10)${NC}"
echo -e "  ────────────         ─────────              ─────────"
echo -e "  api-rate-limiting   role-permissions 43%   project-setup"
echo -e "  dark-mode-design                           database-schema"
echo -e "  file-upload                                logging-monitoring"
echo -e "                                             ci-pipeline"
echo -e "                                             api-v2-endpoints"
echo -e "                                             websocket-realtime"
echo -e "                                             user-auth-setup"
echo -e "                                             dashboard-redesign"
echo -e "                                             notification-system"
echo -e "                                             search-functionality"
echo -e ""
echo -e "  ${BOLD}10/14 plans completed — 71%${NC}"
echo -e ""
info "The board is still running at ${BOLD}$URL${NC}"
info "Press Ctrl+C to stop the server and clean up."

# Keep alive
wait "$SERVER_PID"
