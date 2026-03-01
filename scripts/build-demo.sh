#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# build-demo.sh
# Regenerates demo/workplans from init/workplans and creates
# example plan files for all four states.
#
# Usage: ./scripts/build-demo.sh
# ─────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INIT="$ROOT_DIR/init/workplans"
DEMO="$ROOT_DIR/demo/workplans"

# ─── Clean & copy template ──────────────────────────────────────
echo "==> Removing demo/workplans..."
rm -rf "$DEMO"

echo "==> Copying init/workplans to demo/workplans..."
cp -r "$INIT" "$DEMO"

# ─── Backlog plans ──────────────────────────────────────────────
echo "==> Creating backlog plans..."

cat <<'EOF' > "$DEMO/backlog/BACKLOG-2026-01-15-sebastianserna_user-auth-setup.md"
---
plan: "User authentication setup"
state: "backlog"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: ""
assignee_model: ""
issue: "https://github.com/user/repo/issues/60"
backlog: "2026-01-15"
coding: ""
done: ""
tags: "enhancement, auth"
---

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

cat <<'EOF' > "$DEMO/backlog/BACKLOG-2026-02-01-sebastianserna_notification-system.md"
---
plan: "Email notification system"
state: "backlog"
author: "sebastianserna"
author_model: "mistral-large"
assignee: ""
assignee_model: ""
issue: ""
backlog: "2026-02-01"
coding: ""
done: ""
tags: "feature, notifications"
---

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

cat <<'EOF' > "$DEMO/backlog/BACKLOG-2026-02-20-sebastianserna_search-functionality.md"
---
plan: "Full-text search functionality"
state: "backlog"
author: "sebastianserna"
author_model: ""
assignee: ""
assignee_model: ""
issue: ""
backlog: "2026-02-20"
coding: ""
done: ""
tags: "feature"
---

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

cat <<'EOF' > "$DEMO/backlog/BACKLOG-2026-02-22-sebastianserna_role-permissions.md"
---
plan: "Role-based permissions"
state: "backlog"
author: "sebastianserna"
author_model: "gemini-2.5-pro"
assignee: "alexgarcia"
assignee_model: "gpt-4o"
issue: "https://github.com/user/repo/issues/88"
backlog: "2026-02-22"
coding: ""
done: ""
tags: "auth, security"
---

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
Moved to backlog. Auth setup needs to be done first (dependency on user-auth-setup plan).
EOF

# ─── Coding plans ───────────────────────────────────────────────
echo "==> Creating coding plans..."

cat <<'EOF' > "$DEMO/coding/CODING-2026-02-10-sebastianserna_dashboard-redesign.md"
---
plan: "Dashboard redesign"
state: "coding"
author: "sebastianserna"
author_model: "claude-opus-4, gemini-pro"
assignee: "alexgarcia"
assignee_model: "claude-sonnet-4"
issue: "https://github.com/user/repo/issues/75"
backlog: "2026-01-20"
coding: "2026-02-10"
done: ""
tags: "ui, enhancement"
---

# Dashboard redesign

## Progress

### Phase 1: Layout & navigation
- [x] Create new sidebar navigation component
- [x] Implement responsive layout grid
- [x] Add breadcrumb navigation
- [ ] Migrate existing widgets to new layout

### Phase 2: New widgets
- [x] Activity feed widget
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
Started work. Sidebar and grid layout are done. Breadcrumbs next.

### 2026-02-22 — claude-sonnet-4
Breadcrumbs and activity feed widget completed. Still need to migrate old widgets and build quick actions panel + stats cards.

### 2026-02-27 — sebastianserna
Activity feed looks great. Let's prioritize stats cards over quick actions for the MVP.
EOF

cat <<'EOF' > "$DEMO/coding/CODING-2026-02-18-sebastianserna_api-v2-endpoints.md"
---
plan: "API v2 endpoints"
state: "coding"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-opus-4"
issue: ""
backlog: "2026-02-05"
coding: "2026-02-18"
done: ""
tags: "api, enhancement"
---

