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

## Repo layout

```
backend/            Express + Prisma API
apps/super-admin/   Next.js app (Super Admin)   [added in a later step]
apps/admin/         Next.js app (Org Admin)     [added in a later step]
apps/user/          Next.js app (End User)      [added in a later step]
```

## Build steps

- **Step 0 — Foundations:** repo, backend scaffold, Prisma schema, migrate + seed.  ← current
- Step 1 — Backend auth (signup/login, JWT, role middleware).
- Step 2 — Backend domain (organizations, flag CRUD, feature check).
- Step 3 — Super Admin frontend.
- Step 4 — Admin frontend.
- Step 5 — User frontend.

See `backend/README.md` for backend setup and the Supabase instructions.
