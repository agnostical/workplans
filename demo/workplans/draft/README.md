# Rules: draft/

> Early-stage plans — same structure as all other states, lighter on detail.

## Naming

```
DRAFT-YYYY-MM-DD-author_description.md
```

## Rules

- Frontmatter: `state: "draft"` (see `workplans/README.md` for full format)
- Same frontmatter and body structure as all other states (Progress, Objective, Implementation, etc.)
- Drafts do **not** follow the BACKLOG → DOING → DONE workflow
- When mature, promote to `backlog/` — only update `state` and `backlog` date

## Example

```markdown
---
plan: "API rate limiting strategy"
state: "draft"
author: "sebastianserna"
author_model: ""
assignee: ""
assignee_model: ""
issue: ""
draft: "2026-02-10T09:15"
backlog: ""
doing: ""
done: ""
tags: "architecture"
---

# API rate limiting strategy

## Progress

### Phase 1: Rate limiting setup
- [ ] Choose rate limiting library and strategy
- [ ] Define rate limits per endpoint category
- [ ] Implement rate limiting middleware
- [ ] Add rate limit headers to API responses

## Objective

Add rate limiting to the API to prevent abuse and prepare for external consumers. After deploying authentication, we observed automated login attempts from multiple IPs.

## Context

The API currently has no rate limiting. We already use Redis for sessions, so a Redis-based solution fits the existing infrastructure. Need to define limits per endpoint before promoting to backlog.

## Implementation

### Phase 1: Rate limiting setup

Use `rate-limiter-flexible` with Redis backend for shared state across instances. Sliding window algorithm for smoother rate distribution. Different tiers: auth endpoints (stricter), read endpoints (relaxed), write endpoints (moderate). Include `X-RateLimit-*` headers in responses.
```
