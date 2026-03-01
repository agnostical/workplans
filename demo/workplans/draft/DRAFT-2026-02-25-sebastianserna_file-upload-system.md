---
plan: "File upload system"
state: "draft"
author: "sebastianserna"
author_model: "grok-3"
assignee: ""
assignee_model: ""
issue: ""
draft: "2026-02-25T11:00"
backlog: ""
doing: ""
done: ""
tags: "feature, storage"
---

# File upload system

## Progress

### Phase 1: Storage setup
- [ ] Set up S3-compatible storage (MinIO for dev, S3 for prod)
- [ ] Implement file upload API endpoint with presigned URLs
- [ ] Add file metadata table in PostgreSQL
- [ ] Define file size limits and allowed MIME types

### Phase 2: Integration
- [ ] Attach files to tasks and projects
- [ ] Generate image thumbnails on upload
- [ ] Build file browser UI component

## Objective

Allow users to upload files (images, documents) associated with projects and tasks. Users have requested the ability to attach screenshots to tasks and upload project assets.

## Context

Currently the app has no file handling. The backend is Express with PostgreSQL. S3-compatible storage (MinIO for dev, AWS S3 for prod) is the preferred approach for scalability with the same API in both environments.

## Implementation

### Phase 1: Storage setup

Use the AWS SDK with S3-compatible configuration pointing to MinIO locally and S3 in production. Browser uploads via presigned URLs to avoid proxying large files through the API. File metadata (name, size, MIME type, S3 key) stored in a `files` table.

### Phase 2: Integration

Files linked to tasks/projects via a `file_attachments` junction table. Image thumbnails generated with Sharp on upload. A reusable file browser component handles upload, preview, and deletion.

## Comments

### 2026-02-25 — sebastianserna
Initial draft. Leaning towards S3 for scalability but need to evaluate cost.

### 2026-02-26 — claude-opus-4
Recommend MinIO for development and S3 for production. Same API locally without cloud costs during dev.
