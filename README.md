# Teacher Session Booking API

A REST API where teachers publish available sessions, users book them, and completed sessions appear in the user's history.

**Stack:** Node.js · TypeScript · Express.js · MongoDB · Mongoose (with Zod for request validation)

---

## Features

- Clean, layered architecture: **routes → controllers → services → models**
- Request validation with Zod (body, params, query), plus consistent `400` error details
- **Centralized error handling** for app errors, Mongoose validation/cast errors, duplicate keys, malformed JSON and unknown routes
- `async/await` throughout, with an `asyncHandler` wrapper so every rejection reaches the error handler
- Configuration through environment variables (`.env`)
- **Both required read APIs use the MongoDB Aggregation Pipeline**
- **Race-safe booking and completion:** status changes use atomic conditional updates (`findOneAndUpdate` filtered on the current status), so two simultaneous requests can't book the same session
- Indexes on `sessions` for the available-sessions and user-sessions queries

---

## Project Structure

```
src/
├── app.ts                    # Express app (middleware, routes, error handling)
├── server.ts                 # Entry point: DB connection, HTTP server, graceful shutdown
├── config/
│   ├── env.ts                # Loads and validates environment variables
│   └── db.ts                 # MongoDB connection
├── models/                   # Mongoose schemas: User, Teacher, Session
├── validators/               # Zod schemas for each endpoint
├── middlewares/
│   ├── validate.ts           # Generic request validation middleware
│   ├── errorHandler.ts       # Centralized error handler
│   └── notFound.ts           # 404 for unknown routes
├── routes/                   # Route definitions
├── controllers/              # HTTP layer (req/res only)
├── services/                 # Business logic and database queries
└── utils/                    # ApiError, asyncHandler, date helpers
postman/
└── Teacher-Session-Booking.postman_collection.json
```

---

## Setup

### Prerequisites

- Node.js **18+**
- MongoDB **5.0+** (local install, Docker, or MongoDB Atlas)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable      | Description                     | Example                                        |
| ------------- | ------------------------------- | ---------------------------------------------- |
| `NODE_ENV`    | `development` / `production`    | `development`                                  |
| `PORT`        | HTTP port                       | `3000`                                         |
| `MONGODB_URI` | MongoDB connection string       | `mongodb://127.0.0.1:27017/teacher_sessions`   |

To start MongoDB quickly with Docker:

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

### 3. Run

```bash
# Development (auto-reload)
npm run dev

# Production
npm run build
npm start
```

The server starts on `http://localhost:3000`. Check it with `GET /health`.

---

## API Reference

All responses follow this shape:

```json
{ "success": true, "message": "...", "data": { } }
```

```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "must be a valid email" }] }
```

| #   | Method  | Endpoint                                     | Description                                    |
| --- | ------- | -------------------------------------------- | ---------------------------------------------- |
| 1   | `POST`  | `/users`                                     | Create a user (email must be unique)           |
| –   | `POST`  | `/teachers`                                  | Create a teacher (helper for creating sessions)|
| 2   | `POST`  | `/sessions`                                  | Create a session for a teacher                 |
| 3   | `GET`   | `/sessions/available?dateTimestamp={ts}`     | AVAILABLE sessions on a given date (aggregation) |
| 4   | `POST`  | `/sessions/:id/book`                         | Book a session                                 |
| 5   | `PATCH` | `/sessions/:id/complete`                     | Mark a booked session as completed             |
| 6   | `GET`   | `/users/:id/sessions`                        | User's upcoming and completed sessions (aggregation) |

### 1. Create User: `POST /users`

```json
{ "fullName": "Asha Rao", "email": "asha@example.com", "phone": "+919876543210" }
```

- `201` Created
- `400` Validation error
- `409` Email already exists (checked first, and also enforced by a unique index)

### Create Teacher: `POST /teachers`

