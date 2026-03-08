---
id: 2601632400
title: "Logging and monitoring setup"
state: "done"
author: "sebastianserna"
author_model: "claude-opus-4"
assignee: "alexgarcia"
assignee_model: "claude-sonnet-4"
backlog_date: "2026-01-20T11:00"
doing_date: "2026-02-01T10:00"
done_date: "2026-02-15T15:10"
---

# Logging and monitoring setup

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps

### Phase 2: Structured logging
- [x] Install and configure Winston logger
- [x] Add request ID tracking with correlation
- [x] Set up log levels per environment
- [x] Create log rotation policy

### Phase 3: Monitoring
- [x] Health check endpoint with dependency status
- [x] Prometheus metrics endpoint
- [x] Grafana dashboard for API performance
- [x] Alert rules for error rate and latency

## Objective
Implement structured logging and monitoring to gain visibility into application health and debug production issues effectively.

## Context
The application currently uses `console.log` with no structure or correlation. Production debugging requires SSH access to read raw logs. The infrastructure already includes Redis and PostgreSQL, and the team has access to a Grafana instance.

## Implementation
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective, Context, and the definition of subsequent phases._

### Phase 2: Structured logging

Using Winston with JSON format for production and pretty-print for development. Each request gets a unique `requestId` via middleware that's propagated through all log calls. Logs are written to stdout for container compatibility.

### Phase 3: Monitoring

Health check at `/health` reports database, Redis, and external service status. Prometheus metrics at `/metrics` expose request duration histograms, active connections, and error counters. Grafana dashboards visualize the data with alert thresholds.

## Closing Summary
- Winston logging with request ID correlation deployed across all services
- Health check correctly reports degraded state when dependencies are slow
- Grafana dashboards show p50, p95, p99 latency with alert thresholds
- Alerts fire when error rate exceeds 5% over 5 minutes
