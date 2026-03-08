#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# build-demo.sh
# Regenerates demo/workplans from init/workplans and creates
# example plan files for all three states (v0.2.0 format).
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

cat <<'EOF' > "$DEMO/backlog/2601551600_user-auth-setup.md"
---
id: 2601551600
title: "User authentication setup"
state: "backlog"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: ""
assignee_model: ""
backlog_date: "2026-01-15T14:20"
doing_date: ""
done_date: ""
---

# User authentication setup

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: MVP
- [ ] Create database migration for users table
- [ ] Implement JWT token generation and validation
- [ ] Add login and registration API endpoints
- [ ] Create authentication middleware

### Phase 3: Improvements
- [ ] Add password reset flow
- [ ] Implement rate limiting on auth endpoints

## Objective
Implement user authentication for the application using JWT tokens. This is required before any user-facing feature can be deployed, as all API endpoints need to verify user identity.

## Context
The application currently has no authentication. The database is PostgreSQL and the API is built with Express. The frontend expects a Bearer token in the Authorization header.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: MVP

Create a `users` table with `id`, `email`, `password_hash`, `created_at`. Use bcrypt for password hashing and jsonwebtoken for JWT. The middleware will extract the token from the Authorization header and attach the user to `req.user`.

### Phase 3: Improvements

Add a `password_reset_tokens` table. Implement a `/forgot-password` endpoint that sends a reset link and a `/reset-password` endpoint that validates the token and updates the password.

## Closing Summary
_To be written when the last phase is completed._
EOF

cat <<'EOF' > "$DEMO/backlog/2602836000_notification-system.md"
---
id: 2602836000
title: "Email notification system"
state: "backlog"
author: "sebastianserna"
author_model: "mistral-large"
assignee: ""
assignee_model: ""
backlog_date: "2026-02-01T09:15"
doing_date: ""
done_date: ""
---

# Email notification system

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: MVP
- [ ] Set up email service (SendGrid or AWS SES)
- [ ] Create email templates for welcome and password reset
- [ ] Implement notification queue with retry logic
- [ ] Add user notification preferences

## Objective
Build an email notification system so users receive transactional emails (welcome, password reset, activity alerts). This unblocks the authentication flow which needs password reset emails.

## Context
The application has no email capabilities yet. We already use PostgreSQL for the database and can leverage it for a simple job queue. SendGrid is the preferred provider, with AWS SES as fallback.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: MVP

Use SendGrid API with a simple queue backed by the existing PostgreSQL database. Templates will use Handlebars for variable interpolation. A background worker will process the queue every 30 seconds.

## Closing Summary
_To be written when the last phase is completed._
EOF

cat <<'EOF' > "$DEMO/backlog/2604739600_search-functionality.md"
---
id: 2604739600
title: "Full-text search functionality"
state: "backlog"
author: "sebastianserna"
author_model: ""
assignee: ""
assignee_model: ""
backlog_date: "2026-02-20T15:45"
doing_date: ""
done_date: ""
---

# Full-text search functionality

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: MVP
- [ ] Add PostgreSQL full-text search indexes
- [ ] Create search API endpoint
- [ ] Build search results UI component

## Objective
Allow users to search across all content in the application using full-text search powered by PostgreSQL's built-in tsvector capabilities.

## Context
The application stores content in PostgreSQL. PostgreSQL has built-in full-text search with tsvector and GIN indexes, which avoids introducing an external search engine like Elasticsearch at this stage.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: MVP

Add GIN indexes on the relevant text columns. Create a `/api/search?q=term` endpoint that uses `ts_query` and ranks results by relevance. The frontend will have a search bar with debounced input and a results dropdown.

## Closing Summary
_To be written when the last phase is completed._
EOF

cat <<'EOF' > "$DEMO/backlog/2604952200_role-permissions.md"
---
id: 2604952200
title: "Role-based permissions"
state: "backlog"
author: "sebastianserna"
author_model: "gemini-2.5-pro"
assignee: "alexgarcia"
assignee_model: "gpt-4o"
backlog_date: "2026-02-22T09:25"
doing_date: ""
done_date: ""
---

# Role-based permissions

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: Core RBAC
- [ ] Define roles table and seed default roles (admin, editor, viewer)
- [ ] Create permissions table with resource-action pairs
- [ ] Build authorization middleware
- [ ] Add role assignment API endpoints

### Phase 3: UI integration
- [ ] Role management page in admin panel
- [ ] Permission checks in frontend components
- [ ] Invite users with specific roles

