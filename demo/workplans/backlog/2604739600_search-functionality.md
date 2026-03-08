---
id: 2604739600
title: "Full-text search functionality"
state: "backlog"
author: "sebastianserna"
author_model: ""
assignee: ""
assignee_model: ""
backlog_date: "2026-02-20T15:45"
doing_date: ""
done_date: ""
---

# Full-text search functionality

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: MVP
- [ ] Add PostgreSQL full-text search indexes
- [ ] Create search API endpoint
- [ ] Build search results UI component

## Objective
Allow users to search across all content in the application using full-text search powered by PostgreSQL's built-in tsvector capabilities.

## Context
The application stores content in PostgreSQL. PostgreSQL has built-in full-text search with tsvector and GIN indexes, which avoids introducing an external search engine like Elasticsearch at this stage.

## Implementation
### Phase 1: Definition
This phase tracks the definition of Objective, Context, and subsequent phases.

### Phase 2: MVP

Add GIN indexes on the relevant text columns. Create a `/api/search?q=term` endpoint that uses `ts_query` and ranks results by relevance. The frontend will have a search bar with debounced input and a results dropdown.

## Closing Summary
To be written when the last phase is completed.
