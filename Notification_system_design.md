# STAGE 1

REST API DESIGN
 usually when a user logins he might get the notification like
 i.you logged into this particular app successfully
 ii.invalid credentials
 iii. try after sometime
 iv. password notifications etc

 ## Notification API design

### Data model

Use a `notifications` table like:

- `notification_id` INT AUTO_INCREMENT PRIMARY KEY
- `user_id` INT NOT NULL
- `title` VARCHAR(255)
- `message` TEXT
- `type` VARCHAR(50) — e.g. `alert`, `reminder`, `info`
- `status` VARCHAR(20) — e.g. `unread`, `read`
- `related_entity` VARCHAR(50) NULL — e.g. `schedule`
- `related_id` INT NULL
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `read_at` TIMESTAMP NULL

---

## Endpoints

### 1. Create a notification
`POST /notifications`

Request body:
```json
{
  "user_id": 123,
  "title": "Service due",
  "message": "Vehicle 456 needs maintenance tomorrow.",
  "type": "reminder",
  "related_entity": "schedule",
  "related_id": 456
}
```

Response:
```json
{
  "notification_id": 1,
  "message": "Notification created successfully"
}
```

---

### 2. Get all notifications
`GET /notifications`

Optional query params:
- `user_id`
- `status=unread`
- `type=reminder`

Response:
```json
[
  {
    "notification_id": 1,
    "user_id": 123,
    "title": "Service due",
    "message": "Vehicle 456 needs maintenance tomorrow.",
    "type": "reminder",
    "status": "unread",
    "created_at": "2026-06-05T12:00:00Z"
  }
]
```

---

### 3. Get unread notifications
`GET /notifications?user_id=123&status=unread`

---

### 4. Get a single notification
`GET /notifications/{notification_id}`

Response:
```json
{
  "notification_id": 1,
  "user_id": 123,
  "title": "Service due",
  "message": "Vehicle 456 needs maintenance tomorrow.",
  "status": "unread",
  "created_at": "2026-06-05T12:00:00Z"
}
```

---

### 5. Mark notification as read
`PUT /notifications/{notification_id}/read`

Response:
```json
{
  "message": "Notification marked as read"
}
```

---

### 6. Delete notification
`DELETE /notifications/{notification_id}`

Response:
```json
{
  "message": "Notification deleted"
}
```

---

## Notes

- Use `status` to filter unread vs read notifications.
- Use `related_entity` and `related_id` to link notifications to schedules, vehicles, or other records.
- For real systems, add authentication so users only access their own notifications.
- If you need, I can also give you the exact Express route code and SQL table creation statement.


 # STAGE 2
 ## Stage 2 SQL commands

Run these in your MySQL client:

```sql
CREATE DATABASE vehicle_scheduling;
USE vehicle_scheduling;

CREATE TABLE schedule (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  operational_score INT NOT NULL,
  service_duration INT NOT NULL,
  daily_mechanic_hour_budget INT NOT NULL
);

INSERT INTO schedule (
  vehicle_id,
  operational_score,
  service_duration,
  daily_mechanic_hour_budget
) VALUES (
  123,
  85,
  4,
  8
);

INSERT INTO schedule (
  vehicle_id,
  operational_score,
  service_duration,
  daily_mechanic_hour_budget
) VALUES (
  122,
  80,
  40,
  4
);

INSERT INTO schedule (
  vehicle_id,
  operational_score,
  service_duration,
  daily_mechanic_hour_budget
) VALUES (
  100,
  50,
  20,
  12
);
```

 After this, your `vehicle_scheduling.schedule` table will exist and contain the three sample rows.
 
 # STAGE 3
 Why this query is better

Your query is already using the right pattern:

- `WHERE user_id = ? AND status = 'unread'`
- `ORDER BY created_at DESC`


That is good because it:
- restricts rows to the current user
- filters only unread notifications
- returns newest items first
- stops after 10 results

---

## Why it can still be slow at 500,000 rows

