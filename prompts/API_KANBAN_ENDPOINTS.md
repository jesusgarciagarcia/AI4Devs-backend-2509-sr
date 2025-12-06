# 📚 API Documentation - Kanban Endpoints

This document describes the two REST endpoints created for managing candidates in a kanban-style interface.

---

## 🔍 Endpoint 1: Get Candidates for a Position

### **GET** `/positions/:id/candidates`

Retrieves all candidates applying for a specific position, including their current interview stage and average score.

### **Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The position ID |

### **Response Format**

**Success Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "positionId": 1,
    "candidateCount": 3,
    "candidates": [
      {
        "candidateId": 1,
        "fullName": "Albert Saelices",
        "currentInterviewStep": 2,
        "currentInterviewStepName": "Technical Interview",
        "averageScore": 85.5,
        "applicationId": 10
      },
      {
        "candidateId": 2,
        "fullName": "Maria Garcia",
        "currentInterviewStep": 1,
        "currentInterviewStepName": "Initial Screening",
        "averageScore": null,
        "applicationId": 11
      }
    ]
  }
}
```

### **Field Descriptions**

- `candidateId`: Unique identifier of the candidate
- `fullName`: Concatenation of firstName + lastName from candidate table
- `currentInterviewStep`: ID of the current interview step from application table
- `currentInterviewStepName`: Human-readable name of the interview step
- `averageScore`: Average of all scores from the interview table. Returns `null` if no interviews have been conducted
- `applicationId`: The application ID (useful for stage updates)

### **Error Responses**

**400 Bad Request** - Invalid position ID format

```json
{
  "error": "Invalid position ID format",
  "message": "Position ID must be a valid number"
}
```

**404 Not Found** - Position doesn't exist

```json
{
  "error": "Position not found",
  "message": "No position found with ID 999"
}
```

**500 Internal Server Error**

```json
{
  "error": "Internal server error",
  "message": "Error description"
}
```

### **Examples**

#### Using cURL

```bash
curl -X GET http://localhost:3010/positions/1/candidates
```

#### Using PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:3010/positions/1/candidates" -Method Get
```

#### Using Thunder Client / Postman

```
GET http://localhost:3010/positions/1/candidates
```

### **Technical Details**

- Uses efficient JOINs via Prisma to avoid N+1 query problems
- Average score calculation is performed in the service layer
- Validates position existence before querying applications
- Returns empty array if position has no applicants

---

## ✏️ Endpoint 2: Update Candidate Stage

### **PUT** `/candidates/applications/:id/stage`

Updates the interview stage for a candidate's application when moved between columns in the kanban view.

### **Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The **application ID** (not candidate ID) |

> **⚠️ Design Decision**: This endpoint uses the `application ID` rather than `candidate ID` because:
>
> - A candidate can have multiple applications to different positions
> - Each application has its own independent interview flow
> - More precise control in a kanban context where each card represents an application

### **Request Body**

```json
{
  "new_stage": 3
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `new_stage` | number | Yes | The ID of the interview step to move to |

### **Response Format**

**Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Application stage updated successfully",
  "data": {
    "applicationId": 10,
    "candidate": {
      "id": 1,
      "fullName": "Albert Saelices",
      "email": "albert.saelices@gmail.com"
    },
    "position": {
      "id": 1,
      "title": "Senior Backend Developer"
    },
    "previousStage": 2,
    "currentStage": {
      "id": 3,
      "name": "Technical Interview",
      "orderIndex": 2
    },
    "updatedAt": "2025-12-06T10:30:00.000Z"
  }
}
```

### **Validations Performed**

1. **Application exists**: Verifies the application ID is valid
2. **Interview step exists**: Confirms the new stage ID exists
3. **Flow compatibility**: Ensures the new stage belongs to the correct interview flow for this position
4. **Data integrity**: Validates all IDs are numeric

### **Error Responses**

**400 Bad Request** - Invalid application ID

```json
{
  "error": "Invalid application ID format",
  "message": "Application ID must be a valid number"
}
```

**400 Bad Request** - Missing field

```json
{
  "error": "Missing required field",
  "message": "Field \"new_stage\" is required in request body"
}
```

**400 Bad Request** - Invalid stage for position

```json
{
  "error": "Invalid interview step",
  "message": "The specified interview step does not belong to this position's interview flow"
}
```

**404 Not Found** - Application doesn't exist

