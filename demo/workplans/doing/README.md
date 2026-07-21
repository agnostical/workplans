# Doing

Plans in progress, currently being implemented.

A plan moves here when someone is actively working on it. This folder represents ongoing effort — the plan has been scoped, assigned, and implementation is underway.

When the work is complete, the AI agent moves the plan to the `done/` folder. If the plan needs to be paused or deprioritized, it can be moved back to `backlog/`.

[View all states](../README.md)

## Example plan in doing

The same plan now in progress. Phase 1 is complete, the executor is set, and Phase 2 has been partially completed.

```markdown
---
format: "0.5.0"
id: 2606455842
title: "User authentication setup"
planner: "Alice"
planner_model: "claude-opus-4-6"
executor: "Bob"
executor_model: "claude-sonnet-4-6"
state: "doing"
backlog_date: "2026-03-05T09:30"
doing_date: "2026-03-06T14:00"
done_date: ""
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
- [ ] Document security requirements

### Phase 3: Implement auth flow
- [ ] Set up authentication middleware
- [ ] Add login and registration endpoints

### Phase 4: Closing
- [ ] Write Closing Summary
- [ ] Validate implementation with the user

## Context
The project currently has no authentication. The team agreed on JWT-based auth to keep the backend stateless. Must support email/password registration.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Define auth strategy
Decided on JWT with RS256 signing over HS256 for better key rotation support. Token policy: access tokens expire in 15 minutes, refresh tokens in 7 days with single-use rotation. Security requirements to document: password hashing algorithm and cost factor, token storage on the client, and rate limiting on auth endpoints.

### Phase 3: Implement auth flow
Create middleware that validates JWT on protected routes. Implement endpoints for registration and login. Use a standard hashing library for passwords. Implement refresh token rotation.

### Phase 4: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
_To be written when the last phase is completed._
```
