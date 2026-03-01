# Rules: backlog/

> Pending plans waiting to be worked on.

## Naming

```
BACKLOG-YYYY-MM-DD-author_description.md
```

Date = when the plan was created.

## Rules

- Frontmatter: `state: "backlog"` (see `workplans/README.md` for full format)
- Fill in `author` and other relevant frontmatter fields
- To start work: move to `coding/`, rename prefix to `CODING`, update date and frontmatter
- Plans returned from `coding/` come back here

## Example

```markdown
---
plan: "User authentication setup"
state: "backlog"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: ""
assignee_model: ""
issue: ""
backlog: "2026-01-15"
coding: ""
done: ""
tags: "enhancement"
---

# User authentication setup

## Progress

### Phase 1: MVP
- [ ] Create database migration for users table
- [ ] Implement JWT token generation and validation
- [ ] Add login and registration API endpoints
- [ ] Create authentication middleware

## Objective

Implement user authentication using JWT tokens. Required before any user-facing feature can be deployed.

## Implementation

### Phase 1: MVP

Create a `users` table with `id`, `email`, `password_hash`, `created_at`. Use bcrypt for password hashing and jsonwebtoken for JWT. Middleware extracts token from Authorization header and attaches user to `req.user`.
```
