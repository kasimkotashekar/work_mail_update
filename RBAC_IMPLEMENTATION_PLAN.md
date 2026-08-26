# Complete RBAC & Permission Management Implementation Plan

## Current Status ✅

Your system already has:
- ✅ Role hierarchy (6 levels: Backend Dev → Super Admin → Admin → Manager → Team Lead → Team Member)
- ✅ ROLE_HIERARCHY constant with role levels and canManage relationships
- ✅ UserProfile interface with permissions array
- ✅ Authorization utility functions (canManageRole, canAssignPermission, etc.)
- ✅ Firebase database schema for audit logs
- ✅ Custom claims setup in Firebase

## What Needs to be Added/Enhanced

### 1. **Individual Permission Granting System** (Separate from Default Permissions)
   - Currently: Roles have fixed DEFAULT permissions
   - Needed: Allow higher-level roles to grant/revoke individual permissions to lower-level roles
   - Implementation: PermissionGrant table in database

### 2. **Permission Boundary Enforcement**
   - Users can only grant permissions they themselves have
   - Users cannot grant permissions above their role level
   - Example: Admin cannot grant Super Admin permissions to Manager

### 3. **Granular Permission Management UI**
   - View all permissions available for a role
   - Grant specific permissions to lower-level users
   - Revoke permissions from lower-level users
   - Show permission scope and restrictions

### 4. **Backend API Endpoints for Permission Management**
   - GET /api/permissions - List all available permissions
   - POST /api/permissions/grant - Grant permission to user
   - POST /api/permissions/revoke - Revoke permission from user
   - GET /api/users/{id}/permissions - List user's individual permissions
   - All with full authorization checks

### 5. **Audit Logging for All Permission Changes**
   - Track every permission grant/revoke
   - Track who granted/revoked
   - Track timestamp
   - Track reason/scope

### 6. **Frontend Components**
   - User Management Dashboard
   - Permission Management Interface
   - Audit Log Viewer
   - Role-Based Navigation (show only authorized menu items)

### 7. **Bootstrap for Super Admin Creation**
   - Already partially done, needs refinement
   - Should be one-time only
   - Should not allow recreation

### 8. **Frontend Authorization Checks**
   - Hide unauthorized buttons/menu items
   - Disable unauthorized actions
   - Show appropriate error messages

---

## Implementation Steps

### PHASE 1: Database & Backend Foundation

#### Step 1.1: Enhance Firebase Database Schema
Create a `permission_grants` collection to track individual permission grants:
```
/permission_grants/{grantId}
  - userId: string (who has the permission)
  - permission: string (which permission)
  - grantedBy: string (who granted it)
  - grantedAt: timestamp
  - scope: {optional scopes/restrictions}
  - isActive: boolean
```

#### Step 1.2: Update Authorization Module
Add new validation functions:
- `canGrantPermissionToUser()` - Validate if user can grant permission to another user
- `canRevokePermissionFromUser()` - Validate if user can revoke permission
- `getEffectivePermissions()` - Get user's default + granted permissions
- `getAvailablePermissionsToGrant()` - What permissions can current user grant

#### Step 1.3: Create Backend API Endpoints
- `/api/permissions` - GET list, POST grant
- `/api/users/{id}/permissions` - GET user permissions
- `/api/users/{id}/permissions/grant` - POST grant individual permission
- `/api/users/{id}/permissions/revoke` - POST revoke individual permission
- All endpoints with full authorization checks

#### Step 1.4: Implement Audit Logging
Enhance audit logging to track:
- PERMISSION_GRANTED
- PERMISSION_REVOKED
- PERMISSION_MODIFIED
- ROLE_CHANGED
- USER_DISABLED
- etc.

---

### PHASE 2: Frontend Authorization & UI

#### Step 2.1: Update Dashboard Navigation
- Load user's effective permissions (default + granted)
- Show/hide menu items based on permissions
- Show/hide action buttons based on permissions
- Example: Team Member shouldn't see "Manage Users" menu

#### Step 2.2: Create Permission Management Component
```
/components/PermissionManager.tsx
- Display current user's permissions
- Display available permissions to grant (based on role level)
- UI to grant/revoke permissions to lower-level users
- Confirmation dialogs for permission changes
```

#### Step 2.3: Create User Management with Permissions
```
/components/UserManagementPanel.tsx
- List users current user can manage
- Filter by role
- Show permissions for each user
- Quick actions to modify permissions
```

#### Step 2.4: Update User Profile / Detail View
- Show assigned permissions
- Show permission source (default vs. granted)
- Show who granted each permission
- Show when permissions were granted

#### Step 2.5: Create Audit Log Viewer
```
/components/AuditLogViewer.tsx
- Filter by action, user, date range
- Show detailed audit trail
- Real-time updates for admin users
```

---

### PHASE 3: Security & Validation

#### Step 3.1: Backend Enforcement
Every permission-related API endpoint must:
1. Verify user authentication
2. Verify user's current role
3. Verify user's effective permissions
4. Verify target user's role
5. Verify target user's current permissions
6. Verify no self-escalation
7. Verify no permission boundary violations
8. Log the action (success or failure)

#### Step 3.2: No Frontend-Only Security
- Backend must enforce ALL rules
- Frontend checks are UX only
- Manual API requests must still be rejected by backend
- Example: Even if user changes frontend code to show "Grant Admin" button,
  backend must reject the request

#### Step 3.3: Permission Boundaries
Implement strict rules:
- Admin cannot grant Super Admin permissions
- Manager cannot grant Admin/Super Admin permissions
- Team Lead cannot grant Manager+ permissions
- Team Member cannot grant any permissions
- No one can self-escalate