# API v2 endpoints

## Progress

### Phase 1: Core endpoints
- [x] Design new REST resource structure
- [x] Implement pagination with cursor-based navigation
- [x] Add filtering and sorting parameters
- [ ] Write OpenAPI spec documentation

## Objective

Create v2 of the API with improved pagination, filtering, and consistent error responses. The v1 endpoints will be maintained in parallel during the migration period.

## Implementation

### Phase 1: Core endpoints

All v2 endpoints live under `/api/v2/`. Pagination uses cursor-based navigation instead of offset. Filtering uses query parameters with operators (`?status=eq:active`). Error responses follow RFC 7807 Problem Details format.

## Comments

### 2026-02-18 — sebastianserna
Resource structure and cursor pagination implemented. Working on filter parser next.

### 2026-02-25 — claude-opus-4
Filter parser done with support for `eq`, `gt`, `lt`, `in` operators. Sorting also implemented with multi-field support. Only OpenAPI docs remaining.
EOF

cat <<'EOF' > "$DEMO/coding/CODING-2026-02-20-sebastianserna_websocket-realtime.md"
---
plan: "WebSocket real-time updates"
state: "coding"
author: "sebastianserna"
author_model: "deepseek-v3"
assignee: "alexgarcia"
assignee_model: "grok-3"
issue: "https://github.com/user/repo/issues/82"
backlog: "2026-02-05"
coding: "2026-02-20"
done: ""
tags: "feature, real-time"
---

# WebSocket real-time updates

## Progress

### Phase 1: Infrastructure
- [x] Set up Socket.IO server alongside Express
- [x] Implement authentication for WebSocket connections
- [x] Create room management for project channels
- [ ] Add reconnection logic with exponential backoff

### Phase 2: Features
- [x] Real-time task status updates
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
Started implementation. Socket.IO is up and running with auth.

### 2026-02-24 — claude-sonnet-4
Room management and task status updates are working. Moving to presence and notifications next.

### 2026-02-27 — sebastianserna
Reconnection logic is trickier than expected. Need to handle token refresh during reconnection.
EOF

# ─── Done plans ─────────────────────────────────────────────────
echo "==> Creating done plans..."

cat <<'EOF' > "$DEMO/done/DONE-2026-01-30-sebastianserna_project-setup.md"
---
plan: "Initial project setup"
state: "done"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-sonnet-4"
issue: ""
backlog: "2026-01-05"
coding: "2026-01-10"
done: "2026-01-30"
tags: "setup"
---

# Initial project setup

## Progress

### Phase 1: MVP
- [x] Initialize Node.js project with TypeScript
- [x] Set up ESLint and Prettier
- [x] Configure PostgreSQL with migrations
- [x] Set up CI/CD pipeline with GitHub Actions
- [x] Create Docker Compose for local development

## Objective

Set up the foundational project structure, tooling, and CI/CD so the team can start building features on a solid base.

## Implementation

### Phase 1: MVP

Node.js 20 with TypeScript strict mode. ESLint with Airbnb config. PostgreSQL 16 with node-pg-migrate. GitHub Actions runs lint, type-check, and tests on every PR. Docker Compose includes PostgreSQL and Redis containers.

## Comments

### 2026-01-30 — sebastianserna
All done. CI pipeline is green. Team can start building features.
EOF

cat <<'EOF' > "$DEMO/done/DONE-2026-02-08-sebastianserna_database-schema.md"
---
plan: "Database schema design"
state: "done"
author: "sebastianserna"
author_model: "gpt-4o"
assignee: "alexgarcia"
assignee_model: "gpt-4o"
issue: "https://github.com/user/repo/issues/42"
backlog: "2026-01-10"
coding: "2026-01-20"
done: "2026-02-08"
tags: "database, architecture"
---

# Database schema design

## Progress

