# UniqEquip — University Event Equipment Booking System

React (Vite) frontend + Spring Boot backend + H2 database, deployed as **one Render Web Service** (Docker; Spring Boot serves the built frontend and `/api/v1/...` from the same origin).

## Local development

Backend (defaults to `http://localhost:8085`):

```bash
cd backend
mvn spring-boot:run
```

Frontend (Vite proxies `/api` to `localhost:8085`):

```bash
cd frontend
npm install
npm run dev
```

Docker equivalent of production:

```bash
docker build -t uniqequip .
docker run --rm -p 10000:10000 -e PORT=10000 uniqequip
```

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No (Render supplies it) | `8085` | HTTP port |
| `APP_TIMEZONE` | No | `Asia/Kolkata` | Timezone used for reminder calculations and display |

Copy `.env.example` to `.env` for local use. **Never commit `.env` or any real credentials.**

## In-app notifications

Booking updates and equipment reminders are delivered as **in-app notifications** (notification bell in the navbar, full history page). They are stored durably in the `user_notifications` table and future reminders are delivered by an in-app scheduler (every ~60s):

| Type | When |
|---|---|
| `BOOKING_CREATED` | Immediately after a booking is created |
| `BOOKING_FACULTY_APPROVED` | After faculty endorsement |
| `BOOKING_APPROVED` | After admin approves |
| `BOOKING_REJECTED` | After faculty/admin rejects (future reminders cancelled) |
| `EQUIPMENT_ISSUED` | After equipment is issued |
| `START_REMINDER` | `startDate − 1 hour` (e.g. 3 PM event → 2 PM reminder) |
| `RETURN_REMINDER` | `endDate − 1 hour` (e.g. 6 PM end → 5 PM reminder), only while `ISSUED` |
| `EQUIPMENT_RETURNED` | After equipment is returned (pending return reminder cancelled) |

Duplicate protection: unique constraint on (`booking_id`, `user_id`, `type`) — a delivered notification is never delivered again, even across restarts. Overdue reminders are delivered on the next scheduler run after a sleep/wake cycle as long as they are still valid. No email, SMTP, or external services are used; the old `email_notifications` table (if present in an existing H2 file) is simply left unused.

## Database Manager (Admin → Database Manager)

Visual admin UI over the H2 data: `Users`, `Equipment`, `Bookings`, `Booking Items`, `Recommendation Rules`, `User Notifications` — with search, sort, pagination, add/edit/delete modals (with confirmation) and JSON validation. Passwords are never displayed. All endpoints live under `/api/v1/admin/...` and require the `X-User-Role: ADMIN` header (the strongest check available in this app's current role-based auth); the UI hides the section from non-admins.

The raw H2 Console (`/h2-console`) stays enabled as a **developer debugging tool only** — end users should use the Database Manager.

## Render limitations (free tier)

- The service **sleeps after inactivity**, so the in-process Spring scheduler cannot fire at exact times while asleep. Exact-time reminders need an always-on instance or an external cron calling a protected endpoint. No self-ping hacks are used.
- File-based H2 (`./data/...`) lives on Render's **ephemeral filesystem**: data does not survive restarts/redeploys and is unsuitable for permanent production storage. H2 is kept intentionally for this university demo; a managed database migration is out of scope.
