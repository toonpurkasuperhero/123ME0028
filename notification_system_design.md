# Notification System Design

---

## Stage 1

### Overview

The campus notification platform supports three notification types: **Placement**, **Event**, and **Result**. The REST API is designed around the core actions a student needs: fetch notifications, mark them read, and manage preferences. A separate admin endpoint handles broadcasting.

For the purposes of this design, all users are assumed to be pre-authorised (no login/registration flows).

---

### Core REST API Endpoints

---

#### 1. Get All Notifications for a Student

```
GET /api/v1/notifications
```

**Headers**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Query Parameters**
| Param | Type | Required | Description |
|---|---|---|---|
| `type` | string | No | Filter by `Placement`, `Event`, `Result` |
| `isRead` | boolean | No | Filter by read status |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 20, max: 100) |

**Response `200 OK`**
```json
{
  "success": true,
  "page": 1,
  "limit": 20,
  "total": 84,
  "notifications": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Placement",
      "message": "Google is hiring – apply by Dec 20",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ]
}
```

---

#### 2. Get a Single Notification

```
GET /api/v1/notifications/:id
```

**Headers**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response `200 OK`**
```json
{
  "success": true,
  "notification": {
    "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
    "type": "Placement",
    "message": "Google is hiring – apply by Dec 20",
    "isRead": true,
    "createdAt": "2026-04-22T17:51:30Z"
  }
}
```

**Response `404 Not Found`**
```json
{
  "success": false,
  "error": "Notification not found"
}
```

---

#### 3. Mark a Notification as Read

```
PATCH /api/v1/notifications/:id/read
```

**Headers**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response `200 OK`**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

#### 4. Mark All Notifications as Read

```
PATCH /api/v1/notifications/read-all
```

**Headers**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response `200 OK`**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 42
}
```

---

#### 5. Delete a Notification

```
DELETE /api/v1/notifications/:id
```

**Headers**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response `200 OK`**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

#### 6. Get Unread Notification Count

```
GET /api/v1/notifications/unread-count
```

**Headers**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response `200 OK`**
```json
{
  "success": true,
  "unreadCount": 7
}
```

---

#### 7. Broadcast Notification (Admin)

```
POST /api/v1/admin/notifications/broadcast
```

**Headers**
```json
{
  "Authorization": "Bearer <admin-token>",
  "Content-Type": "application/json"
}
```

**Request Body**
```json
{
  "type": "Placement",
  "message": "Microsoft is hiring for SDE-1 roles. Apply before Dec 25.",
  "targetStudentIDs": []
}
```

> If `targetStudentIDs` is an empty array, the notification is broadcast to all students.

**Response `202 Accepted`**
```json
{
  "success": true,
  "message": "Broadcast queued for delivery",
  "jobID": "job_8f3a2c1d"
}
```

---

#### 8. Get Student Notification Preferences

```
GET /api/v1/notifications/preferences
```

**Response `200 OK`**
```json
{
  "success": true,
  "preferences": {
    "email": true,
    "inApp": true,
    "types": ["Placement", "Result", "Event"]
  }
}
```

---

#### 9. Update Student Notification Preferences

```
PUT /api/v1/notifications/preferences
```

**Request Body**
```json
{
  "email": false,
  "inApp": true,
  "types": ["Placement", "Result"]
}
```

**Response `200 OK`**
```json
{
  "success": true,
  "message": "Preferences updated"
}
```

---

### Real-Time Notification Mechanism

**Choice: WebSockets (via Socket.IO)**

When a student loads the app, the frontend opens a persistent WebSocket connection authenticated with the same Bearer token. When a new notification is created (either for a specific student or as a broadcast), the server pushes it to the relevant socket room instantly — no polling required.

**Connection flow**

```
Client → WS Handshake: GET /ws?token=<Bearer>
Server → Validates token → Joins student to room: room:<studentID>
Server → On broadcast: emits to all connected rooms
Server → On targeted notify: emits to room:<studentID> only
```

**Event emitted to client**
```json
{
  "event": "new_notification",
  "data": {
    "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
    "type": "Placement",
    "message": "Google is hiring – apply by Dec 20",
    "createdAt": "2026-04-22T17:51:30Z"
  }
}
```

The frontend increments the unread badge and appends the notification to the list without any page reload.

**Why WebSockets over SSE or polling?**

- **SSE** is unidirectional (server → client only) and sufficient here, but WebSockets give us a bidirectional channel that can also carry read-receipts back to the server in real time.
- **Long polling** wastes resources at scale (50,000 students each holding open HTTP connections that time out and reconnect constantly).
- **WebSockets** maintain one persistent TCP connection per client with negligible overhead and sub-100ms delivery latency.

---

## Stage 2

### Database Choice: PostgreSQL

**Why PostgreSQL?**

The notification data is inherently relational: a notification belongs to a type, is associated with many students, and each student has a read-status per notification. This maps cleanly to relational tables with foreign keys. PostgreSQL specifically is chosen for:

- **JSONB support** — future flexibility to attach metadata per notification type without schema migrations.
- **Partial indexes** — critical for the `isRead = false` query pattern at scale.
- **Mature ecosystem** — battle-tested for write-heavy workloads, strong ACID guarantees, and excellent support for full-text search (useful for notification message search later).
- **Row-level locking** — safe concurrent updates when marking notifications read.

---

### DB Schema

```sql
-- Notification types
CREATE TYPE notification_type AS ENUM ('Placement', 'Event', 'Result');

