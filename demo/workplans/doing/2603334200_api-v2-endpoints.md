---
id: 2603334200
title: "API v2 endpoints"
state: "doing"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-opus-4"
issue: ""
draft_date: "2026-02-02T09:30"
backlog_date: "2026-02-05T11:00"
doing_date: "2026-02-18T09:00"
done_date: ""
---

# API v2 endpoints

## Progress §

### Phase 1: Core endpoints
- [x] Design new REST resource structure
- [x] Implement pagination with cursor-based navigation
- [x] Add filtering and sorting parameters
- [ ] Write OpenAPI spec documentation

## Objective §

Create v2 of the API with improved pagination, filtering, and consistent error responses. The v1 endpoints will be maintained in parallel during the migration period.

## Implementation §

### Phase 1: Core endpoints

All v2 endpoints live under `/api/v2/`. Pagination uses cursor-based navigation instead of offset. Filtering uses query parameters with operators (`?status=eq:active`). Error responses follow RFC 7807 Problem Details format.

## Closing Summary §

_To be written when the last phase is completed._
