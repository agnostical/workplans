---
format: "0.4.0"
id: 2601036900
title: "Database schema design"
priority: "high"
estimate: 5
author: "sebastianserna"
author_model: "gpt-4o"
assignee: "alexgarcia"
assignee_model: "gpt-4o"
state: "done"
backlog_date: "2026-01-10T10:15"
doing_date: "2026-01-20T09:00"
done_date: "2026-02-08T11:10"
tracked_in: ""
relations:
  blocked_by: "2600532400"
---

# Database schema design

## Objective
Design and implement the core database schema that supports users, projects, and tasks. This schema is the foundation for all application features.

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps
- [x] Refine with the user

### Phase 2: Core tables
- [x] Design users table with indexes
- [x] Design projects table with foreign keys
- [x] Design tasks table with status enum
- [x] Create migration files
- [x] Add seed data for development

### Phase 3: Closing
- [x] Write Closing Summary
- [x] Validate implementation with the user

## Context
The project uses PostgreSQL 16 with node-pg-migrate for migrations. No tables exist yet. The initial feature set requires users, projects, and tasks with relationships between them.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Core tables

PostgreSQL with UUIDs as primary keys. All tables include `created_at` and `updated_at` timestamps with automatic triggers. Foreign keys use `ON DELETE CASCADE` for owned resources. Indexes on all frequently queried columns.

### Phase 3: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
The database schema is finalized and deployed to staging. Migrations run cleanly on fresh databases and seed data populates correctly for development. Foreign key constraints and query performance are verified.

### Delivered
- Normalized schema with migrations and seed data

### Verification
- Fresh-database migration runs, constraint checks, and query benchmarks
