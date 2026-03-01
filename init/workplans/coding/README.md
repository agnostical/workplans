# Rules: coding/

> Plans actively being worked on.

## Naming

```
CODING-YYYY-MM-DD-author_description.md
```

Date = when work started.

## Rules

- Frontmatter: `state: "coding"` (see `workplans/README.md` for full format)
- Update progress checkboxes as steps are completed
- When done: move to `done/`, rename prefix to `DONE`, update date and frontmatter
- To pause: move back to `backlog/`, rename prefix to `BACKLOG`, update frontmatter

## Example

```markdown
---
plan: "User authentication setup"
state: "coding"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "sebastianserna"
assignee_model: "claude-sonnet-4"
issue: ""
backlog: "2026-01-15"
coding: "2026-01-20"
done: ""
tags: "enhancement"
---

# User authentication setup

## Progress

### Phase 1: MVP
- [x] Create database migration for users table
- [x] Implement JWT token generation and validation
- [ ] Add login and registration API endpoints
- [ ] Create authentication middleware

## Objective

Implement user authentication using JWT tokens. Required before any user-facing feature can be deployed.

## Implementation

### Phase 1: MVP

Create a `users` table with `id`, `email`, `password_hash`, `created_at`. Use bcrypt for password hashing and jsonwebtoken for JWT. Middleware extracts token from Authorization header and attaches user to `req.user`.

## Comments

### 2026-01-20 — sebastianserna
Started implementation. Migration and JWT utils are done. Moving on to API endpoints.
```
