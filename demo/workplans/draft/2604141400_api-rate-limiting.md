---
id: 2604141400
title: "API rate limiting strategy"
state: "draft"
author: "sebastianserna"
author_model: ""
assignee: ""
assignee_model: ""
issue: ""
draft_date: "2026-02-10T11:30"
backlog_date: ""
doing_date: ""
done_date: ""
---

# API rate limiting strategy

## Progress §

### Phase 1: Rate limiting setup
- [ ] Choose rate limiting library and strategy
- [ ] Define rate limits per endpoint category
- [ ] Implement rate limiting middleware
- [ ] Add rate limit headers to API responses

## Objective §

Add rate limiting to the API to prevent abuse and prepare for external consumers. After deploying authentication, we observed automated login attempts from multiple IPs.

## Context §

The API currently has no rate limiting. We already use Redis for sessions, so a Redis-based solution (`rate-limiter-flexible`) fits the existing infrastructure. Need to define limits per endpoint before promoting to backlog.

## Implementation §

### Phase 1: Rate limiting setup

Use `rate-limiter-flexible` with Redis backend for shared state across instances. Sliding window algorithm for smoother rate distribution. Different tiers: auth endpoints (stricter), read endpoints (relaxed), write endpoints (moderate). Include `X-RateLimit-*` headers in responses.

## Closing Summary §

_To be written when the last phase is completed._