-- Core notifications table (one row per unique notification event)
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          notification_type NOT NULL,
  message       TEXT NOT NULL,
  created_by    UUID,                         -- admin who triggered it (nullable for system events)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students table (simplified — auth is handled externally)
CREATE TABLE students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  roll_no       VARCHAR(50) UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table: one row per student per notification
-- Tracks individual read status without duplicating notification content
CREATE TABLE student_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  notification_id   UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, notification_id)
);

-- Student preferences
CREATE TABLE notification_preferences (
  student_id      UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  email_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  types_enabled   notification_type[] NOT NULL DEFAULT ARRAY['Placement','Event','Result']::notification_type[]
);

-- Indexes
CREATE INDEX idx_sn_student_id        ON student_notifications(student_id);
CREATE INDEX idx_sn_created_at        ON student_notifications(created_at DESC);
CREATE INDEX idx_notif_type           ON notifications(type);
CREATE INDEX idx_notif_created_at     ON notifications(created_at DESC);

-- Partial index: the most queried pattern — unread notifications per student
CREATE INDEX idx_sn_unread            ON student_notifications(student_id, created_at DESC)
  WHERE is_read = FALSE;
```

---

### Problems as Data Volume Grows

**1. student_notifications table explodes**
With 50,000 students and each notification broadcast to all of them, every broadcast adds 50,000 rows. After 100 broadcasts the table has 5,000,000 rows. After 1,000 broadcasts it has 50,000,000. Full table scans become catastrophic.

*Solution:* Partition `student_notifications` by `created_at` (monthly range partitioning). Old partitions can be archived or dropped. Partial index on `is_read = FALSE` ensures unread queries remain fast.

**2. Broadcast write amplification**
Inserting 50,000 rows synchronously on a single broadcast blocks the DB. A naive loop of `INSERT` statements takes seconds and holds connections.

*Solution:* Use a message queue (covered in Stage 5). Batch inserts with `INSERT ... VALUES (...), (...), (...)` — PostgreSQL handles bulk inserts far more efficiently than row-by-row inserts.

**3. Hot read path on unread count**
Every page load triggers `SELECT COUNT(*) WHERE is_read = FALSE AND student_id = ?`. At 50,000 concurrent students this is 50,000 count queries per page load.

*Solution:* Cache unread counts in Redis per student. Invalidate on new notification or read event. (Covered in Stage 4.)

---

### SQL Queries

**Fetch all unread notifications for a student (paginated)**
```sql
SELECT
  n.id,
  n.type,
  n.message,
  n.created_at,
  sn.is_read,
  sn.read_at
FROM student_notifications sn
JOIN notifications n ON sn.notification_id = n.id
WHERE sn.student_id = $1
  AND sn.is_read = FALSE
ORDER BY n.created_at DESC
LIMIT $2 OFFSET $3;
```

**Mark a single notification as read**
```sql
UPDATE student_notifications
SET is_read = TRUE,
    read_at = NOW()
WHERE student_id = $1
  AND notification_id = $2;
```

**Mark all notifications as read for a student**
```sql
UPDATE student_notifications
SET is_read = TRUE,
    read_at = NOW()
