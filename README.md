# Multi-Tenant Feature Flag Management System

A small SaaS-style feature-flag system:

- **Super Admin** (host) creates organizations.
- **Org Admins** manage feature flags scoped to their organization.
- **End Users** check whether a feature is enabled for their organization.

## Architecture

```
super-admin app   admin app   user app        (3 separate Next.js frontends)
        \             |           /
         \            |          /
          ----> Express API (Node + TypeScript)  ----> Supabase (Postgres, via Prisma)
                JWT auth + role guards + tenant scoping
```

Auth is **custom** (JWT + bcrypt). Supabase is used **only as the Postgres database** — its
built-in Auth is intentionally not used, to comply with the "no third-party auth providers" rule.
The organization a user acts on is derived from their JWT (never from the request), which is what
enforces tenant isolation.

## Repo layout

```
backend/            Express + Prisma API                    (port 4000)
apps/super-admin/   Next.js app — create/list orgs          (port 3001)
apps/admin/         Next.js app — manage feature flags       (port 3002)
apps/user/          Next.js app — check a feature            (port 3003)
```

Frontends use Next.js (App Router) + Tailwind + shadcn/ui.

## Running everything

1. **Backend** (see `backend/README.md` for Supabase setup):
   ```bash
   cd backend && npm install
   cp .env.example .env        # fill in Supabase + secrets
   npm run prisma:migrate && npm run db:seed
   npm run dev                 # http://localhost:4000
   ```
2. **Each frontend** (separate terminals):
   ```bash
   cd apps/super-admin && npm install && npm run dev   # :3001
   cd apps/admin       && npm install && npm run dev   # :3002
   cd apps/user        && npm install && npm run dev   # :3003
   ```

## Demo credentials

- **Super Admin:** `superadmin@host.com` / `SuperAdmin@123` (from backend `.env`)
- **Org Admin (Acme Corp):** `admin@acme.com` / `secret123`
- **End User (Acme Corp):** `user@acme.com` / `secret123` — try checking the key `dark_mode`

## Roles

| Role | App | Can |
|---|---|---|
| Super Admin | super-admin (:3001) | log in (static creds), create & list organizations |
| Org Admin | admin (:3002) | sign up into an org, log in, create / toggle / delete flags (own org only) |
| End User | user (:3003) | sign up into an org, log in, check whether a feature key is enabled |
