---
plan: "Role-based permissions"
state: "backlog"
author: "sebastianserna"
author_model: "gemini-2.5-pro"
assignee: "alexgarcia"
assignee_model: "gpt-4o"
issue: "https://github.com/user/repo/issues/88"
draft: ""
backlog: "2026-02-22T09:25"
doing: ""
done: ""
tags: "auth, security"
---

# Role-based permissions

## Progress

### Phase 1: Core RBAC
- [ ] Define roles table and seed default roles (admin, editor, viewer)
- [ ] Create permissions table with resource-action pairs
- [ ] Build authorization middleware
- [ ] Add role assignment API endpoints

### Phase 2: UI integration
- [ ] Role management page in admin panel
- [ ] Permission checks in frontend components
- [ ] Invite users with specific roles

## Objective

Implement role-based access control (RBAC) to restrict actions based on user roles. Currently all authenticated users have the same permissions, which is a security concern.

## Implementation

### Phase 1: Core RBAC

Create `roles` and `permissions` tables. Each role has many permissions. Permissions are defined as `resource:action` pairs (e.g., `project:delete`, `task:create`). The middleware checks `req.user.role.permissions` against the required permission for each endpoint.

### Phase 2: UI integration

Admin users can manage roles from a settings page. Frontend components conditionally render based on the current user's permissions using a `usePermission('resource:action')` hook.

## Comments

### 2026-02-22 — sebastianserna
Moved to backlog. Auth setup needs to be done first (dependency on user-auth-setup plan).
