# Backend API Documentation

## Architecture Overview

This backend follows a clean architecture pattern with separation of concerns:

- **config/**: Database configuration
- **controllers/**: HTTP request/response handling (no business logic)
- **services/**: Business logic layer (the brain)
- **middleware/**: Request filters (auth, roles, errors)
- **routes/**: API endpoint definitions

## Request Flow

```
Frontend Request
    ↓
Route (routes/*.js)
    ↓
Middleware (authMiddleware, roleMiddleware)
    ↓
Controller (controllers/*.js)
    ↓
Service (services/*.js) - Business Logic
    ↓
Database (config/db.js)
    ↓
Response sent back
```

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "EMPLOYEE",
    "teamId": 1
  }
}
```

---

### Leave Management

#### POST `/api/leaves/apply`
Apply for leave. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "reason": "Personal leave"
}
```

**Response:**
```json
{
  "status": "AUTO_APPROVED",
  "leaveId": 123,
  "message": "Leave request submitted successfully"
}
```

**Possible Status Values:**
- `AUTO_APPROVED`: Automatically approved by system
- `AUTO_REJECTED`: Automatically rejected (with reason)
- `PENDING_MANAGER_REVIEW`: Requires manager approval

---

#### POST `/api/leaves/preview`
Preview impact of leave before applying. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startDate": "2024-01-15",
  "endDate": "2024-01-17"
}
```

**Response:**
```json
{
  "impactScore": "0.25",
  "leaveDays": 3,
  "teamAbsence": "15.50",
  "message": "Impact preview calculated"
}
```

---

#### GET `/api/leaves/my`
Get user's leave history. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "leaves": [
    {
      "id": 1,
      "start_date": "2024-01-15",
      "end_date": "2024-01-17",
      "reason": "Personal leave",
      "status": "AUTO_APPROVED",
      "created_at": "2024-01-10T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### PATCH `/api/leaves/:id/status`
Manager approve/reject leave. Requires MANAGER or ADMIN role.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "managerNote": "Approved - low impact period"
}
```

**Response:**
```json
{
  "message": "Leave approved successfully",
  "leaveId": 123,
  "status": "APPROVED"
}
```

---

### Team Management

#### GET `/api/team/my-team`
Get authenticated user's team information. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "team": {
    "id": 1,
    "name": "Development Team",
    "description": "Software development team"
  },
  "memberCount": 5,
  "myUserId": 1
}
```

---

#### GET `/api/team/members`
Get all members of user's team. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "members": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "EMPLOYEE",
      "team_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 5,
  "teamId": 1
}
```

---

#### GET `/api/team/info`
Get team basic info with statistics. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "team": {
    "id": 1,
    "name": "Development Team",
    "description": "Software development team",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "statistics": {
    "totalMembers": 5,
    "activeLeaves": 2
  }
}
```

---

### Project Management

#### GET `/api/projects/my-projects`
Get all projects user is enrolled in. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "projects": [
    {
      "id": 1,
      "name": "Project Alpha",
      "description": "Main project",
      "deadline": "2024-02-01",
      "status": "IN_PROGRESS",
      "created_at": "2024-01-01T00:00:00.000Z",
      "myTasks": {
        "total": 5,
        "pending": 3,
        "pendingHours": 24
      }
    }
  ],
  "count": 2
}
```

---

#### GET `/api/projects/deadlines`
Get upcoming project deadlines. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "deadlines": [
    {
      "projectId": 1,
      "projectName": "Project Alpha",
      "deadline": "2024-02-01",
      "taskCount": 5,
      "pendingHours": 24
    }
  ],
  "count": 2
}
```

---

#### GET `/api/projects/:id`
Get project details by ID. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "project": {
    "id": 1,
    "name": "Project Alpha",
    "description": "Main project",
    "deadline": "2024-02-01",
    "status": "IN_PROGRESS",
    "created_at": "2024-01-01T00:00:00.000Z",
    "myTasks": [
      {
        "id": 1,
        "title": "Task 1",
        "description": "Description",
        "status": "IN_PROGRESS",
        "estimated_hours": 8,
        "due_date": "2024-01-20"
      }
    ]
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description"
}
```

**Status Codes:**
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Environment Variables

Create a `.env` file in `backend/server/`:

```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=leave_management

# JWT
JWT_SECRET=your_secret_key_here

# Environment
NODE_ENV=development
```

---

## Business Rules (Rule Engine)

The leave evaluation system follows these rules:

1. **Past Date Check**: Rejects leaves with start date in the past
2. **Duration Limit**: Rejects leaves exceeding 15 days
3. **Team Availability**: Rejects if >50% of team is already on leave
4. **Auto-Approval**: Approves if:
   - Leave ≤ 2 days
   - Team absence ≤ 30%
   - Impact score < 0.3
5. **Auto-Rejection**: Rejects if impact score > 0.6
6. **Default**: All other cases go to `PENDING_MANAGER_REVIEW`

---

## User Roles

- `EMPLOYEE`: Can apply for leaves, view own data
- `MANAGER`: Can approve/reject leaves, view team data
- `ADMIN`: Full access