Even with `WHERE` + `ORDER BY DESC`, performance depends on indexing.

If MySQL must scan many rows before ordering, then 500k rows is still expensive.

So the real improvement is:

- keep the filter narrow
- order by an indexed column
- use `LIMIT`
- avoid scanning the full table

---

## Use this query

```sql
SELECT *
FROM notifications
WHERE user_id = ?
  AND status = 'unread'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Make it truly efficient

Add an index for the filter and order:

```sql
CREATE INDEX idx_notifications_user_status_created_at
  ON notifications (user_id, status, created_at DESC);
```

That lets the database:
- find only that user’s unread rows
- sort by newest notification
- return just the first 10 quickly

---

## If you want top priority instead of newest

If you need order by `operational_cost` or `service_duration`, then make sure those columns are indexed too:

```sql
CREATE INDEX idx_notifications_user_status_priority
  ON notifications (user_id, status, operational_cost DESC);
```

Then query:

```sql
SELECT *
FROM notifications
WHERE user_id = ?
  AND status = 'unread'
ORDER BY operational_cost DESC
LIMIT 10;
```

---

## Summary

Yes, the query is on the right track. For 500k rows, the key is to:
- use `WHERE`
- use `ORDER BY ... DESC`
- use `LIMIT`
- and add the matching index so the database does not scan all rows.

# STAGE 4
## 1.Don't fetch the full notification list on every page
only  request what you need in the UI
.unrea## Make notification UI user-friendly

### 1. Don’t fetch the full list on every page
Only request the data the page actually needs:

- unread count
- latest 1–3 notifications
- badge data only

This avoids loading the entire notification list each time.

---

### 2. Load full notifications on demand
Only fetch the full notification history when the user opens the notification panel or page.

That means:
- normal pages stay fast
- detailed data loads only when needed

---

### 3. Use lightweight endpoints
Create simple, efficient API calls for UI use:

- `GET /notifications/count?user_id=123`
- `GET /notifications/recent?user_id=123&limit=3`
- `GET /notifications?page=2&limit=20`

This keeps queries small and fast.

---

### 4. Cache data on the client
Store frequently used notification data temporarily in the browser:

- badge count
- recent notification summary

This avoids repeated calls when the user visits the same page again.

---

### 5. Paginate notification history
For older notifications, use pagination:

- `page=1&limit=20`
- `page=2&limit=20`

Do not load 500k records at once.

---

## Result: better UX

This approach gives you:

1. a badge count on every page  
2. summary data only on page load  
3. full list only when the user asks for it  
4. faster page transitions  

 In short: fetch less, load details only on demand, and keep the interface lightweight.
                                 
## STAGE 5
## What to do if `notify all` stops mid-way

### 1. Don’t send to everyone in one blocking run
Large broadcasts should be processed in chunks, not one monolithic loop.

### 2. Track delivery state
Use a table or queue with a status field:
- `pending`
- `sending`
- `sent`
- `failed`

That way, if it stops, you can resume from the last incomplete item.

### 3. Retry failures
For each notification send:
- retry a few times on transient errors
- log permanent failures
- mark failed deliveries separately

### 4. Use a queue / worker model
Better approach:
- enqueue notification tasks
- process them with workers
- if a worker crashes, unprocessed tasks stay in the queue

### 5. Make the operation idempotent
Ensure retrying the same notification does not create duplicates:
- use a unique notification ID
- update status instead of inserting duplicate records

### 6. Monitor and alert
If the broadcast stops:
- detect incomplete batches
- alert on failed worker or queue backlog
- restart or continue the job automatically

### Example recovery strategy
If the job stopped at 1000/5000 users:
- query `notifications WHERE status IN ('pending','failed')`
- continue sending the remaining items
- avoid restarting from user 1 again unless safe

### In short
If `notify all` stops mid-way, don’t restart blindly. Use:
- chunked sends
- status tracking
- retries
- queue-based processing
- idempotency

That gives a reliable notification system and avoids broken UI or duplicate sends.



