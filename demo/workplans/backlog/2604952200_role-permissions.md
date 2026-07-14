---
format: "0.4.0"
id: 2604952200
title: "Role-based permissions"
priority: "medium"
estimate: 5
author: "sebastianserna"
author_model: "gemini-2.5-pro"
assignee: "alexgarcia"
assignee_model: "gpt-4o"
state: "backlog"
backlog_date: "2026-02-22T09:25"
doing_date: ""
done_date: ""
tracked_in: ""
relations:
  relates_to: "2601551600"
---

# Role-based permissions

## Objective
Implement role-based access control (RBAC) to restrict actions based on user roles. Currently all authenticated users have the same permissions, which is a security concern.

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps
- [x] Refine with the user

### Phase 2: Core RBAC
- [ ] Define roles table and seed default roles (admin, editor, viewer)
- [ ] Create permissions table with resource-action pairs
- [ ] Build authorization middleware
- [ ] Add role assignment API endpoints

### Phase 3: UI integration
- [ ] Role management page in admin panel
- [ ] Permission checks in frontend components
- [ ] Invite users with specific roles

### Phase 4: Closing
- [ ] Write Closing Summary
- [ ] Validate implementation with the user

## Context
Authentication is already implemented with JWT. The database is PostgreSQL. The frontend uses React with a custom hook pattern for feature flags. No authorization layer exists yet.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Core RBAC

Create `roles` and `permissions` tables. Each role has many permissions. Permissions are defined as `resource:action` pairs (e.g., `project:delete`, `task:create`). The middleware checks `req.user.role.permissions` against the required permission for each endpoint.

### Phase 3: UI integration

Admin users can manage roles from a settings page. Frontend components conditionally render based on the current user's permissions using a `usePermission('resource:action')` hook.

### Phase 4: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
_To be written when the last phase is completed._
