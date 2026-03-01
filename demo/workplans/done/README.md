# Rules: done/

> Completed plans — archive and reference.

## Naming

```
DONE-YYYY-MM-DD-author_description.md
```

Date = when the plan was completed.

## Rules

- Frontmatter: `state: "done"` (see `workplans/README.md` for full format)
- All progress checkboxes should be checked
- Completed plans should generally not be modified

## Example

```markdown
---
plan: "User authentication setup"
state: "done"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "sebastianserna"
assignee_model: "claude-sonnet-4"
issue: ""
backlog: "2026-01-15"
coding: "2026-01-20"
done: "2026-02-01"
tags: "enhancement"
---

# User authentication setup

## Progress

### Phase 1: MVP
- [x] Create database migration for users table
- [x] Implement JWT token generation and validation
- [x] Add login and registration API endpoints
- [x] Create authentication middleware

## Objective

Implement user authentication using JWT tokens. Required before any user-facing feature can be deployed.

## Implementation

### Phase 1: MVP

Create a `users` table with `id`, `email`, `password_hash`, `created_at`. Use bcrypt for password hashing and jsonwebtoken for JWT. Middleware extracts token from Authorization header and attaches user to `req.user`.

## Comments

### 2026-02-01 — sebastianserna
All phases complete. Rate limiting set to 5 attempts per minute per IP. PR merged.
```