## Objective
Implement role-based access control (RBAC) to restrict actions based on user roles. Currently all authenticated users have the same permissions, which is a security concern.

## Context
Authentication is already implemented with JWT. The database is PostgreSQL. The frontend uses React with a custom hook pattern for feature flags. No authorization layer exists yet.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Core RBAC

Create `roles` and `permissions` tables. Each role has many permissions. Permissions are defined as `resource:action` pairs (e.g., `project:delete`, `task:create`). The middleware checks `req.user.role.permissions` against the required permission for each endpoint.

### Phase 3: UI integration

Admin users can manage roles from a settings page. Frontend components conditionally render based on the current user's permissions using a `usePermission('resource:action')` hook.

## Closing Summary
_To be written when the last phase is completed._
EOF

# ─── Doing plans ───────────────────────────────────────────────
echo "==> Creating doing plans..."

cat <<'EOF' > "$DEMO/doing/2601557600_dashboard-redesign.md"
---
id: 2601557600
title: "Dashboard redesign"
state: "doing"
author: "sebastianserna"
author_model: "claude-opus-4, gemini-pro"
assignee: "alexgarcia"
assignee_model: "claude-sonnet-4"
backlog_date: "2026-01-20T10:00"
doing_date: "2026-02-10T09:30"
done_date: ""
---

# Dashboard redesign

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: Layout & navigation
- [x] Create new sidebar navigation component
- [x] Implement responsive layout grid
- [x] Add breadcrumb navigation
- [ ] Migrate existing widgets to new layout

### Phase 3: New widgets
- [x] Activity feed widget
- [ ] Quick actions panel
- [ ] Stats overview cards

## Objective
Redesign the main dashboard to improve usability and information density. The current layout wastes screen space and the navigation is confusing for new users.

## Context
The current dashboard uses a top navbar with a single-column layout. The frontend is React with Tailwind CSS. User feedback consistently mentions difficulty finding features and wasted screen space on wide monitors.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Layout & navigation

Replace the top navbar with a collapsible sidebar. Use CSS Grid for the main content area with a 12-column layout. Breadcrumbs will be auto-generated from the route hierarchy.

### Phase 3: New widgets

Each widget is a self-contained React component that fetches its own data. The dashboard layout will be configurable via drag-and-drop in a future phase.

## Closing Summary
_To be written when the last phase is completed._
EOF

cat <<'EOF' > "$DEMO/doing/2603334200_api-v2-endpoints.md"
---
id: 2603334200
title: "API v2 endpoints"
state: "doing"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-opus-4"
backlog_date: "2026-02-05T11:00"
doing_date: "2026-02-18T09:00"
done_date: ""
---

# API v2 endpoints

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: Core endpoints
- [x] Design new REST resource structure
- [x] Implement pagination with cursor-based navigation
- [x] Add filtering and sorting parameters
- [ ] Write OpenAPI spec documentation

## Objective
Create v2 of the API with improved pagination, filtering, and consistent error responses. The v1 endpoints will be maintained in parallel during the migration period.

## Context
The v1 API uses offset-based pagination which performs poorly on large datasets. Error responses are inconsistent across endpoints. External consumers have requested filtering and sorting capabilities.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Core endpoints

All v2 endpoints live under `/api/v2/`. Pagination uses cursor-based navigation instead of offset. Filtering uses query parameters with operators (`?status=eq:active`). Error responses follow RFC 7807 Problem Details format.

## Closing Summary
_To be written when the last phase is completed._
EOF

cat <<'EOF' > "$DEMO/doing/2603440500_websocket-realtime.md"
---
id: 2603440500
title: "WebSocket real-time updates"
state: "doing"
author: "sebastianserna"
author_model: "deepseek-v3"
assignee: "alexgarcia"
assignee_model: "grok-3"
backlog_date: "2026-02-05T14:00"
doing_date: "2026-02-20T10:30"
done_date: ""
---

# WebSocket real-time updates

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: Infrastructure
- [x] Set up Socket.IO server alongside Express
- [x] Implement authentication for WebSocket connections
- [x] Create room management for project channels
- [ ] Add reconnection logic with exponential backoff

