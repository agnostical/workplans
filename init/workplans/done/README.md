# Done

Plans completed and closed.

A plan moves here when its implementation is finished and verified. This folder serves as a historical record of all completed work, useful for reference and retrospectives.

Done plans should generally not be modified. If a completed plan needs rework, create a new plan in `backlog/` instead of reopening the old one.

[View all states](../README.md)

## Example plan in done

The same plan fully completed. All steps are checked, done_date is set, and the Closing Summary is written: a leader paragraph (exported verbatim to changelogs and tracker comments) followed by labeled subsections.

```markdown
---
format: "0.5.0"
id: 2606455842
title: "User authentication setup"
planner: "Alice"
planner_model: "claude-opus-4-6"
executor: "Bob"
executor_model: "claude-sonnet-4-6"
state: "done"
backlog_date: "2026-03-05T09:30"
doing_date: "2026-03-06T14:00"
done_date: "2026-03-07T18:45"
priority: "high"
estimate: "5"
tracked_in: ""
relations:
---

# User authentication setup

## Brief
Users currently share one admin account, and the team asked for individual sign-in so access can be granted and revoked per person. Registration, login, and session handling should work with the existing web app.

## Objective
Set up user authentication for the web application using JWT tokens, covering registration, login, and session management. In scope: email/password registration, login endpoints, and session middleware; OAuth providers stay out of scope.

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

## Context
The project currently has no authentication. The team agreed on JWT-based auth to keep the backend stateless. Must support email/password registration.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Define auth strategy
Decided on JWT with RS256 signing over HS256 for better key rotation support. Token policy: access tokens expire in 15 minutes, refresh tokens in 7 days with single-use rotation. Security requirements documented: bcrypt with cost factor 12 for password hashing, tokens stored in httpOnly secure cookies, rate limiting deferred to a future plan.

### Phase 3: Implement auth flow
Added middleware that validates JWT on all protected routes. Created the registration endpoint (validates email format, hashes password with bcrypt cost 12, returns tokens) and the login endpoint (verifies credentials, issues access + refresh token pair). Refresh token rotation implemented — each refresh token is single-use and invalidated on exchange. Added integration tests for both flows.

### Phase 4: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
The web application now authenticates users with JWT sessions and email/password registration. Access is renewed through single-use refresh tokens, and every protected API route validates the session through shared middleware. Passwords are hashed with bcrypt and tokens are stored in httpOnly secure cookies.

### Delivered
- Authentication middleware protecting all API routes
- Registration and login endpoints with integration tests

### Decisions
- RS256 signing over HS256, for key rotation support
- Tokens in httpOnly cookies instead of localStorage

### Deferred
- Rate limiting on auth endpoints, registered in plan 2606980112

### References
- [PR #87](https://github.com/acme/backend/pull/87)
```
