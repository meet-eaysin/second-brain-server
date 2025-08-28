# Workspace API Documentation

## Overview

The workspace system provides hierarchical organization for databases, enabling users to organize their data into logical workspaces. Each user automatically gets a default personal workspace, and can create additional workspaces for different projects or teams.

## Key Features

- **Automatic Default Workspace**: Every user gets a personal workspace created automatically
- **Workspace-Scoped Databases**: All databases belong to a workspace
- **Member Management**: Add/remove members with different roles
- **Permission System**: Fine-grained access control
- **Backward Compatibility**: System works without explicit workspace specification

## API Endpoints

### Workspace Management

#### Create Workspace
```http
POST /workspaces
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My Project Workspace",
  "description": "Workspace for project management",
  "type": "team",
  "icon": {
    "type": "emoji",
    "value": "🚀"
  },
  "cover": {
    "type": "gradient",
    "value": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  },
  "isPublic": false
}
```

#### Get User's Workspaces
```http
GET /workspaces
Authorization: Bearer <token>
```

#### Get Workspace by ID
```http
GET /workspaces/{workspaceId}
Authorization: Bearer <token>
```

#### Update Workspace
```http
PUT /workspaces/{workspaceId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```

#### Delete Workspace
```http
DELETE /workspaces/{workspaceId}
Authorization: Bearer <token>
```

### Member Management

#### Add Member to Workspace
```http
POST /workspaces/{workspaceId}/members
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "user123",
  "role": "editor"
}
```

#### Get Workspace Members
```http
GET /workspaces/{workspaceId}/members
Authorization: Bearer <token>
```

#### Update Member Role
```http
PUT /workspaces/{workspaceId}/members/{userId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "role": "admin"
}
```

#### Remove Member
```http
DELETE /workspaces/{workspaceId}/members/{userId}
Authorization: Bearer <token>
```

### Workspace Statistics

#### Get Workspace Stats
```http
GET /workspaces/{workspaceId}/stats
Authorization: Bearer <token>
```

#### Check Workspace Access
```http
GET /workspaces/{workspaceId}/access
Authorization: Bearer <token>
```

### Database Operations with Workspace Context

#### Create Database in Workspace
```http
POST /databases
Content-Type: application/json
Authorization: Bearer <token>

{
  "workspaceId": "workspace123",
  "name": "My Tasks",
  "type": "tasks",
  "description": "Task management database"
}
```

#### Get Databases in Workspace
```http
GET /databases?workspaceId=workspace123
Authorization: Bearer <token>
```

### Dashboard with Workspace Context

#### Get Dashboard for Workspace
```http
GET /dashboard?workspaceId=workspace123
Authorization: Bearer <token>
```

#### Get Dashboard Stats for Workspace
```http
GET /dashboard/stats?workspaceId=workspace123
Authorization: Bearer <token>
```

## Workspace Types

- **personal**: Individual user workspace (default)
- **team**: Small team collaboration
- **organization**: Large organization workspace
- **public**: Publicly accessible workspace

## Member Roles

- **owner**: Full control over workspace
- **admin**: Can manage workspace and members
- **editor**: Can create and edit content
- **commenter**: Can comment on content
- **viewer**: Read-only access

## Automatic Workspace Creation

When a user registers, the system automatically:

1. Creates a default personal workspace named "{FirstName} Workspace"
2. Adds the user as the owner
3. Sets up default configuration
4. Enables the user to start creating databases immediately

## Backward Compatibility

The system maintains backward compatibility:

- If no `workspaceId` is specified in requests, the user's primary workspace is used
- Existing databases without workspace assignment work seamlessly
- Dashboard and other services automatically resolve workspace context

## Error Responses

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied to workspace",
  "error": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Workspace not found",
  "error": "NOT_FOUND"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "User is already a member of this workspace",
  "error": "CONFLICT"
}
```

## Best Practices

1. **Always specify workspaceId** when creating databases for better organization
2. **Use descriptive workspace names** to help users identify their workspaces
3. **Set appropriate member roles** based on user responsibilities
4. **Regular cleanup** of unused workspaces to maintain organization
5. **Monitor workspace statistics** to understand usage patterns

## Integration Examples

### Frontend Integration
```javascript
// Get user's workspaces
const workspaces = await api.get('/workspaces');

// Create database in specific workspace
const database = await api.post('/databases', {
  workspaceId: selectedWorkspace.id,
  name: 'Project Tasks',
  type: 'tasks'
});

// Get dashboard for workspace
const dashboard = await api.get(`/dashboard?workspaceId=${workspaceId}`);
```

### Middleware Usage
The system includes middleware that automatically resolves workspace context:

- `resolveWorkspaceContext()`: Resolves workspace from request
- `requireWorkspace()`: Requires workspace access
- `ensureDefaultWorkspace`: Creates default workspace if needed
- `injectWorkspaceContext`: Injects workspace ID into request body
