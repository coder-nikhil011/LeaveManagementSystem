# Backend Architecture - Separation of Concerns

## 🎯 Clean Architecture Pattern

This backend follows a strict separation of concerns with three main layers:

```
┌─────────────────────────────────────────┐
│         CONTROLLERS Layer               │
│  (HTTP Request/Response Handling)       │
│  - Read req.body, req.params           │
│  - Call services                       │
│  - Send HTTP responses                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         SERVICES Layer                   │
│  (Business Logic + Database Operations) │
│  - ruleEngine.js → Decision logic       │
│  - workloadService.js → Impact calc     │
│  - leaveService.js → DB operations      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         DATABASE Layer                   │
│  (config/db.js)                         │
│  - MySQL connection pool                 │
└─────────────────────────────────────────┘
```

---

## 📁 Service Layer Responsibilities

### `services/leaveService.js`
**Purpose:** Handles ALL leave-related database operations

**Responsibilities:**
- ✅ Check overlapping leave requests
- ✅ Insert leave into database
- ✅ Fetch leave history
- ✅ Update leave status (manager actions)
- ✅ Count team members
- ✅ Count team members on leave

**Does NOT:**
- ❌ Send HTTP responses
- ❌ Use req/res objects
- ❌ Generate JWT tokens
- ❌ Calculate impact scores
- ❌ Make business decisions

**Functions:**
```javascript
checkOverlap(userId, startDate, endDate)
createLeave(userId, teamId, startDate, endDate, reason, status)
getLeavesByUser(userId)
updateLeaveStatus(leaveId, status, managerId, managerNote)
getLeaveById(leaveId)
getTeamMemberCount(teamId)
getTeamLeaveCount(teamId, startDate, endDate)
```

---

### `services/ruleEngine.js`
**Purpose:** Business logic - Decides approve/reject/pending

**Responsibilities:**
- ✅ Evaluate leave requests
- ✅ Apply business rules (8 rules)
- ✅ Return decision status

**Uses:**
- `leaveService` for database queries
- `workloadService` for impact calculation

**Does NOT:**
- ❌ Direct database queries (uses leaveService)
- ❌ Send HTTP responses
- ❌ Access req/res objects

**Business Rules:**
1. Reject past dates
2. Reject > 15 days
3. Check team availability (via leaveService)
4. Reject if >50% team on leave
5. Calculate impact (via workloadService)
6. Auto-approve if conditions met
7. Auto-reject if high impact
8. Default to pending review

---

### `services/workloadService.js`
**Purpose:** Calculate impact score on workload

**Responsibilities:**
- ✅ Calculate impact score
- ✅ Check tasks in leave window
- ✅ Return numeric impact value

**Does NOT:**
- ❌ Send HTTP responses
- ❌ Access req/res objects
- ❌ Make business decisions

---

## 🔄 Request Flow Example: Apply Leave

```
1. POST /api/leaves/apply
   ↓
2. leaveController.applyLeave()
   ├─ Read req.body (startDate, endDate, reason)
   ├─ Read req.user (from authMiddleware)
   ↓
3. leaveService.checkOverlap()
   └─ Query database for overlapping leaves
   ↓
4. ruleEngine.evaluateLeave()
   ├─ leaveService.getTeamMemberCount()
   ├─ leaveService.getTeamLeaveCount()
   ├─ workloadService.calculateImpact()
   └─ Return decision (AUTO_APPROVED/REJECTED/PENDING)
   ↓
5. leaveService.createLeave()
   └─ Insert leave into database
   ↓
6. leaveController sends HTTP response
   └─ res.status(201).json({ leaveId, status, ... })
```

---

## ✅ Benefits of This Architecture

1. **Separation of Concerns**
   - Controllers handle HTTP only
   - Services handle business logic and DB operations
   - Easy to test each layer independently

2. **Reusability**
   - `leaveService` functions can be used by multiple controllers
   - `ruleEngine` can be used for preview, apply, etc.

3. **Maintainability**
   - Database schema changes only affect `leaveService`
   - Business rule changes only affect `ruleEngine`
   - HTTP changes only affect controllers

4. **Testability**
   - Mock `leaveService` when testing controllers
   - Mock database when testing services
   - Test business logic without HTTP layer

---

## 📋 File Responsibilities Summary

| File | Layer | Responsibility |
|------|-------|----------------|
| `controllers/leaveController.js` | Controller | HTTP request/response |
| `services/leaveService.js` | Service | Database operations |
| `services/ruleEngine.js` | Service | Business logic decisions |
| `services/workloadService.js` | Service | Impact calculations |
| `middleware/authMiddleware.js` | Middleware | JWT verification |
| `middleware/roleMiddleware.js` | Middleware | Role-based access |
| `config/db.js` | Config | Database connection |

---

## 🚫 Anti-Patterns Avoided

❌ **Controllers directly querying database**
```javascript
// BAD
exports.applyLeave = async (req, res) => {
  const [result] = await pool.query("INSERT INTO leaves...");
  // ...
}
```

✅ **Controllers using services**
```javascript
// GOOD
exports.applyLeave = async (req, res) => {
  const leaveId = await leaveService.createLeave(...);
  // ...
}
```

---

## 🔍 Code Verification

All database queries for `leaves` table are now ONLY in:
- ✅ `services/leaveService.js`

No direct `pool.query` calls for leaves in:
- ✅ Controllers
- ✅ Other services (they use leaveService)

This ensures proper separation and maintainability! 🎉
