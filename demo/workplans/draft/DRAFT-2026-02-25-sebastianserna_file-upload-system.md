---
plan: "File upload system"
state: "draft"
author: "sebastianserna"
author_model: "grok-3"
assignee: ""
assignee_model: ""
issue: ""
backlog: ""
coding: ""
done: ""
tags: "feature, storage"
---

# File upload system

## Objective

Allow users to upload files (images, documents, etc.) associated with projects and tasks. Need to decide on storage strategy before moving to backlog.

## Open Questions

- Should we use local filesystem storage or S3-compatible object storage?
- What are the file size limits? 10MB? 50MB?
- Do we need image processing (thumbnails, resizing)?

## Context

Currently the app has no file handling. Users have requested the ability to attach screenshots to tasks and upload project assets. The backend is Express with PostgreSQL.

## Options

### Option A: Local filesystem
Simple to implement. Files stored in `/uploads` directory. Served by Express static middleware. No external dependencies.

### Option B: S3-compatible storage
More scalable. Works with AWS S3 or MinIO for self-hosted. Presigned URLs for direct upload from the browser.

## Comments

### 2026-02-25 — sebastianserna
Initial draft. Leaning towards S3 for scalability but need to evaluate cost.

### 2026-02-26 — claude-opus-4
Recommend Option B with MinIO for development and S3 for production. This gives you the same API locally without cloud costs during dev.
