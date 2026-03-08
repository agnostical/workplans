---
id: 2604739600
title: "Full-text search functionality"
state: "backlog"
author: "sebastianserna"
author_model: ""
assignee: ""
assignee_model: ""
issue: ""
draft_date: "2026-02-16T11:00"
backlog_date: "2026-02-20T15:45"
doing_date: ""
done_date: ""
---

# Full-text search functionality

## Progress §

### Phase 1: MVP
- [ ] Add PostgreSQL full-text search indexes
- [ ] Create search API endpoint
- [ ] Build search results UI component

## Objective §

Allow users to search across all content in the application using full-text search powered by PostgreSQL's built-in tsvector capabilities.

## Implementation §

### Phase 1: MVP

Add GIN indexes on the relevant text columns. Create a `/api/search?q=term` endpoint that uses `ts_query` and ranks results by relevance. The frontend will have a search bar with debounced input and a results dropdown.

## Closing Summary §

_To be written when the last phase is completed._
