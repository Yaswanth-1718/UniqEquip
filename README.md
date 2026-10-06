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
| `MAIL_USERNAME` | For email sending | _(empty)_ | Gmail address used as SMTP login + sender |
| `MAIL_PASSWORD` | For email sending | _(empty)_ | **Google App Password** (16 chars), NOT your Gmail password |
| `MAIL_FROM_NAME` | No | `UniqEquip` | Sender display name |
| `APP_TIMEZONE` | No | `Asia/Kolkata` | Timezone used for reminder scheduling and email times |

Copy `.env.example` to `.env` for local use. **Never commit `.env` or any real credentials.**

Without `MAIL_USERNAME`/`MAIL_PASSWORD` the app still starts and bookings work normally; emails are recorded as `FAILED` in `email_notifications` and can be retried later from Admin → Database Manager → Email Notifications.

## n8n delivery (production)

Production email delivery and reminder scheduling are handled by n8n, not by Gmail SMTP from this app:

```text
React → Spring Boot → n8n webhook → Wait / status checks → Gmail node → user email
```

Spring Boot only POSTs booking lifecycle events to the n8n webhook; the frontend never talks to n8n. Events: `BOOKING_CREATED`, `BOOKING_APPROVED`, `BOOKING_REJECTED` (with `reviewerNotes`), `EQUIPMENT_RETURNED`, `TEST_EMAIL`. Dates are sent as ISO-8601 with offset (e.g. `2026-10-08T15:00:00+05:30`) in `APP_TIMEZONE`. Every webhook call carries the `X-UNIEQUIP-SECRET` header; the secret is never logged, never sent to the browser, and never committed.

Render environment variables:

```text
N8N_ENABLED=true
N8N_WEBHOOK_URL=https://n8n-latest-f5hv.onrender.com/webhook/uniequip-booking-event
N8N_WEBHOOK_SECRET=<same secret configured in the n8n Normalize & Verify node>
APP_TIMEZONE=Asia/Kolkata
```

`MAIL_USERNAME` / `MAIL_PASSWORD` are **not required** when n8n mode is enabled. When `N8N_ENABLED=true`, the local `JavaMailSender` flow and the local `EmailNotificationScheduler` are dormant (the scheduler bean is not even created), so no duplicate emails are possible; the `email_notifications` table is kept for history. With `N8N_ENABLED=false` (default, local dev) the original local system works as before. A webhook failure never fails the booking — it is only logged.

## Gmail SMTP setup (App Password)

1. Create or choose a Gmail account for notifications (e.g. `uniequip.notifications@gmail.com`).
2. Enable Google **2-Step Verification** on that account (myaccount.google.com → Security).
3. Generate an **App Password**: Security → 2-Step Verification → App passwords → create one for "Mail". Copy the 16-character code.
4. Locally, set in your environment / `.env`:
   - `MAIL_USERNAME=<that gmail address>`
   - `MAIL_PASSWORD=<the 16-character App Password>`
5. On Render: Service → **Environment** → add `MAIL_USERNAME`, `MAIL_PASSWORD`, plus `MAIL_FROM_NAME=UniqEquip` and `APP_TIMEZONE=Asia/Kolkata`.
6. Redeploy the service.
7. Open **Admin → Database Manager → Email Notifications** → **Send Test Email**, enter your address, and confirm it arrives.

Never use your normal Gmail account password — only an App Password.

## Booking emails

Stored durably in the `email_notifications` table and processed by an in-app scheduler (every ~60s):

| Type | When |
|---|---|
| `BOOKING_CONFIRMATION` | Immediately after a booking is created |
| `BOOKING_APPROVED` | After admin approves |
| `BOOKING_REJECTED` | After faculty/admin rejects (future reminders cancelled) |
| `START_REMINDER` | `startDate − 1 hour` (e.g. 3 PM event → 2 PM reminder) |
| `RETURN_REMINDER` | `endDate − 1 hour` (e.g. 6 PM end → 5 PM reminder), only while `ISSUED` |

Duplicate protection: unique constraint on `(booking_id, type)` plus status-gated sending — a `SENT` notification is never picked up again, even across restarts. Failed sends retry up to 3 times with a delay.

## Database Manager (Admin → Database Manager)

Visual admin UI over the H2 data: `Users`, `Equipment`, `Bookings`, `Booking Items`, `Recommendation Rules`, `Email Notifications` — with search, sort, pagination, add/edit/delete modals (with confirmation), JSON validation, and SMTP test/retry tools.Passwords are never displayed. All endpoints live under `/api/v1/admin/...` and require the `X-User-Role: ADMIN` header (the strongest check available in this app's current role-based auth); the UI hides the section from non-admins.

The raw H2 Console (`/h2-console`) stays enabled as a **developer debugging tool only** — end users should use the Database Manager.

## Render limitations (free tier)

- The service **sleeps after inactivity**, so the in-process Spring scheduler cannot fire at exact times while asleep. Exact-time reminders need an always-on instance or an external cron calling a protected endpoint. No self-ping hacks are used.
- File-based H2 (`./data/...`) lives on Render's **ephemeral filesystem**: data does not survive restarts/redeploys and is unsuitable for permanent production storage. H2 is kept intentionally for this university demo; a managed database migration is out of scope.
