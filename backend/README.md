# Backend — Feature Flags API

Node.js + TypeScript + Express + Prisma. Supabase is used only as the Postgres database.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values (see below)
npm run prisma:generate
npm run prisma:migrate     # creates tables in Supabase
npm run db:seed            # seeds roles: org_admin, end_user
npm run dev                # starts API on http://localhost:4000
```

Health check: `GET http://localhost:4000/api/health` → `{ "status": "ok", "db": "connected" }`.

## Setting up Supabase (one-time)

1. Go to https://supabase.com → sign in → **New project**.
2. Pick a name, set a **database password** (save it), choose a region, create.
3. Wait ~1 min for it to provision.
4. Click **Connect** (top bar) → **ORMs** tab → framework **Prisma**. It shows two strings:
   - `DATABASE_URL` → the **pooled** connection (host `...pooler.supabase.com`, port `6543`).
   - `DIRECT_URL` → the **direct** connection (port `5432`).
5. Copy both into `backend/.env`, replacing `[YOUR-PASSWORD]` with the password from step 2.
6. Set `JWT_SECRET` to a long random string, and pick `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`.

That's all that's needed from the dashboard — we create the tables ourselves via Prisma migrations.

## API reference

Auth is via `Authorization: Bearer <jwt>`. The org a caller acts on is derived from their token —
never from a request parameter — which is what enforces tenant isolation.

| Method | Route | Role | Purpose |
|---|---|---|---|
| GET | `/api/health` | — | liveness + DB check |
| POST | `/api/auth/super-admin/login` | — | static env credentials → super_admin JWT |
| POST | `/api/auth/signup` | — | register org_admin / end_user into an existing org |
| POST | `/api/auth/login` | — | email + password → JWT (org from user record) |
| GET | `/api/organizations/public` | — | `[{id,name}]` for signup dropdowns |
| POST | `/api/organizations` | super_admin | create an organization |
| GET | `/api/organizations` | super_admin | list all orgs (+ user/flag counts) |
| GET | `/api/flags` | org_admin | list this org's flags |
| POST | `/api/flags` | org_admin | create a flag (`{key, enabled?}`) |
| PATCH | `/api/flags/:id` | org_admin | enable/disable or rename (org-scoped) |
| DELETE | `/api/flags/:id` | org_admin | delete (org-scoped) |
| GET | `/api/flags/check?key=` | end_user | resolve a flag for the caller's org |

Status codes: `400` validation, `401` missing/invalid token, `403` wrong role, `404` not found /
not in your org, `409` duplicate (org name or feature key).

## Env vars

See `.env.example`. Never commit `.env` (it's git-ignored).
