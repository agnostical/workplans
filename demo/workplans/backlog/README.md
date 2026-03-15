# Backlog

Plans pending, waiting for definition or execution.

This is the starting point for all plans. A plan enters the backlog when it has been identified as something worth doing but has not yet started. It may still need further research, scoping, or prioritization before moving forward.

When a plan is ready to be worked on, the AI agent moves it to the `doing/` folder and updates its metadata.

[View all states](../README.md)

## Example plan in backlog

A newly created plan. The agent has defined the objective, context, and phases — only user validation remains before execution.

```markdown
---
id: 2606455842
title: "User authentication setup"
state: "backlog"
author: "Sebastian Serna"
author_model: "claude-opus-4-6"
assignee: ""
assignee_model: ""
backlog_date: "2026-03-05T09:30"
doing_date: ""
done_date: ""
format_version: "0.2.1"
---

# User authentication setup

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps
- [ ] Refine with the user

### Phase 2: Define auth strategy
- [ ] Choose authentication method
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
Evaluate JWT vs session-based auth. The backend should remain stateless, so JWT is the likely choice. Need to decide on signing algorithm (RS256 vs HS256), token expiration policy, and refresh token strategy. For OAuth, Google is the first provider — evaluate Authorization Code flow with PKCE.

Document security requirements: password hashing algorithm and cost factor, token storage on the client (httpOnly cookies vs localStorage), and rate limiting on auth endpoints.

### Phase 3: Implement auth flow
Create Express middleware that validates JWT on protected routes. Implement three endpoints: `/auth/register` (email + password), `/auth/login` (returns access + refresh tokens), and `/auth/google` (OAuth callback). Use bcrypt for password hashing. Implement refresh token rotation to prevent token reuse attacks.

### Phase 4: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
_To be written when the last phase is completed._
```