### Phase 1: Core tables
- [x] Design users table with indexes
- [x] Design projects table with foreign keys
- [x] Design tasks table with status enum
- [x] Create migration files
- [x] Add seed data for development

## Objective

Design and implement the core database schema that supports users, projects, and tasks. This schema is the foundation for all application features.

## Implementation

### Phase 1: Core tables

PostgreSQL with UUIDs as primary keys. All tables include `created_at` and `updated_at` timestamps with automatic triggers. Foreign keys use `ON DELETE CASCADE` for owned resources. Indexes on all frequently queried columns.

## Verification

- [x] All migrations run cleanly on a fresh database
- [x] Seed data populates correctly
- [x] Foreign key constraints work as expected
- [x] Query performance is acceptable with seed data volume

## Comments

### 2026-02-08 — sebastianserna
Schema finalized and deployed to staging. All migrations green.
EOF

cat <<'EOF' > "$DEMO/done/DONE-2026-02-15-sebastianserna_logging-monitoring.md"
---
plan: "Logging and monitoring setup"
state: "done"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-sonnet-4"
issue: "https://github.com/user/repo/issues/65"
backlog: "2026-01-20"
coding: "2026-02-01"
done: "2026-02-15"
tags: "infra, observability"
---

# Logging and monitoring setup

## Progress

### Phase 1: Structured logging
- [x] Install and configure Winston logger
- [x] Add request ID tracking with correlation
- [x] Set up log levels per environment
- [x] Create log rotation policy

### Phase 2: Monitoring
- [x] Health check endpoint with dependency status
- [x] Prometheus metrics endpoint
- [x] Grafana dashboard for API performance
- [x] Alert rules for error rate and latency

## Objective

Implement structured logging and monitoring to gain visibility into application health and debug production issues effectively.

## Implementation

### Phase 1: Structured logging

Using Winston with JSON format for production and pretty-print for development. Each request gets a unique `requestId` via middleware that's propagated through all log calls. Logs are written to stdout for container compatibility.

### Phase 2: Monitoring

Health check at `/health` reports database, Redis, and external service status. Prometheus metrics at `/metrics` expose request duration histograms, active connections, and error counters. Grafana dashboards visualize the data with alert thresholds.

## Verification

- [x] Logs include requestId across all service layers
- [x] Health check correctly reports degraded state when DB is slow
- [x] Grafana dashboard shows request latency p50, p95, p99
- [x] Alerts fire when error rate exceeds 5% over 5 minutes

## Comments

### 2026-02-01 — sebastianserna
Started coding. Winston setup is straightforward.

### 2026-02-10 — claude-sonnet-4
All logging and health checks are in place. Working on Grafana dashboards.

### 2026-02-15 — sebastianserna
Everything deployed and verified in staging. Moving to done.
EOF

cat <<'EOF' > "$DEMO/done/DONE-2026-02-20-sebastianserna_ci-pipeline.md"
---
plan: "CI/CD pipeline improvements"
state: "done"
author: "sebastianserna"
author_model: "mistral-large"
assignee: "alexgarcia"
assignee_model: "claude-sonnet-4"
issue: "https://github.com/user/repo/issues/70"
backlog: "2026-01-25"
coding: "2026-02-10"
done: "2026-02-20"
tags: "infra, ci/cd"
---

# CI/CD pipeline improvements

## Progress

### Phase 1: Build optimization
- [x] Cache node_modules across CI runs
- [x] Parallelize lint, type-check, and tests
- [x] Add build artifact caching

### Phase 2: Deployment
- [x] Staging auto-deploy on merge to main
- [x] Production deploy with manual approval gate
- [x] Rollback mechanism with previous image tag

## Objective

Improve the CI/CD pipeline to reduce build times from ~12 minutes to under 5 minutes and add automated staging deployments.

## Implementation

Build time reduced from 12 min to 3.5 min by caching dependencies and running lint/typecheck/test in parallel jobs. Staging deploys automatically on merge to main. Production requires a manual approval in GitHub Actions.