WHERE student_id = $1
  AND is_read = FALSE;
```

**Get unread count for a student**
```sql
SELECT COUNT(*)
FROM student_notifications
WHERE student_id = $1
  AND is_read = FALSE;
```

**Delete a notification for a student**
```sql
DELETE FROM student_notifications
WHERE student_id = $1
  AND notification_id = $2;
```

**Fetch all notifications for a student with type filter**
```sql
SELECT
  n.id,
  n.type,
  n.message,
  n.created_at,
  sn.is_read
FROM student_notifications sn
JOIN notifications n ON sn.notification_id = n.id
WHERE sn.student_id = $1
  AND n.type = $2
ORDER BY n.created_at DESC
LIMIT $3 OFFSET $4;
```

---

## Stage 3

### Is the Original Query Accurate?

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

**No — this query is not accurate** for the schema designed in Stage 2. The `notifications` table stores one row per unique notification event and has no `studentID` or `isRead` column. Those columns live in `student_notifications`, the junction table. Running this query against the schema as designed would throw a column-not-found error.

A corrected version would join both tables as shown in the Stage 2 queries above.

Even if the schema had been designed as a denormalised flat table (with `studentID` and `isRead` directly on `notifications`), the query would still have correctness issues at scale because `SELECT *` pulls every column including potentially large message bodies, wasting I/O when only a few fields are needed by the UI.

---

### Why is this Query Slow?

With 50,000 students and 5,000,000 notifications, there is no index on `(studentID, isRead)`. The database performs a **full sequential scan** of all 5,000,000 rows, evaluating both predicates on every single row, then sorts the survivors by `createdAt DESC`.

The computation cost is roughly:

- **Scan:** O(N) = O(5,000,000) row evaluations
- **Sort:** O(K log K) where K is the number of matching rows for that student
- **Total:** effectively O(N) on every call — this scales linearly with table size and becomes slower every day as new notifications are inserted

---

### What Would You Change?

Add a **composite partial index** targeting exactly this query pattern:

```sql
CREATE INDEX idx_notifications_student_unread
ON notifications(studentID, createdAt DESC)
WHERE isRead = false;
```

With this index, the DB skips all rows where `isRead = true` entirely (partial index), and within the remaining rows it can seek directly to `studentID = 1042` and read them pre-sorted by `createdAt DESC`. This turns the query into an **index range scan** — O(log N + K) instead of O(N).

**Likely computation cost after indexing:**

| Metric | Before | After |
|---|---|---|
| Rows scanned | 5,000,000 | ~100 (typical unread per student) |
| Sort cost | O(K log K) | 0 (already sorted by index) |
| Query time (est.) | 800ms–2s | 1–5ms |

---

### On Adding Indexes to Every Column

This is **not effective** and is actively harmful. Each index:

- **Consumes disk space** — a table with 5M rows and 10 indexes can use 5–10× the storage of the table itself
- **Slows down writes** — every `INSERT`, `UPDATE`, and `DELETE` must update all indexes. On a broadcast that inserts 50,000 rows, unnecessary indexes multiply the write cost dramatically
- **Confuses the query planner** — PostgreSQL's planner has to evaluate more index candidates per query, and may occasionally choose a suboptimal plan

Indexes should be added surgically for specific, frequently-run query patterns. The right question is: *which columns appear in `WHERE`, `JOIN ON`, and `ORDER BY` clauses of hot queries?* Only those deserve indexes.

---

### Query: Students Who Received a Placement Notification in the Last 7 Days

Using the Stage 2 schema:

```sql
SELECT DISTINCT s.id, s.name, s.email, s.roll_no
FROM students s
JOIN student_notifications sn ON sn.student_id = s.id
JOIN notifications n ON sn.notification_id = n.id
WHERE n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days'
ORDER BY s.name;
```

---

## Stage 4

### Problem

Every page load fetches notifications from the database for every student. With 50,000 students each loading the app multiple times a day, the database receives hundreds of thousands of identical reads per hour — most returning the same data that hasn't changed since the last load.

---

### Solution: Multi-Layer Caching Strategy

---

#### Layer 1 — Redis Cache for Per-Student Notification Feed

Cache the notification list and unread count per student in Redis with a short TTL.

```
Key:   notifications:student:<studentID>:feed
Value: JSON array of recent notifications (last 20)
TTL:   60 seconds
```

```
Key:   notifications:student:<studentID>:unread_count
Value: integer
TTL:   300 seconds (invalidated immediately on new notification or read event)
```

**Read flow:**
1. API checks Redis for `notifications:student:<studentID>:feed`
2. Cache hit → return immediately, no DB query
3. Cache miss → query DB, populate Redis, return response

**Write/invalidation flow:**
- When a new notification arrives for a student → `DEL notifications:student:<studentID>:feed` and `INCR notifications:student:<studentID>:unread_count`
- When a student marks a notification read → `DEL notifications:student:<studentID>:feed` and `DECR notifications:student:<studentID>:unread_count`

**Tradeoffs:**
- ✅ Eliminates the majority of DB reads — cache hit rate typically 80–95% for active students
- ✅ Unread count served from memory in <1ms vs 20–50ms DB query
- ⚠️ Stale data window of up to 60 seconds — acceptable for notifications (a student seeing a notification 60s late is fine)
- ⚠️ Memory cost: 50,000 students × ~2KB per feed = ~100MB RAM — well within Redis limits
- ⚠️ Cache stampede risk if many students cache-miss at the same time — mitigate with a **mutex lock** (Redis `SET NX`) or probabilistic early expiry

---

#### Layer 2 — HTTP Cache-Control Headers

For the `GET /api/v1/notifications` endpoint, return:

```
Cache-Control: private, max-age=30
ETag: "<hash of notification list>"
```

The browser caches the response for 30 seconds. On the next load within 30s, no network request is made at all. After 30s, the browser sends `If-None-Match: <etag>` — if nothing changed, the server returns `304 Not Modified` with no body, saving bandwidth.

**Tradeoffs:**
- ✅ Eliminates repeat API calls entirely for rapid page navigations
- ⚠️ `private` directive required — shared caches (CDN/proxy) must not cache per-student data
- ⚠️ Client-side cache cannot be force-invalidated on new notification — this is why real-time WebSocket push is still required to trigger a manual refetch

---

#### Layer 3 — Database Query Optimisation (Prerequisite)

Caching only helps if the cache miss path is also fast. The partial composite index from Stage 3 ensures that when a cache miss does hit the DB, it completes in 1–5ms rather than 800ms–2s.

---

### Summary of Tradeoffs

| Strategy | Latency Improvement | Consistency Risk | Complexity |
|---|---|---|---|
| Redis feed cache | Very high (DB bypass) | Low (60s stale window) | Medium |
| Redis unread count | Very high | Very low (event-driven invalidation) | Low |
| HTTP Cache-Control | High (zero network) | Low (30s stale) | Very low |
| DB partial index | High (cache miss path) | None | Low |

---

## Stage 5

### Shortcomings of the Original Implementation

```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)  # calls Email API
        save_to_db(student_id, message)  # DB insert
        push_to_app(student_id, message) # real-time push
