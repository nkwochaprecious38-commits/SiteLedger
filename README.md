# SiteLedger

Construction project management SaaS: projects, tasks, daily site reports, documents, budgets and expenses, materials, team, contractors, issues and inspections, analytics, notifications, search and subscription plans.

Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (Auth, Postgres with row level security, Storage), Recharts, Lucide.

## Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`. It creates every table, index, row level security policy, the private `siteledger-files` storage bucket and the signup trigger that creates a company, workspace, owner membership, team member record and subscription for each new user.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Optionally set `NEXT_PUBLIC_SITE_URL` for sitemap and metadata.
4. In Supabase Authentication settings:
   - Set Site URL to your deployed URL.
   - Add `<your url>/auth/callback` to Redirect URLs (used by email confirmation and password reset).
   - Decide whether email confirmation is required. If it is on, new users confirm by email before signing in.
5. `npm install`, then `npm run dev` (or `npm run build && npm start`).

Without the two environment variables the public site works, the sign up and login forms show a configuration notice and are disabled, and `/app` redirects to login.

## Architecture notes

- `src/middleware.ts` refreshes the Supabase session and protects `/app/*`.
- `src/lib/data.tsx` loads the signed in user's workspace data (RLS enforces what is returned), exposes create, update and remove helpers that also write activity logs, and derives notifications from live data.
- Every operational table has `workspace_id`. Policies allow members to read and writers (owner, admin, manager, member) to change rows in their own workspace only. Viewers are read only.
- Files are stored under `<workspace_id>/...` in a private bucket; storage policies check that prefix. Downloads use short lived signed URLs.
- "Load sample data" on an empty Overview inserts a sample portfolio into the user's own workspace through the normal API. Delete the projects to remove it.
- People assignments are stored as uuid arrays: `team_members.project_ids` and `contractors.project_ids`.

## Subscriptions and pricing

Prices come from the three Selar subscription pages (USD, billed monthly): $47, $57 and $97. Those pages list no plan names or benefits, so names and inclusions in `src/lib/plans.ts` are proposed and flagged `PLAN_CONTENT_CONFIRMED = false`. Update that file and set the flag to true once confirmed; the pricing page notice disappears.

Checkout hands off to the matching Selar page. Payment is not processed inside SiteLedger and no Selar webhook is connected, so a subscription stays `pending_checkout` until a trusted process sets it to `active` using the service role (a database trigger stops clients from activating their own plan). Add a Selar webhook handler that updates `subscriptions.status` to complete this flow.

## Not connected yet

- Email delivery of notifications and team invitations.
- Selar webhook for automatic subscription activation.
- Terms of service and privacy policy pages (the signup form requires acceptance but links to none).
- Support contact channel (Help page says so).
