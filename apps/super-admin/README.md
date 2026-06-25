# Super Admin app

Next.js (App Router) frontend for the **host / Super Admin**. Runs on port **3001**.

Features: log in with the static super-admin credentials, create organizations, view all
organizations (with user/flag counts).

## Run

```bash
cd apps/super-admin
npm install
npm run dev        # http://localhost:3001
```

Requires the backend running on http://localhost:4000. To point elsewhere, set
`NEXT_PUBLIC_API_URL` (e.g. in `.env.local`).

Default super-admin login comes from the backend `.env` (`SUPER_ADMIN_EMAIL` /
`SUPER_ADMIN_PASSWORD`) — by default `superadmin@host.com` / `SuperAdmin@123`.
