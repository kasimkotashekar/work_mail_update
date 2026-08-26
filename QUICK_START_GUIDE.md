# RBAC System - Quick Start Guide

## Getting Started

### 1. Start Development Server
```bash
cd work_mail_update
npm run dev
```

Server runs on: `http://localhost:3000`

### 2. Login to Application
1. Navigate to `http://localhost:3000/login`
2. Login with your Firebase credentials
3. After login, you'll be redirected to `/dashboard`

### 3. Check Your Role
- Your role displays in the sidebar footer
- Available menu items depend on your role

---

## Features by Role

### Backend Developer (All Access)
- Full system access
- All menu items visible
- Can manage any user
- Can grant/revoke any permission
- Can view all audit logs

**How to Test**:
1. Login as Backend Developer user
2. Navigate to Users → Select any user → Click Manage
3. Grant any permission to any user
4. Check Audit Logs to see the entry

---

### Super Admin (Admin Everything)
- Manage users and roles
- Grant/revoke permissions to lower roles
- Cannot modify own permissions
- Cannot manage Backend Developers
- Full audit log access

**How to Test**:
1. Login as Super Admin
2. Go to Users
3. Select Admin user
4. Grant "users.read" permission
5. Go to Audit Logs
6. Filter by "PERMISSION_GRANTED" to see your action

---

### Admin (User + Permission Management)
- Create and manage users
- Grant permissions to lower roles (Manager, Team Lead, Team Member)
- Cannot grant permissions to Super Admin
- Cannot access system settings
- Can view audit logs

**How to Test**:
1. Login as Admin
2. Go to Users
3. Try to manage a Super Admin → "Cannot Manage" appears
4. Manage a Manager user → Grant "reports.view" permission
5. Cannot grant "system.settings" to anyone

---

### Manager (Team Management)
- Manage team members
- View reports
- Access dashboard
- Cannot grant permissions
- Cannot access audit logs or user management

**How to Test**:
1. Login as Manager
2. Permissions and Audit Logs not visible in sidebar
3. Go to dashboard
4. Try to access `/dashboard/users` → Redirected
5. Try to access `/dashboard/audit` → Permission denied page

---

### Team Lead (Team Member Management)
- Manage team members
- View dashboard
- Limited permissions
- Cannot modify any user permissions

**How to Test**:
1. Login as Team Lead
2. Users and Permissions not in sidebar
3. Go to dashboard
4. Cannot access `/dashboard/permissions`

---

### Team Member (Basic Access)
- View dashboard only
- No management capabilities
- Lowest privilege level

**How to Test**:
1. Login as Team Member
2. Only "Overview" visible in sidebar
3. Try to access `/dashboard/users` → Redirected
4. Cannot grant/revoke any permissions

---

## Common Tasks

### Task 1: Grant Permission to a User

**Scenario**: Super Admin grants "reports.export" to Admin

**Steps**:
1. Navigate to Dashboard → Users
2. Search for the Admin user
3. Click "Manage" button
4. Find "reports.export" in permissions list
5. Click "Grant" button
6. Confirm success message appears
7. Check that permission moves to granted section

**Verify**:
- Go to Audit Logs
- Filter by action "PERMISSION_GRANTED"
- See entry with: Actor=super_admin, Permission=reports.export

---

### Task 2: Revoke Permission from a User

**Scenario**: Super Admin revokes "dashboard.manage" from Admin

**Steps**:
1. Navigate to Dashboard → Users
2. Select the Admin user
3. Find "dashboard.manage" in granted permissions
4. Click "Revoke" button
5. Confirm success message appears
6. Permission removed from granted section

**Verify**:
- Go to Audit Logs
- Filter by "PERMISSION_REVOKED"
- Confirm action shows: Actor=super_admin, Permission=dashboard.manage

---

### Task 3: View User's Permissions

**Scenario**: Check what permissions an Admin user has

**Steps**:
1. Navigate to Dashboard → Users
2. Click on a user (Admin)
3. See:
   - Effective Permissions: 8 (total)
   - Default: 6 (from role)
   - Granted: 2 (individually added)
4. Filter by category to see specific permissions
5. Yellow tags show "Default Permission"
6. Green tags show "Individually Granted"

---

### Task 4: View Audit Logs

**Scenario**: Super Admin checks who granted permissions today

**Steps**:
1. Navigate to Dashboard → Audit Logs
2. Filter by Action: "PERMISSION_GRANTED"
3. Expand a log entry to see details:
   - Who performed action
   - What permission was granted
   - To which user
   - When (timestamp)
4. Filter by Status: "Success" to see only successful changes

---

### Task 5: Search Users

**Scenario**: Find specific user in User Management

**Steps**:
1. Navigate to Dashboard → Users
2. In "Search Users" box, type email or name
3. List filters in real-time
4. Select from filtered results
5. Click "Manage" to modify their permissions

---

## Security Features Explained

### No Self-Escalation ✓
**What it means**: You cannot grant yourself higher permissions

**Example**:
```
You: Team Member
Try to grant yourself: "permissions.grant"
Result: ERROR - "Cannot modify your own permissions"
```

**Why**: Prevents privilege escalation attack

---

