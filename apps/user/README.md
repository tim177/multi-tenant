# User app

Next.js (App Router) frontend for **End Users**. Runs on port **3003**.

Features: sign up into an existing organization (chosen from a dropdown) or log in, then check
whether a given feature key is enabled for your organization. The check is scoped to the user's own
organization (derived from their login, never from the request).

## Run

```bash
cd apps/user
npm install
npm run dev        # http://localhost:3003
```

Requires the backend running on http://localhost:4000. To point elsewhere, set
`NEXT_PUBLIC_API_URL` (e.g. in `.env.local`).

A test end user already exists: `user@acme.com` / `secret123` (org "Acme Corp"). Try checking the
key `dark_mode`.