```

**1. Synchronous sequential loop — catastrophically slow**
Processing 50,000 students one at a time, where each iteration makes 3 I/O calls (email API, DB insert, WebSocket push), is the worst possible approach. If each iteration takes 50ms, the full loop takes 2,500 seconds (over 40 minutes). Students at the end of the list get notified nearly an hour after the HR clicked the button.

**2. No error handling or retry logic**
If `send_email` fails for student 200, the entire loop either crashes (stopping notifications for the remaining 49,800 students) or silently skips failures with no way to retry them. The 200 failed students are lost unless manually reprocessed.

**3. Coupled operations — DB and email fail together or succeed together (wrong)**
DB inserts and email delivery are fundamentally different operations with different failure modes. A DB failure should not prevent email delivery and vice versa. Coupling them in a single synchronous step means one failed DB insert can block the email queue.

**4. No idempotency**
If the process crashes midway and is restarted, students already notified may be notified again. There is no record of which students have been processed.

**5. Single point of failure**
The entire broadcast depends on one running process. If the server restarts, all progress is lost.

---

### Should DB insert and email happen together?

**No.** They should be decoupled. The in-app notification (DB insert + WebSocket push) and the email are independent delivery channels. If the email provider is down, students should still receive the in-app notification immediately. If the DB is slow, emails should still be dispatched. Coupling them means the slowest or most fragile channel blocks the others.

The correct model is: **write to DB first** (source of truth), then **enqueue email delivery** separately. The DB record is the durable event; email is a side effect.

---

### What Now — The 200 Failed Emails

With a queue-based system, each email delivery attempt is a job. A failed job is **not deleted** — it stays in the queue with a retry count. The job processor retries it with exponential backoff (e.g. after 30s, 2min, 10min). After N retries it moves to a dead-letter queue for manual inspection. This means the 200 failed students will automatically receive their emails once the email provider recovers, with zero manual intervention.

---

### Redesigned Implementation

**Architecture:**

```
HR clicks "Notify All"
        │
        ▼