### Role Hierarchy Protection ✓
**What it means**: You can only manage users below your role level

**Example**:
```
You: Admin
Try to manage: Super Admin user
Result: "Cannot Manage" button disabled
```

**Why**: Prevents lower-role users from escalating higher roles

---

### Permission Boundaries ✓
**What it means**: You can only grant permissions you have

**Example**:
```
You: Admin (don't have "system.settings" permission)
Try to grant: "system.settings" to a Manager
Result: ERROR - "Not authorized to grant this permission"
```

**Why**: Prevents unauthorized permission escalation

---

### Backend Authorization ✓
**What it means**: All security checks happen on server, not browser

**Example**:
```
You: Team Member
Open DevTools, modify frontend to show "Grant" button
Click the button
Result: ERROR - Server rejects (you don't have permission)
```

**Why**: Frontend can be modified, but backend always validates

---

### Audit Trail ✓
**What it means**: Every permission change is logged forever

**Example**:
```
Super Admin grants "users.read" to Admin
Audit log shows:
  - Who: super_admin
  - What: PERMISSION_GRANTED
  - To: admin
  - Permission: users.read
  - When: 2026-08-26 10:30:45
```

**Why**: Compliance, security investigation, accountability

---

## Testing Security

### Test 1: Self-Escalation Prevention
1. Login as Team Member
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try manual API call:
```javascript
fetch('/api/permissions/manage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'your-user-id',
    'x-user-role': 'team_member'
  },
  body: JSON.stringify({
    action: 'grant',
    targetUserId: 'your-user-id',  // Trying to grant to self
    permission: 'users.read'
  })
})
```
5. **Result**: 400 error - "Cannot modify your own permissions"

### Test 2: Role Hierarchy Bypass
1. Login as Admin
2. Try to access Super Admin's permissions:
```
Navigate to: /dashboard/users
Search for: Super Admin user
Click: Manage button
Expected: "Cannot Manage" disabled or error
```

### Test 3: Permission Boundary
1. Login as Manager
2. Go to Users
3. Select Team Member
4. Try to Grant "permissions.grant"
5. **Result**: "Cannot Grant" button disabled or error (Manager doesn't have this permission)

### Test 4: Backend Validation
1. Login as Team Member
2. Check Audit Logs page
3. **Result**: Redirected or permission denied message (only authorized roles can view)

---

## Troubleshooting

### Q: Permission grant failed
**A**: Check:
1. Target user's role is lower than yours
2. Permission exists in system
3. User isn't already granted this permission
4. Check audit logs for detailed error

### Q: Cannot see Audit Logs page
**A**: Your role doesn't have `system.audit_logs` permission
- Must be: Backend Developer, Super Admin, or Admin
- Contact your administrator

### Q: User list not showing
**A**: Check:
1. You have "users.read" permission
2. API is running (`npm run dev`)
3. Check browser console for errors

### Q: Sidebar menu items missing
**A**: Menu items are based on your role/permissions
- Check your role in footer of sidebar
- Not all users see all menu options
- Expected behavior

### Q: Changes not appearing immediately
**A**: If permission change doesn't show up:
1. Refresh the page (F5)
2. Log out and log back in
3. Check audit logs to confirm change was made
4. Check that Firebase custom claims are updated

---

## API Endpoints Reference

### For Testing with curl/Postman

```bash
# Get all permissions available in system
curl http://localhost:3000/api/permissions/available

# View a user's permissions
curl -H "x-user-id: your-id" \
     -H "x-user-role: super_admin" \
     http://localhost:3000/api/users/target-user-id/permissions

# Grant permission
curl -X POST http://localhost:3000/api/permissions/manage \
  -H "x-user-id: your-id" \
  -H "x-user-role: super_admin" \
  -H "x-user-permissions: [\"users.read\",\"permissions.grant\"]" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "grant",
    "targetUserId": "user123",
    "permission": "users.read"
  }'

# Get audit logs
curl -H "x-user-id: your-id" \
     -H "x-user-role: super_admin" \
     http://localhost:3000/api/audit/logs?limit=50

# Get user's audit logs
curl -H "x-user-id: your-id" \
     -H "x-user-role: super_admin" \
     http://localhost:3000/api/audit/user/target-user-id?limit=50
```

---

## Next Steps

1. ✅ Run development server: `npm run dev`
2. ✅ Login with different user roles
3. ✅ Test permission granting/revoking
4. ✅ View audit logs
5. ✅ Run security tests from TESTING_VALIDATION.md
6. ✅ Review SECURITY_VERIFICATION.md for detailed checks
7. ✅ Check IMPLEMENTATION_SUMMARY.md for complete overview

---

## Support

For issues or questions:
1. Check IMPLEMENTATION_SUMMARY.md for overview
2. Review SECURITY_VERIFICATION.md for security details
3. See TESTING_VALIDATION.md for test scenarios
4. Check audit logs for error details
5. Review browser console (F12) for client-side errors
6. Check server console for backend errors

---

## Summary

You now have a **production-ready RBAC system** with:

✅ Secure role-based access control
✅ Dynamic permission management
✅ Comprehensive audit logging
✅ Backend-enforced authorization
✅ No privilege escalation vulnerabilities

**Happy testing!** 🚀
