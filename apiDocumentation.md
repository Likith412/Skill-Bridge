# SkillBridge API Documentation

A RESTful API built with **Express.js** and **MongoDB** for managing users (students, clients, and admins), projects, applications, and reviews.

## Authentication

All endpoints (except **register** and **login**) require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## User Routes

<details>
<summary><strong>Register User</strong></summary>

**POST** `/api/users/register`

Registers a new user with role-specific profile data.

**Headers**

- `Content-Type: multipart/form-data`

**Body**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass",
  "role": "student" | "client",
  "studentProfile": {
    "bio": "Student bio...",
    "skills": ["JavaScript", "MongoDB"]
  },
  "clientProfile": {
    "organizationName": "TechCorp",
    "bio": "We build software..."
  },
  "userImage": (file upload)
}
```

**Responses**

- `201 Created`: User registered successfully
- `400 Bad Request`: Missing or invalid data

</details>

<details>
<summary><strong>Login User</strong></summary>

**POST** `/api/users/login`

Authenticate a user and receive a JWT token.

**Body**

```json
{
  "email": "john@example.com",
  "password": "securepass"
}
```

**Responses**

- `200 OK`: Returns token and user info
- `400 Bad Request`: Invalid credentials

</details>

<details>
<summary><strong>Get User Profile</strong></summary>

**GET** `/api/users/:id/profile`

Returns profile details of a student or client.

**Auth**

- Required

**Responses**

- `200 OK`: Returns user profile and related data (reviews/projects)
- `404 Not Found`: User not found

</details>

<details>
<summary><strong>Update User Profile</strong></summary>

**PUT** `/api/users/:id/profile`

Updates profile details based on the user's role.

**Auth**

- Only the user themselves can update

**Headers**

- `Content-Type: multipart/form-data`

**Body**

```json
{
  "studentProfile": {
    "bio": "Updated bio...",
    "skills": ["React", "Node"]
  },
  "clientProfile": {
    "organizationName": "NewOrg",
    "bio": "Updated client bio"
  },
  "userImage": (file upload)
}
```

**Responses**

- `200 OK`: Profile updated
- `403 Forbidden`: Not authorized

</details>

<details>
<summary><strong>Delete User</strong></summary>

**DELETE** `/api/users/:id`

Deletes a user along with their associated data.

**Auth**

- Only the user themselves or an admin

**Responses**

- `200 OK`: User deleted successfully
- `403 Forbidden`: Unauthorized

</details>

<details>
<summary><strong>Toggle Block/Unblock User</strong></summary>

**PUT** `/api/users/:id/toggle-block`

Block or unblock a user.

**Auth**

- Admin only

**Body**

```json
{
  "action": "block" | "unblock"
}
```

**Responses**

- `200 OK`: User blocked/unblocked
- `400 Bad Request`: Invalid action
- `403 Forbidden`: Unauthorized

</details>

## Project Routes

<details>
<summary><strong>Create Project</strong></summary>

**POST** `/api/projects`

Create a new project.

**Auth**

- Required (client only)

**Body**

```json
{
  "title": "Web Development",
  "description": "Build a responsive website",
  "budget": 1500,
  "deadline": "2025-07-30T00:00:00Z",
  "requiredSkills": ["HTML", "CSS", "JavaScript"],
  "status": "open"
}
```

**Responses**

- `201 Created`: Project created successfully
- `400 Bad Request`: Invalid or missing fields

</details>

<details>
<summary><strong>Get All Projects</strong></summary>

**GET** `/api/projects`

Returns a list of projects.

**Auth**

- Required

**Query Params (Optional)**

- `status`: `"open" | "in-progress" | "completed"`
- `skills`: `"JavaScript,Node"`
- `minBudget`: `100`
- `maxBudget`: `5000`
- `beforeDeadline`: `"2025-08-01"`
- `afterDeadline`: `"2025-07-01"`

**Responses**

- `200 OK`: Returns filtered list of projects

</details>

<details>
<summary><strong>Get Specific Project</strong></summary>

**GET** `/api/projects/:id`

Returns project details.

**Auth**

- Required

**Responses**

- `200 OK`: Returns project data
- `403 Forbidden`: Not authorized
- `404 Not Found`: Project not found

</details>

<details>
<summary><strong>Update Specific Project</strong></summary>

**PUT** `/api/projects/:id`

Update an existing project.

**Auth**

- Required (client only)

**Body**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "budget": 2000,
  "deadline": "2025-08-10T00:00:00Z",
  "requiredSkills": ["React", "Node.js"],
  "status": "in-progress"
}
```