### Phase 3: Features
- [x] Real-time task status updates
- [ ] Live cursor presence (who's viewing what)
- [ ] Notification push via WebSocket
- [ ] Activity feed live updates

## Objective
Add real-time capabilities to the application so that multiple users working on the same project can see changes instantly without refreshing the page.

## Context
The application currently relies on polling for updates. The backend is Express with JWT authentication. Multiple users frequently work on the same project simultaneously, leading to stale data and conflicts.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Infrastructure

Using Socket.IO for WebSocket support with automatic fallback to long-polling. Each project gets its own room. Authentication is handled by verifying the JWT token during the WebSocket handshake.

### Phase 3: Features

When a task is updated via the REST API, the server emits an event to all clients in the project room. The frontend listens for these events and updates the local state accordingly.

## Closing Summary
_To be written when the last phase is completed._
EOF

# ─── Done plans ─────────────────────────────────────────────────
echo "==> Creating done plans..."

cat <<'EOF' > "$DEMO/done/2600532400_project-setup.md"
---
id: 2600532400
title: "Initial project setup"
state: "done"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-sonnet-4"
backlog_date: "2026-01-05T09:00"
doing_date: "2026-01-10T10:00"
done_date: "2026-01-30T14:10"
---

# Initial project setup

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: MVP
- [x] Initialize Node.js project with TypeScript
- [x] Set up ESLint and Prettier
- [x] Configure PostgreSQL with migrations
- [x] Set up CI/CD pipeline with GitHub Actions
- [x] Create Docker Compose for local development

## Objective
Set up the foundational project structure, tooling, and CI/CD so the team can start building features on a solid base.

## Context
Starting a new project from scratch. The team agreed on Node.js with TypeScript, PostgreSQL as the database, and GitHub Actions for CI/CD. Docker Compose will standardize the local development environment.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: MVP

Node.js 20 with TypeScript strict mode. ESLint with Airbnb config. PostgreSQL 16 with node-pg-migrate. GitHub Actions runs lint, type-check, and tests on every PR. Docker Compose includes PostgreSQL and Redis containers.

## Closing Summary
- All tooling and CI pipeline set up and verified
- CI pipeline is green, team can start building features
- Docker Compose environment works for all team members
EOF

cat <<'EOF' > "$DEMO/done/2601036900_database-schema.md"
---
id: 2601036900
title: "Database schema design"
state: "done"
author: "sebastianserna"
author_model: "gpt-4o"
assignee: "alexgarcia"
assignee_model: "gpt-4o"
backlog_date: "2026-01-10T10:15"
doing_date: "2026-01-20T09:00"
done_date: "2026-02-08T11:10"
---

# Database schema design

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: Core tables
- [x] Design users table with indexes
- [x] Design projects table with foreign keys
- [x] Design tasks table with status enum
- [x] Create migration files
- [x] Add seed data for development

## Objective
Design and implement the core database schema that supports users, projects, and tasks. This schema is the foundation for all application features.

## Context
The project uses PostgreSQL 16 with node-pg-migrate for migrations. No tables exist yet. The initial feature set requires users, projects, and tasks with relationships between them.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Core tables

PostgreSQL with UUIDs as primary keys. All tables include `created_at` and `updated_at` timestamps with automatic triggers. Foreign keys use `ON DELETE CASCADE` for owned resources. Indexes on all frequently queried columns.

## Closing Summary
- Schema finalized and deployed to staging
- All migrations run cleanly on fresh databases
- Seed data populates correctly for development
- Foreign key constraints and query performance verified
EOF

cat <<'EOF' > "$DEMO/done/2601632400_logging-monitoring.md"
---
id: 2601632400
title: "Logging and monitoring setup"
state: "done"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-sonnet-4"
backlog_date: "2026-01-20T11:00"
doing_date: "2026-02-01T10:00"
done_date: "2026-02-15T15:10"
---

# Logging and monitoring setup

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: Structured logging
- [x] Install and configure Winston logger
- [x] Add request ID tracking with correlation
- [x] Set up log levels per environment
- [x] Create log rotation policy

### Phase 3: Monitoring
- [x] Health check endpoint with dependency status
- [x] Prometheus metrics endpoint
- [x] Grafana dashboard for API performance
- [x] Alert rules for error rate and latency

## Objective
Implement structured logging and monitoring to gain visibility into application health and debug production issues effectively.

## Context
The application currently uses `console.log` with no structure or correlation. Production debugging requires SSH access to read raw logs. The infrastructure already includes Redis and PostgreSQL, and the team has access to a Grafana instance.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Structured logging

Using Winston with JSON format for production and pretty-print for development. Each request gets a unique `requestId` via middleware that's propagated through all log calls. Logs are written to stdout for container compatibility.

### Phase 3: Monitoring

Health check at `/health` reports database, Redis, and external service status. Prometheus metrics at `/metrics` expose request duration histograms, active connections, and error counters. Grafana dashboards visualize the data with alert thresholds.

## Closing Summary
- Winston logging with request ID correlation deployed across all services
- Health check correctly reports degraded state when dependencies are slow
- Grafana dashboards show p50, p95, p99 latency with alert thresholds
- Alerts fire when error rate exceeds 5% over 5 minutes
EOF

cat <<'EOF' > "$DEMO/done/2602250400_ci-pipeline.md"
---
id: 2602250400
title: "CI/CD pipeline improvements"
state: "done"
author: "sebastianserna"
author_model: "mistral-large"
assignee: "alexgarcia"
assignee_model: "claude-sonnet-4"
backlog_date: "2026-01-25T09:30"
doing_date: "2026-02-10T08:30"
done_date: "2026-02-20T10:10"
---

# CI/CD pipeline improvements

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: Build optimization
- [x] Cache node_modules across CI runs
- [x] Parallelize lint, type-check, and tests
- [x] Add build artifact caching

### Phase 3: Deployment
- [x] Staging auto-deploy on merge to main
- [x] Production deploy with manual approval gate
- [x] Rollback mechanism with previous image tag

## Objective
Improve the CI/CD pipeline to reduce build times from ~12 minutes to under 5 minutes and add automated staging deployments.

## Context
The current CI pipeline runs on GitHub Actions but takes ~12 minutes because it installs dependencies from scratch every run. Deployments are manual via SSH. The team uses Docker images for production.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Build optimization

Reduced build time from 12 min to 3.5 min by caching `node_modules` across CI runs and running lint, type-check, and tests as parallel jobs. Added build artifact caching to avoid redundant rebuilds.

### Phase 3: Deployment

Staging auto-deploys on merge to main via GitHub Actions. Production deploys require a manual approval gate. Rollback uses the previous Docker image tag for instant recovery.

## Closing Summary
- CI pipeline reduced from 12 min to 3.5 min with caching and parallel jobs
- Staging auto-deploy verified and working on merge to main
- Production deploy with approval gate tested successfully
- Rollback mechanism documented and tested
EOF

# ─── Backlog plans (still being defined — Phase 1 unchecked) ───
echo "==> Creating backlog plans (still defining)..."

cat <<'EOF' > "$DEMO/backlog/2604141400_api-rate-limiting.md"
---
id: 2604141400
title: "API rate limiting strategy"
state: "backlog"
author: "sebastianserna"
author_model: ""
assignee: ""
assignee_model: ""
backlog_date: "2026-02-10T11:30"
doing_date: ""
done_date: ""
---

# API rate limiting strategy

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [ ] Define phases and steps

### Phase 2: Rate limiting setup
- [ ] Choose rate limiting library and strategy
- [ ] Define rate limits per endpoint category
- [ ] Implement rate limiting middleware
- [ ] Add rate limit headers to API responses

## Objective
Add rate limiting to the API to prevent abuse and prepare for external consumers. After deploying authentication, we observed automated login attempts from multiple IPs.

## Context
The API currently has no rate limiting. We already use Redis for sessions, so a Redis-based solution (`rate-limiter-flexible`) fits the existing infrastructure. Need to define limits per endpoint before promoting to backlog.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Rate limiting setup

Use `rate-limiter-flexible` with Redis backend for shared state across instances. Sliding window algorithm for smoother rate distribution. Different tiers: auth endpoints (stricter), read endpoints (relaxed), write endpoints (moderate). Include `X-RateLimit-*` headers in responses.

## Closing Summary
_To be written when the last phase is completed._
EOF

cat <<'EOF' > "$DEMO/backlog/2604655800_dark-mode-design.md"
---
id: 2604655800
title: "Dark mode design system"
state: "backlog"
author: "sebastianserna"
author_model: "gpt-4o"
assignee: ""
assignee_model: ""
backlog_date: "2026-02-15T15:30"
doing_date: ""
done_date: ""
---

# Dark mode design system

## Progress
### Phase 1: Definition
- [ ] Define objective and context
- [ ] Define phases and steps

### Phase 2: Design tokens
- [ ] Define semantic color tokens (background, surface, text, border)
- [ ] Create dark palette based on existing brand colors
- [ ] Implement theme toggle with Tailwind `class` strategy

### Phase 3: Component migration
- [ ] Update core UI components to use semantic tokens
- [ ] Add user preference persistence (localStorage)

## Objective
Add dark mode support to the application. Users have requested it and it improves accessibility and reduces eye strain in low-light environments.

## Context
The app currently uses hardcoded colors. We already use Tailwind CSS, which has native dark mode support via the `class` strategy. Need to define semantic color tokens before implementation.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Design tokens

Define CSS custom properties for semantic colors (`--color-bg`, `--color-surface`, `--color-text-primary`, etc.) and map them to Tailwind's dark mode classes. Toggle via a `.dark` class on `<html>`.

### Phase 3: Component migration

Replace hardcoded color classes (`bg-white`, `text-gray-900`) with semantic tokens across all components. Store user preference in localStorage and respect `prefers-color-scheme` as default.

## Closing Summary
_To be written when the last phase is completed._
EOF

cat <<'EOF' > "$DEMO/backlog/2605639600_file-upload-system.md"
---
id: 2605639600
title: "File upload system"
state: "backlog"
author: "sebastianserna"
author_model: "grok-3"
assignee: ""
assignee_model: ""
backlog_date: "2026-02-25T11:00"
doing_date: ""
done_date: ""
---

# File upload system

## Progress
### Phase 1: Definition
- [ ] Define objective and context
- [ ] Define phases and steps

### Phase 2: Storage setup
- [ ] Set up S3-compatible storage (MinIO for dev, S3 for prod)
- [ ] Implement file upload API endpoint with presigned URLs
- [ ] Add file metadata table in PostgreSQL
- [ ] Define file size limits and allowed MIME types

### Phase 3: Integration
- [ ] Attach files to tasks and projects
- [ ] Generate image thumbnails on upload
- [ ] Build file browser UI component

## Objective
Allow users to upload files (images, documents) associated with projects and tasks. Users have requested the ability to attach screenshots to tasks and upload project assets.

## Context
Currently the app has no file handling. The backend is Express with PostgreSQL. S3-compatible storage (MinIO for dev, AWS S3 for prod) is the preferred approach for scalability with the same API in both environments.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Storage setup

Use the AWS SDK with S3-compatible configuration pointing to MinIO locally and S3 in production. Browser uploads via presigned URLs to avoid proxying large files through the API. File metadata (name, size, MIME type, S3 key) stored in a `files` table.

### Phase 3: Integration

Files linked to tasks/projects via a `file_attachments` junction table. Image thumbnails generated with Sharp on upload. A reusable file browser component handles upload, preview, and deletion.

## Closing Summary
_To be written when the last phase is completed._
EOF

# ─── Write static READMEs ────────────────────────────────────────
# State folder READMEs are static descriptions (not auto-generated).
# The init scaffold has minimal versions; here we write richer ones
# matching the demo's purpose as a reference example.
echo "==> Writing static READMEs..."

cat <<'README' > "$DEMO/backlog/README.md"
# Backlog

Plans pending, waiting for definition or execution.

This is the starting point for all plans. A plan enters the backlog when it has been identified as something worth doing but has not yet started. It may still need further research, scoping, or prioritization before moving forward.

When a plan is ready to be worked on, the AI agent moves it to the `doing/` folder and updates its metadata.

[View all states](../README.md)
README

cat <<'README' > "$DEMO/doing/README.md"
# Doing

Plans in progress, currently being implemented.

A plan moves here when someone is actively working on it. This folder represents ongoing effort — the plan has been scoped, assigned, and implementation is underway.

When the work is complete, the AI agent moves the plan to the `done/` folder. If the plan needs to be paused or deprioritized, it can be moved back to `backlog/`.

[View all states](../README.md)
README

cat <<'README' > "$DEMO/done/README.md"
# Done

Plans completed and closed.

A plan moves here when its implementation is finished and verified. This folder serves as a historical record of all completed work, useful for reference and retrospectives.

Done plans should generally not be modified. If a completed plan needs rework, create a new plan in `backlog/` instead of reopening the old one.

[View all states](../README.md)
README

# ─── Write root README ───────────────────────────────────────────
echo "==> Writing root README..."

cat <<'README' > "$DEMO/README.md"
# Plans

This file describes the workflow states used to organize plans. Each state corresponds to a folder where plan files are stored. Browse each folder to see its plans.

| State | Folder | Description |
|-------|--------|-------------|
| Backlog | [backlog/](backlog/) | Plans pending, waiting for definition or execution |
| Doing | [doing/](doing/) | Plans in progress, currently being implemented |
| Done | [done/](done/) | Plans completed and closed |

Plans move through these states as they progress from idea to completion. State transitions are handled by AI agents following the rules defined in [RULES.md](RULES.md). The agent moves the file to the corresponding folder and updates the plan's metadata accordingly.

To create a new plan, ask your AI agent. For example:

> _Create a plan for implementing user authentication with OAuth2_

The agent will follow the rules to generate the plan file with the correct format and place it in `backlog/`.
README

echo "==> Done! demo/workplans regenerated with 14 example plans."
