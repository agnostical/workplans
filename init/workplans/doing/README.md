# Doing

Plans in progress, currently being implemented.

A plan moves here when someone is actively working on it. This folder represents ongoing effort — the plan has been scoped, assigned, and implementation is underway.

When the work is complete, the AI agent moves the plan to the `done/` folder. If the plan needs to be paused or deprioritized, it can be moved back to `backlog/`.

[View all states](../README.md)

## Example plan in doing

The same plan now in progress. Phase 1 is complete, assignee is set, and Phase 2 has been partially completed.

```markdown
---
id: 2606455842
title: "User authentication setup"
state: "doing"
author: "Sebastian Serna"
author_model: "claude-opus-4-6"
assignee: "Sebastian Serna"
assignee_model: "claude-sonnet-4-6"
backlog_date: "2026-03-05T09:30"
doing_date: "2026-03-06T14:00"
done_date: ""
format_version: "0.2.1"
---

# User authentication setup

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps
- [x] Refine with the user

### Phase 2: Define auth strategy
- [x] Choose authentication method
- [ ] Document security requirements

### Phase 3: Implement auth flow
- [ ] Set up authentication middleware
- [ ] Add login and registration endpoints

### Phase 4: Closing
- [ ] Write Closing Summary
- [ ] Validate implementation with the user

## Objective
Set up user authentication for the web application using JWT tokens, covering registration, login, and session management.

## Context
The project currently has no authentication. The team agreed on JWT-based auth to keep the backend stateless. Must support email/password registration and OAuth via Google.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Define auth strategy
Decided on JWT with RS256 signing over HS256 for better key rotation support. Token policy: access tokens expire in 15 minutes, refresh tokens in 7 days with single-use rotation. OAuth via Google uses the Authorization Code flow with PKCE — no client secret stored on the frontend.

Security requirements documented: bcrypt with cost factor 12 for password hashing, tokens stored in httpOnly secure cookies (not localStorage), rate limiting deferred to a future plan.

### Phase 3: Implement auth flow
Create Express middleware that validates JWT on protected routes. Implement three endpoints: `/auth/register` (email + password), `/auth/login` (returns access + refresh tokens), and `/auth/google` (OAuth callback). Use bcrypt for password hashing. Implement refresh token rotation to prevent token reuse attacks.

### Phase 4: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
_To be written when the last phase is completed._
```
