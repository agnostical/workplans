# Rules: draft/

> Idea bank: plan drafts, technical decisions, exploratory notes.

## Naming

```
DRAFT-YYYY-MM-DD-author_description.md
```

## Rules

- Frontmatter: `state: "draft"` (see `workplans/README.md` for full format)
- Same frontmatter structure as all other states
- Drafts do **not** follow the BACKLOG → CODING → DONE workflow
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
backlog: ""
coding: ""
done: ""
tags: "architecture"
---

# API rate limiting strategy

## Context

The API currently has no rate limiting. After deploying authentication, we observed automated login attempts. We need a strategy before opening the API to external consumers.

## Options considered

### Option A: Express middleware (express-rate-limit)
- Pros: simple setup, no external dependencies
- Cons: per-instance only, not suitable for multi-instance deployments

### Option B: Redis-based (rate-limiter-flexible)
- Pros: shared across instances, supports sliding window
- Cons: requires Redis infrastructure

## Decision

Leaning towards Option B since we already use Redis for sessions. To be promoted to `backlog/` once limits per endpoint are defined.
```
