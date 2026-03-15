# Done

Plans completed and closed.

A plan moves here when its implementation is finished and verified. This folder serves as a historical record of all completed work, useful for reference and retrospectives.

Done plans should generally not be modified. If a completed plan needs rework, create a new plan in `backlog/` instead of reopening the old one.

[View all states](../README.md)

## Example plan in done

The same plan fully completed. All steps are checked, done_date is set, and the Closing Summary is written.

```markdown
---
id: 2606455842
title: "User authentication setup"
state: "done"
author: "Sebastian Serna"
author_model: "claude-opus-4-6"
assignee: "Sebastian Serna"
assignee_model: "claude-sonnet-4-6"
backlog_date: "2026-03-05T09:30"
doing_date: "2026-03-06T14:00"
done_date: "2026-03-07T18:45"
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
- [x] Document security requirements

### Phase 3: Implement auth flow
- [x] Set up authentication middleware
- [x] Add login and registration endpoints

### Phase 4: Closing
- [x] Write Closing Summary
- [x] Validate implementation with the user

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
Added Express middleware in `src/middleware/auth.ts` that validates JWT on all `/api/*` routes. Created three endpoints: `/auth/register` (validates email format, hashes password with bcrypt cost 12, returns tokens), `/auth/login` (verifies credentials, issues access + refresh token pair), and `/auth/google` (handles OAuth callback, creates or links account). Refresh token rotation implemented — each refresh token is single-use and invalidated on exchange. Added integration tests for all three flows.

### Phase 4: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
- Implemented JWT authentication with RS256, refresh token rotation, and Google OAuth (PKCE)
- Added three auth endpoints and middleware for protected routes
- No deviations from the original plan
- Future work: add rate limiting on auth endpoints and support additional OAuth providers
```
