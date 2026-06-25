# Admin app

Next.js (App Router) frontend for **Organization Admins**. Runs on port **3002**.

Features: sign up into an existing organization (chosen from a dropdown), log in, and manage the
organization's feature flags — create a flag, toggle it on/off, and delete it. All flags are scoped
to the admin's own organization.

## Run

```bash
cd apps/admin
npm install
npm run dev        # http://localhost:3002
```

Requires the backend running on http://localhost:4000. To point elsewhere, set
`NEXT_PUBLIC_API_URL` (e.g. in `.env.local`).

Organizations must be created first by the Super Admin app. A test admin already exists:
`admin@acme.com` / `secret123` (org "Acme Corp").