**Responses**

- `200 OK`: Project updated successfully
- `400 Bad Request`: Invalid or missing fields

</details>

<details>
<summary><strong>Delete Specific Project</strong></summary>

**DELETE** `/api/projects/:id`

Delete a project.

**Auth**

- Required (client only)

**Responses**

- `200 OK`: Project deleted successfully
- `403 Forbidden`: Not authorized

</details>

## Application Routes

<details>
<summary><strong>Create Application</strong></summary>

**POST** `/api/applications`

Apply to a project with resume upload.

**Auth**

- Required (student only)

**Headers**

- `Content-Type: multipart/form-data`

**Body**

```json
{
  "projectId": "<projectObjectId>",
  "resume": (PDF file upload, max 5MB)
}
```

**Responses**

- `201 Created`: Application submitted
- `400 Bad Request`: Already applied or invalid
- `404 Not Found`: Project not found

</details>

<details>
<summary><strong>Delete Application</strong></summary>

**DELETE** `/api/applications/:id`

Delete a submitted application.

**Auth**

- Required (student only)

**Responses**

- `200 OK`: Application deleted
- `403 Forbidden`: Not authorized

</details>

<details>
<summary><strong>Update Application Status</strong></summary>

**PATCH** `/api/applications/:id/status`

Change application status.

**Auth**

- Required (client only)

**Body**

```json
{
  "status": "approved" | "pending" | "rejected"
}
```

**Responses**

- `200 OK`: Status updated
- `403 Forbidden`: Not authorized
- `404 Not Found`: Application not found

</details>

<details>
<summary><strong>Get Applications by Student</strong></summary>

**GET** `/api/applications/student`

Get all applications submitted by the logged-in student.

**Auth**

- Required (student & admin)

**Responses**

- `200 OK`: Applications fetched

</details>

<details>
<summary><strong>Get All Applications for a Project</strong></summary>

**GET** `/api/applications`

Fetch all applications for projects owned by the client.

**Auth**

- Required (client or admin)

**Body**

```json
{
  "projectId": "<projectId>"
}
```

**Responses**

- `200 OK`: Applications fetched successfully
- `400 Bad Request`: Invalid input
- `403 Forbidden`: Not authorized
- `404 Not Found`: project not found

</details>

<details>
<summary><strong>Get Specific Application</strong></summary>

**GET** `/api/applications/:id`

Returns a specific application.

**Auth**

- Required (client & admin)

**Responses**

- `200 OK`: Application fetched
- `403 Forbidden`: Not authorized
- `404 Not Found`: Application not found

</details>

## Review Routes

<details>
<summary><strong>Create Review</strong></summary>

**POST** `/api/reviews`

Allows a client to review a student after project completion.

**Auth**

- Required (client only)

**Body**

```json
{
  "projectId": "<projectId>",
  "revieweeId": "<studentUserId>",
  "rating": 4,
  "comment": "Excellent work!"
}
```

**Responses**

- `201 Created`: Review created
- `400 Bad Request`: Invalid input or duplicate
- `403 Forbidden`: Not authorized
- `404 Not Found`: Project or student not found

</details>

<details>
<summary><strong>Get Specific Review</strong></summary>

**GET** `/api/reviews/:id`

Returns a specific review.

**Auth**

- Not required

**Responses**

- `200 OK`: Review fetched
- `404 Not Found`: Review not found

</details>

<details>
<summary><strong>Update Specific Review</strong></summary>

**PUT** `/api/reviews/:id`

Update a review.

**Auth**

- Required (client only)

**Body**

```json
{
  "rating": 5,
  "comment": "Updated comment"
}
```

**Responses**

- `200 OK`: Review updated
- `400 Bad Request`: Missing fields or invalid rating
- `403 Forbidden`: Not authorized

</details>

<details>
<summary><strong>Delete Specific Review</strong></summary>

**DELETE** `/api/reviews/:id`

Delete a review.

**Auth**

- Required (client only)

**Responses**

- `200 OK`: Review deleted
- `403 Forbidden`: Not authorized

</details>