POST /admin/notifications/broadcast
        │
        ▼
[1] INSERT one row into notifications table  ← single DB write, fast
        │
        ▼
[2] Enqueue a broadcast job: { notificationID, studentIDs[] }
        │
        ▼
[Return 202 Accepted to HR immediately]

═══════════════════════════════════════════════
Background Queue Workers (horizontal scale):
═══════════════════════════════════════════════

Worker picks up broadcast job
        │
        ▼
[3] Batch INSERT into student_notifications  ← 500 rows per batch
        │
        ▼
[4] Enqueue one email job per student  ← fire and forget
        │
        ▼
[5] Push WebSocket event to connected sockets

Email Worker (separate pool):
        │
        ▼
[6] Call Email API per job  ← retried independently on failure
        │
        ▼
[7] On failure: exponential backoff retry → dead-letter queue after 5 attempts
```

---

### Revised Pseudocode

```python
# ── API Handler ──────────────────────────────────────────────────────────────
function broadcast_handler(type: string, message: string, target_ids: array):
    notification_id = db.insert_notification(type, message)
    
    student_ids = target_ids if len(target_ids) > 0 else db.get_all_student_ids()
    
    queue.enqueue("broadcast_job", {
        notification_id: notification_id,
        student_ids: student_ids,
        message: message,
        type: type,
    })
    
    return HTTP 202 { jobID: broadcast_job.id }


# ── Broadcast Worker ─────────────────────────────────────────────────────────
function process_broadcast_job(job):
    BATCH_SIZE = 500
    student_ids = job.student_ids

    # Batch DB inserts — far more efficient than row-by-row
    for batch in chunks(student_ids, BATCH_SIZE):
        db.bulk_insert_student_notifications(job.notification_id, batch)

    # Enqueue individual email jobs
    for student_id in student_ids:
        queue.enqueue("email_job", {
            student_id: student_id,
            notification_id: job.notification_id,
            message: job.message,
            type: job.type,
        })

    # Push real-time WebSocket events to connected students
    websocket_server.broadcast_to_rooms(student_ids, {
        event: "new_notification",
        data: {
            id: job.notification_id,
            type: job.type,
            message: job.message,
        }
    })


# ── Email Worker (separate pool, retries independently) ──────────────────────
function process_email_job(job):
    student = db.get_student(job.student_id)
    prefs = db.get_preferences(job.student_id)
    
    if not prefs.email_enabled:
        return  # student opted out of email
    
    result = email_api.send(student.email, job.message, job.type)
    
    if result.failed:
        if job.retry_count < 5:
            queue.requeue_with_backoff(job, delay = 30s * 2 ^ job.retry_count)
        else:
            queue.move_to_dead_letter(job)
            log(ERROR, "email_job exhausted retries for student " + job.student_id)
```

---

## Stage 6

### Approach: Min-Heap for Top-N Priority Inbox

**Priority Score Formula**

Each notification is scored by combining type weight and recency:

```
priority_score = type_weight × recency_factor

type_weight:
  Placement → 3
  Result    → 2
  Event     → 1