```json
{ "fullName": "Dr. Vikram Mehta", "email": "vikram.mehta@example.com", "specialization": "Mathematics", "experience": 8 }
```

The assignment doesn't list this endpoint, but sessions need an existing teacher, so it's included to make the flow testable.

### 2. Create Session: `POST /sessions`

```json
{ "teacherId": "<teacherId>", "startTime": "2030-01-15T10:00:00.000Z", "endTime": "2030-01-15T11:00:00.000Z" }
```

`startTime` and `endTime` accept an ISO-8601 string or a Unix timestamp in milliseconds. `status` defaults to `AVAILABLE`.

- `201` Created
- `400` Validation error, including `endTime` not after `startTime`
- `404` Teacher not found

### 3. Available Sessions: `GET /sessions/available?dateTimestamp=1894665600000`

Returns all `AVAILABLE` sessions whose `startTime` falls on the **UTC calendar day** of `dateTimestamp`. The timestamp can be in milliseconds or seconds.

**Aggregation pipeline:** `$match` (status + day range) → `$sort` → `$lookup` (teacher) → `$unwind` → `$project` (adds `durationMinutes`)

- `200` OK, with `count` and `data[]`
- `400` Missing or invalid timestamp

### 4. Book Session: `POST /sessions/:id/book`

```json
{ "userId": "<userId>" }
```

- `200` Booked: status becomes `BOOKED` and `userId` is set
- `400` Invalid IDs
- `404` User not found / Session not found
- `409` Session already booked, or not `AVAILABLE`

### 5. Complete Session: `PATCH /sessions/:id/complete`

- `200` Status becomes `COMPLETED` and `completedAt` is set
- `404` Session not found
- `409` Session is not `BOOKED`

### 6. User Sessions: `GET /users/:id/sessions`

```json
{
  "success": true,
  "data": {
    "upcomingSessions": [ { "...": "BOOKED sessions, sorted by startTime asc, with teacher details" } ],
    "completedSessions": [ { "...": "COMPLETED sessions, sorted by completedAt desc, with teacher details" } ]
  }
}
```

**Aggregation pipeline:** `$match` (userId) → `$lookup` (teacher) → `$unwind` → `$project` → `$facet` { upcoming, completed }

- `200` OK
- `400` Invalid ID
- `404` User not found

### Session lifecycle

```
AVAILABLE ──book──▶ BOOKED ──complete──▶ COMPLETED
```

Any other transition returns `409 Conflict`.

---

## HTTP Status Codes

| Code  | Meaning                                                      |
| ----- | ------------------------------------------------------------ |
| `200` | Success                                                      |
| `201` | Resource created                                             |
| `400` | Validation error, invalid ObjectId, or malformed JSON        |
| `404` | Resource or route not found                                  |
| `409` | Duplicate email, or an invalid status transition             |
| `500` | Unexpected server error (stack trace shown only outside production) |

---

## Testing with Postman

1. Import `postman/Teacher-Session-Booking.postman_collection.json` into Postman.
2. Set the collection variable `baseUrl` if you aren't using `http://localhost:3000`.
3. Run the requests in order, or use **Run collection** to run them all.

The collection saves `userId`, `teacherId` and `sessionId` automatically and includes test assertions for success and error cases. Each run uses a fresh email, so you can run it repeatedly.

From the command line with Newman:

```bash
npx newman run postman/Teacher-Session-Booking.postman_collection.json
```

---

## Design Notes

- **Upcoming vs. completed:** "Upcoming" means sessions with status `BOOKED`, and "completed" means status `COMPLETED`. This follows the status lifecycle defined in the assignment.
- **Timezone:** `dateTimestamp` is read as a UTC calendar day, so results don't depend on the server's timezone.
- **Concurrency:** booking runs `findOneAndUpdate({ _id, status: 'AVAILABLE' }, ...)`. Only one of several simultaneous requests can match, and the others get `409`. If the update matches nothing, a follow-up read decides between `404` and `409`.