## Verification

- [x] CI pipeline completes in under 5 minutes
- [x] Staging auto-deploys successfully after merge
- [x] Production deploy with approval gate works correctly
- [x] Rollback tested and documented

## Comments

### 2026-02-10 — sebastianserna
Started optimizing. Cache alone brought it down to 7 min.

### 2026-02-15 — claude-sonnet-4
Parallel jobs implemented. Down to 3.5 min now.

### 2026-02-20 — sebastianserna
Production deploy pipeline verified. All done.
EOF

# ─── Draft plans ────────────────────────────────────────────────
echo "==> Creating draft plans..."

cat <<'EOF' > "$DEMO/draft/DRAFT-2026-02-10-sebastianserna_api-rate-limiting.md"
---
plan: "API rate limiting strategy"
state: "draft"
author: "sebastianserna"
author_model: ""
assignee: ""
assignee_model: ""
issue: ""
backlog: ""
coding: ""
done: ""
tags: "architecture, api"
---

# API rate limiting strategy

## Context

The API currently has no rate limiting. After deploying authentication, we observed automated login attempts from multiple IPs. We need a strategy before opening the API to external consumers.

## Options considered

### Option A: Express middleware (express-rate-limit)
- Pros: simple setup, no external dependencies
- Cons: per-instance only, not suitable for multi-instance deployments

### Option B: Redis-based (rate-limiter-flexible)
- Pros: shared across instances, supports sliding window
- Cons: requires Redis infrastructure

## Decision

Leaning towards Option B since we already use Redis for sessions. To be promoted to backlog once limits per endpoint are defined.
EOF

cat <<'EOF' > "$DEMO/draft/DRAFT-2026-02-15-sebastianserna_dark-mode-design.md"
---
plan: "Dark mode design system"
state: "draft"
author: "sebastianserna"
author_model: "gpt-4o"
assignee: ""
assignee_model: ""
issue: ""
backlog: ""
coding: ""
done: ""
tags: "design, ui"
---

# Dark mode design system

## Context

Users have requested dark mode support. We need to define a color palette and component theming strategy before implementation.

## Options considered

### Option A: CSS custom properties with class toggle
- Simple, no runtime cost, works with any framework

### Option B: Tailwind dark mode with `class` strategy
- Already using Tailwind, native support, minimal effort

## Decision

Pending design review. Need to define semantic color tokens first.
EOF

cat <<'EOF' > "$DEMO/draft/DRAFT-2026-02-25-sebastianserna_file-upload-system.md"
---
plan: "File upload system"
state: "draft"
author: "sebastianserna"
author_model: "grok-3"
assignee: ""
assignee_model: ""
issue: ""
backlog: ""
coding: ""
done: ""
tags: "feature, storage"
---

# File upload system

## Objective

Allow users to upload files (images, documents, etc.) associated with projects and tasks. Need to decide on storage strategy before moving to backlog.

## Open Questions

- Should we use local filesystem storage or S3-compatible object storage?
- What are the file size limits? 10MB? 50MB?
- Do we need image processing (thumbnails, resizing)?

## Context

Currently the app has no file handling. Users have requested the ability to attach screenshots to tasks and upload project assets. The backend is Express with PostgreSQL.

## Options

### Option A: Local filesystem
Simple to implement. Files stored in `/uploads` directory. Served by Express static middleware. No external dependencies.

### Option B: S3-compatible storage
More scalable. Works with AWS S3 or MinIO for self-hosted. Presigned URLs for direct upload from the browser.

## Comments

### 2026-02-25 — sebastianserna
Initial draft. Leaning towards S3 for scalability but need to evaluate cost.

### 2026-02-26 — claude-opus-4
Recommend Option B with MinIO for development and S3 for production. This gives you the same API locally without cloud costs during dev.
EOF

echo "==> Done! demo/workplans regenerated with 14 example plans."
