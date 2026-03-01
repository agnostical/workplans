---
plan: "API v2 endpoints"
state: "coding"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-opus-4"
issue: ""
backlog: "2026-02-05"
coding: "2026-02-18"
done: ""
tags: "api, enhancement"
---

# API v2 endpoints

## Progress

### Phase 1: Core endpoints
- [x] Design new REST resource structure
- [x] Implement pagination with cursor-based navigation
- [x] Add filtering and sorting parameters
- [ ] Write OpenAPI spec documentation

## Objective

Create v2 of the API with improved pagination, filtering, and consistent error responses. The v1 endpoints will be maintained in parallel during the migration period.

## Implementation

### Phase 1: Core endpoints

All v2 endpoints live under `/api/v2/`. Pagination uses cursor-based navigation instead of offset. Filtering uses query parameters with operators (`?status=eq:active`). Error responses follow RFC 7807 Problem Details format.

## Comments

### 2026-02-18 — sebastianserna
Resource structure and cursor pagination implemented. Working on filter parser next.

### 2026-02-25 — claude-opus-4
Filter parser done with support for `eq`, `gt`, `lt`, `in` operators. Sorting also implemented with multi-field support. Only OpenAPI docs remaining.
