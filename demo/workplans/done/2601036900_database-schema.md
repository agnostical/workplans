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