recency_factor = 1 / (1 + hours_since_notification)
```

This ensures a recent Placement always outranks an old Placement, and a very recent Event can outrank an old Result — matching real-world intuition (a placement drive happening today matters more than a result from 6 months ago).

**Data structure: Min-Heap of size N**

To maintain the top-N notifications efficiently as new ones stream in:

1. Maintain a min-heap of fixed size N (keyed by `priority_score`)
2. For each incoming notification:
   - If heap size < N → push it
   - If `priority_score > heap.min()` → pop the min, push the new one
   - Otherwise → discard

This gives O(log N) per insertion, which is optimal. A full sort of all notifications for every new arrival would be O(M log M) where M is total notifications — far worse as M grows.

**Why not a max-heap?**
A max-heap would require storing all M notifications and extracting top N, which is O(M log N). A min-heap of size N only ever stores N elements and runs in O(log N) per new notification — constant regardless of how many total notifications exist.

---

### Code (JavaScript)

```javascript
/**
 * priority_inbox.js
 * Fetches notifications from the evaluation API and returns
 * the top-N by priority (type weight + recency).
 *
 * Priority score = type_weight / (1 + hours_since_created)
 * Type weights: Placement=3, Result=2, Event=1
 *
 * Uses a min-heap of size N to maintain the top-N efficiently
 * as new notifications are processed — O(log N) per insertion.
 */

require("dotenv").config();

const BASE_URL = "http://4.224.186.213/evaluation-service";

// ── Type Weights ──────────────────────────────────────────────────────────────
const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };

// ── Priority Score ────────────────────────────────────────────────────────────
function priorityScore(notification) {
  const weight = TYPE_WEIGHT[notification.Type] ?? 1;
  const createdAt = new Date(notification.Timestamp.replace(" ", "T") + "Z");
  const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return weight / (1 + hoursSince);
}

// ── Min-Heap ──────────────────────────────────────────────────────────────────
class MinHeap {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0] ?? null;
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].score <= this.heap[i].score) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l].score < this.heap[smallest].score) smallest = l;
      if (r < n && this.heap[r].score < this.heap[smallest].score) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function getToken() {
  const res = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.LOG_EMAIL,
      name: process.env.LOG_NAME,
      rollNo: process.env.LOG_ROLL_NO,
      accessCode: process.env.LOG_ACCESS_CODE,
      clientID: process.env.LOG_CLIENT_ID,
      clientSecret: process.env.LOG_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

// ── Fetch Notifications ───────────────────────────────────────────────────────
async function fetchNotifications(token) {
  const res = await fetch(`${BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Notifications API failed: ${await res.text()}`);
  const data = await res.json();
  return data.notifications;
}

// ── Top-N using Min-Heap ──────────────────────────────────────────────────────
function getTopN(notifications, n) {
  const heap = new MinHeap();

  for (const notif of notifications) {
    const score = priorityScore(notif);
    const entry = { score, notif };

    if (heap.size() < n) {
      heap.push(entry);
    } else if (score > heap.peek().score) {
      heap.pop();
      heap.push(entry);
    }
  }

  // Extract and sort descending (highest priority first)
  const result = [];
  while (heap.size() > 0) result.push(heap.pop());
  return result.reverse();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const TOP_N = 10;

  console.log(`\n=== Priority Inbox — Top ${TOP_N} Notifications ===\n`);

  const token = await getToken();
  const notifications = await fetchNotifications(token);

  console.log(`Fetched ${notifications.length} notifications. Computing top ${TOP_N}...\n`);

  const topN = getTopN(notifications, TOP_N);

  console.log(
    `${"Rank".padEnd(6)}${"Type".padEnd(12)}${"Score".padEnd(10)}${"Timestamp".padEnd(22)}Message`
  );
  console.log("─".repeat(80));

  topN.forEach(({ score, notif }, idx) => {
    console.log(
      `${String(idx + 1).padEnd(6)}${notif.Type.padEnd(12)}${score.toFixed(4).padEnd(10)}${notif.Timestamp.padEnd(22)}${notif.Message}`
    );
  });

  console.log("\n─".repeat(80));
  console.log("Done.\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
```

---

### Maintaining Top-N as New Notifications Arrive

The min-heap approach scales naturally for a live stream. When a new notification is pushed (via WebSocket), the frontend or backend calls `addNotification(newNotif)`:

```javascript
function addNotification(heap, newNotif, n) {
  const score = priorityScore(newNotif);
  const entry = { score, notif: newNotif };

  if (heap.size() < n) {
    heap.push(entry);
  } else if (score > heap.peek().score) {
    heap.pop();    // evict the least important
    heap.push(entry);
  }
  // else: new notification isn't important enough to displace top-N
}
```

Each call is O(log N) — constant regardless of how many total notifications exist. The heap always maintains exactly the top-N without re-sorting or re-fetching.