```json
{
  "error": "Application not found",
  "message": "No application found with ID 999"
}
```

**500 Internal Server Error**

```json
{
  "error": "Internal server error",
  "message": "Error description"
}
```

### **Examples**

#### Using cURL

```bash
curl -X PUT http://localhost:3010/candidates/applications/10/stage \
  -H "Content-Type: application/json" \
  -d '{"new_stage": 3}'
```

#### Using PowerShell

```powershell
$body = @{
    new_stage = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3010/candidates/applications/10/stage" `
  -Method Put `
  -Body $body `
  -ContentType "application/json"
```

#### Using Thunder Client / Postman

```
PUT http://localhost:3010/candidates/applications/10/stage
Content-Type: application/json

{
  "new_stage": 3
}
```

### **Technical Details**

- Updates the `currentInterviewStep` field in the `application` table
- Validates interview flow compatibility to prevent invalid transitions
- Returns complete application context for UI updates
- Atomic operation - either succeeds completely or fails with no changes

---

## 🏗️ Architecture Overview

Both endpoints follow the project's layered architecture:

```
routes/ (HTTP routing)
  ↓
presentation/controllers/ (Request/Response handling)
  ↓
application/services/ (Business logic)
  ↓
Prisma (Database access)
```

### File Structure

```
backend/src/
├── routes/
│   ├── candidateRoutes.ts (PUT endpoint)
│   └── positionRoutes.ts (GET endpoint)
├── presentation/controllers/
│   ├── candidateController.ts (updateCandidateStage)
│   └── positionController.ts (getCandidatesForPosition)
└── application/services/
    ├── candidateService.ts (updateApplicationStage)
    └── positionService.ts (getCandidatesByPosition)
```

---

## 🔄 Typical Kanban Workflow

1. **Load kanban board**: Call `GET /positions/:id/candidates` to get all candidates and their stages
2. **Display columns**: Group candidates by `currentInterviewStepName`
3. **Drag & drop**: When user moves a card, call `PUT /candidates/applications/:id/stage` with the new stage ID
4. **Update UI**: Use the response data to update the card's position and information

---

## 🧪 Testing Recommendations

### Unit Tests

- Test average score calculation with 0, 1, and multiple interviews
- Test stage validation logic
- Test error handling for invalid IDs

### Integration Tests

- Test full request/response cycle
- Test database transactions and rollbacks
- Test concurrent stage updates

### Example Test Data Setup

```sql
-- Create a position with interview flow
-- Create candidates
-- Create applications
-- Create interviews with scores
-- Test both endpoints
```

---

## 🚀 Performance Considerations

### GET /positions/:id/candidates

- Uses Prisma's `include` for efficient JOINs
- Single query retrieves all necessary data
- Average calculation done in application layer (could be moved to DB for large datasets)

### PUT /candidates/applications/:id/stage

- Validates in sequence: application → interview step → flow compatibility
- Could be optimized with a single complex query if needed
- Prisma transaction could be added for stricter consistency

---

## 📝 Future Enhancements

### Possible Improvements

1. **Pagination** for GET endpoint when dealing with many candidates
2. **Filtering** by interview stage or score range
3. **Sorting** options (by score, application date, name)
4. **Batch updates** for moving multiple candidates at once
5. **Webhooks/notifications** when stages change
6. **Audit logging** for stage transitions
7. **Stage transition rules** (e.g., prevent skipping stages)

### Alternative Interpretations

If `:id` in the PUT endpoint should be candidate ID instead:

- Would need an additional `position_id` in the request body
- Would need to identify which application to update
- Current approach (using application ID) is more explicit and precise

---

## ❓ FAQ

**Q: Why use application ID instead of candidate ID for the PUT endpoint?**
A: A candidate can apply to multiple positions. Using application ID provides precise control over which specific application/position combination to update.

**Q: What happens if I provide an invalid interview step ID?**
A: The system validates that the step exists and belongs to the correct interview flow. Invalid steps return a 400 error.

**Q: Can average_score be 0 or only null?**
A: It can be any number (including 0) if interviews exist. It's `null` only when no interviews have been conducted yet.

**Q: Are stage transitions validated (e.g., can't skip stages)?**
A: Currently, any valid stage in the flow can be set. Business rules for sequential progression could be added if needed.

---

**Last Updated**: December 6, 2025
**Version**: 1.0.0
**Backend Port**: 3010