---

### PHASE 4: Testing & Validation

#### Test Cases:
1. Super Admin grants Admin to User A
2. Admin A grants Manager to User B
3. Manager B attempts to grant Admin to User C (should fail)
4. Team Lead grants Team Member to User D
5. Team Member attempts to grant any permission (should fail)
6. User attempts to self-grant higher permissions (should fail)
7. User attempts to revoke own permissions (should fail - only higher roles can)
8. User manually changes frontend to call API directly (backend must reject)
9. Audit log captures all permission changes
10. Permissions correctly applied on next login

---

## Key Files to Create/Modify

### New Files:
- `lib/rbac-utils.ts` - RBAC helper functions
- `lib/permission-validator.ts` - Permission validation logic
- `components/PermissionManager.tsx` - Permission UI
- `components/UserManagementPanel.tsx` - User management UI
- `components/AuditLogViewer.tsx` - Audit log UI
- `app/api/permissions/route.ts` - Permissions endpoints
- `app/api/permissions/grant/route.ts` - Grant permission endpoint
- `app/api/permissions/revoke/route.ts` - Revoke permission endpoint
- `app/api/users/{id}/permissions/route.ts` - User permissions endpoint

### Modify:
- `lib/authorization.ts` - Add new validation functions
- `lib/firebase-admin.ts` - Add permission grant/revoke functions
- `components/Sidebar.tsx` - Dynamic menu based on permissions
- `app/dashboard/page.tsx` - Load and display permissions
- `middleware.ts` - Ensure permission enforcement

---

## Permission Hierarchy Matrix

```
BACKEND DEVELOPER (Level 6)
├─ Can manage: Everyone
├─ Can grant: All permissions to anyone
├─ Cannot: None (full access)

SUPER ADMIN (Level 5)
├─ Can manage: Admin, Manager, Team Lead, Team Member
├─ Can grant: All permissions to level 1-4
├─ Cannot: Manage Backend Developer or themselves

ADMIN (Level 4)
├─ Can manage: Manager, Team Lead, Team Member
├─ Can grant: Permissions up to Manager level
├─ Cannot: Manage Super Admin, grant Super Admin permissions

MANAGER (Level 3)
├─ Can manage: Team Lead, Team Member
├─ Can grant: Permissions up to Team Lead level
├─ Cannot: Manage Admin+, grant Admin+ permissions

TEAM LEAD (Level 2)
├─ Can manage: Team Member
├─ Can grant: Basic permissions to Team Member
├─ Cannot: Manage Manager+, grant Manager+ permissions

TEAM MEMBER (Level 1)
├─ Can manage: Nobody
├─ Can grant: No permissions
├─ Cannot: Manage anyone, grant any permissions
```

---

## Security Rules (Backend Enforced)

1. **No Self-Escalation**: A user CANNOT increase their own role or permissions
2. **Role Boundary**: Cannot grant permissions meant for higher roles
3. **Permission Boundary**: Can only grant permissions they themselves have
4. **Authorization Check**: Every API call must verify authorization
5. **Audit Trail**: Every permission change must be logged
6. **Token Validation**: Custom claims in Firebase token must match backend database
7. **Scope Verification**: Can only manage lower-level users in hierarchy
8. **Immutable Hierarchy**: Role hierarchy cannot be changed by anyone except Backend Developer

---

## Expected User Flows

### Flow 1: Super Admin Grants Permission to Admin
```
Super Admin
→ Opens User Management
→ Finds Admin user
→ Opens Permission Manager
→ Selects "reports.generate" permission
→ Clicks "Grant Permission"
→ Audit log created
→ Admin's permission updated
→ Admin can now use reports.generate on next login
```

### Flow 2: Manager Tries to Grant Higher Permission (Should Fail)
```
Manager
→ Opens User Management
→ Finds Team Lead
→ Tries to grant "admin.create_user" (Admin permission)
→ Frontend shows: "Cannot grant this permission (requires Admin role)"
→ If manually calls API anyway:
→ Backend rejects with 403 Forbidden
→ Audit log records failed attempt
```

### Flow 3: Permission Revocation
```
Manager
→ Finds Team Member with old permission
→ Clicks "Revoke Permission"
→ Permission removed from Team Member
→ Takes effect on next login or token refresh
→ Audit log shows revocation
```

---

## Implementation Priority

1. **HIGH**: Backend validation functions and API endpoints
2. **HIGH**: Audit logging system
3. **MEDIUM**: User Management UI with permission grants
4. **MEDIUM**: Permission Manager component
5. **LOW**: Audit Log Viewer (essential for compliance but not for functionality)
6. **LOW**: Advanced permission scoping

---

## Validation Checklist

- [ ] Role hierarchy is immutable and correctly defined
- [ ] No self-escalation is possible (tested at backend)
- [ ] Permission boundaries are enforced (backend + frontend)
- [ ] All permission changes are audited
- [ ] Frontend hides unauthorized options
- [ ] Backend rejects unauthorized requests
- [ ] Users cannot modify their own role
- [ ] Users cannot modify their own permissions
- [ ] Higher-level users can revoke permissions from lower levels
- [ ] Permission inheritance works correctly (default + granted)
- [ ] Bootstrap works one-time only
- [ ] Custom claims in Firebase token match backend
- [ ] All API endpoints validate authorization
- [ ] Audit logs are readable and searchable
- [ ] Permission boundaries prevent escalation attempts
- [ ] System handles permission revocation correctly
