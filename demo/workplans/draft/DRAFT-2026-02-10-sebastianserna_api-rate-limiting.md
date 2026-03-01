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
tags: "architecture, api"
---

# API rate limiting strategy

## Context

The API currently has no rate limiting. After deploying authentication, we observed automated login attempts from multiple IPs. We need a strategy before opening the API to external consumers.

## Options considered

### Option A: Express middleware (express-rate-limit)
- Pros: simple setup, no external dependencies
- Cons: per-instance only, not suitable for multi-instance deployments

### Option B: Redis-based (rate-limiter-flexible)
- Pros: shared across instances, supports sliding window
- Cons: requires Redis infrastructure

## Decision

Leaning towards Option B since we already use Redis for sessions. To be promoted to backlog once limits per endpoint are defined.
