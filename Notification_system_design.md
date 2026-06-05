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
 create database vehicle_scheduling;
use vehicle_scheduling;
CREATE TABLE SCHEDULE (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  operational_score INT NOT NULL,
  service_duration INT NOT NULL,
  daily_mechanic_hour_budget INT NOT NULL
);
###
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
###
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
###
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
###
# STAGE 3


