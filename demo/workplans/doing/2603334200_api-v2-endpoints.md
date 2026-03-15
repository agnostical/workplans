---
id: 2603334200
title: "API v2 endpoints"
state: "doing"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-opus-4"
backlog_date: "2026-02-05T11:00"
doing_date: "2026-02-18T09:00"
done_date: ""
format_version: "0.2.1"
---

# API v2 endpoints

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps
- [x] Refine with the user

### Phase 2: Core endpoints
- [x] Design new REST resource structure
- [x] Implement pagination with cursor-based navigation
- [x] Add filtering and sorting parameters
- [ ] Write OpenAPI spec documentation

### Phase 3: Closing
- [ ] Write Closing Summary
- [ ] Validate implementation with the user

## Objective
Create v2 of the API with improved pagination, filtering, and consistent error responses. The v1 endpoints will be maintained in parallel during the migration period.

## Context
The v1 API uses offset-based pagination which performs poorly on large datasets. Error responses are inconsistent across endpoints. External consumers have requested filtering and sorting capabilities.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Core endpoints

All v2 endpoints live under `/api/v2/`. Pagination uses cursor-based navigation instead of offset. Filtering uses query parameters with operators (`?status=eq:active`). Error responses follow RFC 7807 Problem Details format.

### Phase 3: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
_To be written when the last phase is completed._
