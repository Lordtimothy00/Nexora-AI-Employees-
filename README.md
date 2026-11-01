# Nexora — AI Employees

A production-quality front-end for **Nexora**, a platform where teams hire AI employees for
sales, support, marketing, operations, finance, and people. Built as a complete product
experience: marketing site, catalogue, employee profiles, pricing, auth, and an authenticated
workspace with a working demo of the product.

> Design direction: **deep-space glass** — Apple Vision Pro meets a futuristic SaaS command center,
> on a teal-black canvas with emerald CTAs.
> Deep-space canvas (`#051718`) with emerald (`#0bd39a`) and teal (`#12e3c0`) aurora layers,
> drifting particles and a hairline grid. Surfaces are frosted glass (24–40px backdrop blur, subtle
> blue-white edges, 20–28px corners), the navbar floats above the page, and the hero is ringed by
> floating glass employee cards with live status indicators.

---

## Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | React 18 + TypeScript (strict)                     |
| Build      | Vite 6                                             |
| Styling    | Tailwind CSS v4 (`@tailwindcss/vite`) + design tokens in `src/index.css` |
| Routing    | React Router v6 (nested layouts + protected routes) |
| Icons      | lucide-react                                       |
| State      | React Context + `localStorage` persistence          |
| Tests      | Vitest + jsdom + Testing Library                   |
| Deployment | Vercel (SPA rewrites included)                     |

No UI kit, no chart library, no animation library — charts, modals, accordions, toasts, and
scroll reveals are hand-built so the visual language stays consistent and the bundle stays small.

---

## Pages

| Route                     | What it does                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `/`                       | Hero with live product preview, logo marquee, pillars, onboarding flow, roster, how-it-works, capabilities, stats, testimonials, pricing teaser, CTA |
| `/employees`              | Full roster with search, department filters, sorting, "on your team" state, empty state |
| `/employees/:slug`        | Employee profile: bio, deliverables, working-session transcript, capabilities, sample work, integrations, sticky hire card, related roles |
| `/how-it-works`           | Five phases with mini-visuals, day-in-the-life timeline, integrations grid, security model, FAQ |
| `/pricing`                | Monthly/annual toggle, three tiers, full comparison table, testimonials, pricing FAQ |
| `/login` `/signup`        | Split-screen auth with validation, password strength, plan context, pending-hire intent |
| `/forgot-password` `/reset-password` | Password recovery: single-use email link, neutral confirmation, session-scoped password change |
| `/dashboard`              | Authenticated overview: KPIs, delivery chart, live activity, team, approval queue, assign-task modal |
| `/dashboard/team`         | Employee cards with pause/resume, remove, utilisation, team economics; roster with emailed invites |
| `/dashboard/tasks`        | Kanban board with drag & drop, filters, task detail, assign-task flow            |
| `/dashboard/conversations`| Team chat with canned AI replies, typing indicator, suggestion prompts           |
| `/dashboard/analytics`    | Charts, department mix, employee scorecard, CSV export, insights                 |
| `/dashboard/billing`      | Plan, usage meters, payment method, invoices (downloadable), plan switching      |
| `/dashboard/settings`     | Profile, workspace rename/delete, preferences, security, sign out               |
| `/404`                    | Branded not-found page                                                           |

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # typecheck + production build
npm run preview    # preview the production build
npm run typecheck  # tsc project build
npm test           # Vitest + Testing Library (23 tests)
npm run test:watch
```

Requirements: Node 20+ (developed on Node 22).

### Backend (Supabase)

Auth and workspace data run on Supabase, with a local fallback so the app still works offline.

```bash
cp .env.example .env    # then fill in your project URL + publishable key
```

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Project Settings → Data API |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API Keys (**publishable** key only) |

Schema (already applied to the project, kept as a migration record):

- `profiles` — one row per `auth.users` row, created by the `handle_new_user` trigger from the
  signup metadata (`name`, `company`). Holds `role`, `plan`, `active_workspace_id` and `prefs`
  (the notification toggles from Settings, so they survive a reload). An **invited** user gets a
  profile but no workspace of their own — they are joining someone else's, and an invite nobody
  accepts no longer leaves an empty workspace behind; one is created lazily if they ever sign in
  without accepting.
- `hires` — which employee someone has hired, their status, tasks completed, utilisation.
- `tasks`, `messages`, `activities` — the task board, conversations, and the activity feed.

Every table carries `user_id uuid default auth.uid()`, has RLS enabled, and a single
`for all` policy scoped to `auth.uid() = user_id` — so a signed-in user can only ever read or
write their own rows. The browser uses the publishable key; no service-role key is ever shipped.

If the env vars are absent (or `MODE === 'test'`), `getSupabase()` returns `null` and the app falls
back to the localStorage workspace below — `npm run dev` and `npm test` work with no backend at all.

### Password recovery

`/forgot-password` calls `auth.resetPasswordForEmail`, and the email links to `/reset-password`,
where the recovery session it carries sets a new password through `auth.updateUser`. Supabase
only redirects to URLs on its allow list, so **Authentication → URL Configuration** must include
every origin that serves the app:

```
https://nexora-ai-employees.vercel.app/**
https://*-apex-e377.vercel.app/**      # preview deploys
http://localhost:5173/**               # local dev
```

Both values are already set on the project (`Site URL` = the production domain). Two limits worth
knowing: the built-in mailer is rate-limited to a couple of messages an hour and is not meant for
production traffic — see `supabase/email-templates/README.md` for the custom SMTP setup that fixes
deliverability for invites and recovery at once.
The `/reset-password` page never claims a link exists when no backend is configured, and the demo
workspace's password form stays disabled because there is no account behind it to change.

### Team invites

Inviting a teammate happens in `invite-member` (`supabase/functions/invite-member`), not in the
browser: the function checks the caller is an **owner or admin** of that workspace, writes the
`workspace_invites` row with the service-role key, and asks GoTrue to email the invite, so the mail
comes from the same sender as password resets.

- Request `{ workspaceId, email, role, origin }`; the link is `<origin>/invite/<token>`, which is
  the page that claims the membership server-side.
- `200 { emailed: true }` — sent. `200 { emailed: false, reason: 'has_account' }` — the address
  already belongs to a Nexora account, so no invite mail is possible; the admin gets the link.
  `502 send_failed` — the invite exists but the mail did not go (mailer rate limit, unverified
  sender, invalid domain); the response still carries the token so the UI copies the link.
- 20 invites per workspace per hour, on top of whatever the mailer allows. `403 not_admin`,
  `401 not_authenticated`, `503 membership_check_failed`.
- When no email was sent the Team page copies the link and says so instead of claiming delivery.
  This is also the fallback while SMTP is unset — see `supabase/email-templates/README.md` for the
  dashboard steps that turn real email on.

### Employee replies

Employee answers come from the `employee-reply` edge function (`supabase/functions/employee-reply`),
deployed with JWT verification on.

- Set at least one secret on the project: `GEMINI_API_KEY` (uses `gemini-flash-lite-latest`, whose Google
  AI Studio free tier needs no card — the best default for a demo), `OPENAI_API_KEY` (uses
  `gpt-4o-mini`) or `ANTHROPIC_API_KEY` (uses `claude-3-5-haiku-latest`).
- Providers are tried cheapest-first and the function falls through to the next one when one
  refuses, so an account with no credit left does not break chat. A provider returning
  429/401/403 is skipped for five minutes so a dead account does not slow every reply.
- Model names are overridable without a redeploy: `GEMINI_MODEL`, `OPENAI_MODEL`,
  `ANTHROPIC_MODEL`. Providers retire defaults (gemini-2.5-flash was closed to new keys), so this
  is the one-line fix instead of a function update.
- The browser sends the employee's persona plus the last eight turns; the function builds the system
  prompt server-side and calls the provider directly — no SDK, no key in the bundle.
- No key, or any failure, returns a non-2xx response. `requestEmployeeReply()` returns a failure
  with its reason and the app falls back to the scripted `replyFor()` templates, so chat always
  answers.
- The channel header says which mode it is in — `Live · gemini` / `Live · openai` or `Scripted` —
  and a scripted
  channel prints the reason above the composer (501 = no key, 401 = no session, 502 = provider
  refused). A silent fallback looked like the model answering, which cost an hour of debugging.
- Replies are written back through the normal `messages` table, so they are workspace-scoped and
  visible to every member.

### Running a task

The one piece of real execution. Assigning a task **starts it**: `addTask` inserts the row, then
calls the same runner the Play button uses, so the employee picks the work up without anyone
pressing Run. The card moves to *In progress* while the call is out and to *In review* when the
deliverable lands; the toast reports what came back. The Play button (or **Run task** in the detail
sheet) is now the retry, and it opens the sheet so the result has somewhere to appear.

Three cases start nothing, and each says which one it is:

- the workspace is paused for billing (`workspace_ai_locked`), so no tokens are spent;
- the employee is paused on the Team page;
- the task row never reached Postgres, so there would be nothing for the runner to read.

A run that fails (rate limit, provider error) hands the task back to *Backlog* rather than leaving a
card spinning in *In progress* — the next Run is a retry of something that never finished, not a
second delivery.

The runner itself (`supabase/functions/run-task`, JWT verification on) hands back finished work.

- The browser sends `{ workspaceId, taskId, employee }` only. The brief is read from `tasks` with
  the id **and** the workspace id, so a caller cannot have an employee deliver something that was
  never assigned to it, and the request body is never trusted for task text.
- Membership is checked first (`workspace_members`), and the check fails closed: if it cannot be
  answered the function returns `503 workspace_check_failed` rather than assuming a member.
- One run writes three rows: a `messages` entry from the employee, an `activities` entry
  (`kind: delivery`) for the feed, and `tasks.status = 'review'`. Nothing is auto-approved — a
  person still moves the card on.
- 20 runs per workspace per hour, counted from `activities` rather than memory so cold starts
  cannot reset the budget. Over the limit returns `429 rate_limited`.
- Same provider chain and cooldown as `employee-reply` (gemini → openai → anthropic), 20 s per
  attempt and 30 s overall. A failed run writes nothing: a half-written run would be worse than a
  refusal, so the first failed write returns `502 write_failed`.
- Errors are typed and the UI turns each into one plain sentence: `400 bad_request`,
  `401 not_authenticated`, `403 not_member`, `404 task_not_found`, `429 rate_limited`,
  `501 not_configured`, `502 provider_error | write_failed`, `503 workspace_check_failed`.
- The deliverable panel says where the text came from — `Deliverable · Live: gemini` or
  `Scripted`. The no-backend demo shows a template built from the brief and says in its first
  line that no model was called.

**What this is not:** it is synchronous and single-shot. There is no queue, no cron, no retry, no
background work, and no scheduling — one press produces one deliverable while the person waits.
Autonomous multi-step work belongs on top of this function (a queue plus a worker calling it), not
inside it, and nothing in the app claims otherwise.

### Billing (Stripe)

Billing is a *workspace* property, and Stripe is the only writer. Four edge functions, all inert
until the project has keys:

- `billing-status` — returns booleans only: which of the secrets below exist. The Billing page uses
  it to say exactly what is missing (`STRIPE_PRICE_SCALE_YEAR`, …) instead of a generic failure.
- `create-checkout-session` — takes `{ plan, interval }`, reads the caller from the JWT, and
  resolves their **active workspace** server-side. Requires `owner`/`admin` on it, refuses a
  workspace that is already subscribed (that person belongs in the portal), creates a Stripe
  customer once per workspace, and opens Checkout with the workspace id in `client_reference_id`,
  session and subscription metadata. Returns `{ url }` or a coded error.
- `billing-portal` — a Stripe-hosted portal session for the workspace's customer: cards, invoices,
  plan changes, cancellation. Card data never reaches this app or its database.
- `stripe-webhook` — verifies `stripe-signature` with HMAC-SHA256 and a five-minute tolerance
  (multiple `v1` signatures supported), records each event id in `stripe_events` so a retry is a
  no-op, then applies `checkout.session.completed`, `customer.subscription.created|updated|deleted`
  and `invoice.payment_failed`. Deploys with JWT verification **off** — the signature is the
  authentication.

Secrets (Project → Edge Functions → Secrets):

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_LAUNCH_MONTH  STRIPE_PRICE_LAUNCH_YEAR
STRIPE_PRICE_GROWTH_MONTH  STRIPE_PRICE_GROWTH_YEAR
STRIPE_PRICE_SCALE_MONTH   STRIPE_PRICE_SCALE_YEAR
```

`STRIPE_PRICE_LAUNCH` / `_GROWTH` / `_SCALE` are also accepted as the monthly names.

Setting it up in test mode, in order:

1. Stripe → Products: one product per plan with **two recurring prices** — Launch $12/mo and
   $10/mo billed yearly, Growth $55 and $44, Scale $199 and $159. Copy the six `price_…` ids.
2. Supabase → Project Settings → Edge Functions → Secrets: add `STRIPE_SECRET_KEY` (the
   `sk_test_…` key from Stripe → Developers → API keys) and the six price ids above.
3. Stripe → Developers → Webhooks → Add endpoint:
   `https://<project>.supabase.co/functions/v1/stripe-webhook`, events
   `checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`,
   `invoice.payment_failed`. Copy the `whsec_…` signing secret in as `STRIPE_WEBHOOK_SECRET`.
4. Reload `/dashboard/billing`. While anything is missing the page lists it under
   *Finish Stripe setup* (owner only) and checkout refuses before it reaches Stripe; once the
   secrets exist the same page shows *Stripe is connected* state and the buttons work.
5. `billing-status` answers the same question over HTTP if the page is not handy.

**The 3-day trial.** A new *account* gets three days free, once, and no more: `create-checkout-session`
sends `subscription_data[trial_period_days]=3`, so Stripe — not the UI — is the thing enforcing the
length. Because a trial is worthless without a card, the same call keeps
`payment_method_collection=always`: the card is taken when Checkout opens and is charged when the
three days end unless the customer cancels first.

The trial belongs to the person, not the workspace. The claim is `profiles.trial_started_at`, stamped
by `stripe-webhook` the first time any subscription with a `trial_end` arrives for that `user_id`, and
checked (with `=is.null`, so it can only be burned once) before a session ever asks for trial days.
Starting a second workspace therefore buys nothing, and neither does cancelling and re-subscribing.
While `subscription_status` is `trialing`, Billing shows the date the trial ends and that the card is
used then, and the plan card's button reads *Start 3-day free trial* — but only for an account that
still has one. `profiles.trial_started_at` is deliberately outside the client's column grants
(`revoke update, insert … grant update (name, company, role, plan, prefs, active_workspace_id)`), so a
signed-in user can still edit their profile but cannot clear the flag and farm another three days —
attempting it is a `42501` from Postgres. The number lives in two places on purpose (the edge function and `TRIAL_DAYS` in
`src/lib/billing.ts`), and a test pins `TRIAL_DAYS` to 3 so the interface cannot promise a trial
longer than the function grants.

Data model: `workspaces` gained `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`,
`billing_interval`, `current_period_end` and `cancel_at_period_end`. `plan` no longer has a default —
a plan is something Stripe said, not something assumed on insert, and `workspace_billing()` reads it
back for the current workspace. Clients can no longer write those columns: the table grant is
`update (name)` only, so an admin can rename a workspace but nobody can self-assign Scale.

**A failed payment pauses the team.** AI employees cost model tokens on every run, so a workspace
whose subscription is no longer `active` or `trialing` stops working. `public.workspace_ai_locked(uuid)`
is the single rule: a workspace with a `stripe_subscription_id` whose `subscription_status` is
`past_due`, `unpaid`, `canceled`, `incomplete`, `incomplete_expired` or `paused` is locked. It is
derived, never stored, so there is no flag to get out of sync with Stripe. A workspace that never
subscribed is untouched — the demo and the pre-checkout state still work.

Enforcement is in three places, deliberately:

- `run-task` and `employee-reply` answer `402 payment_required` before spending anything, and fail
  closed (`503`) if the billing state cannot be read. `run-task` explains it; `employee-reply` uses
  the request's `workspaceId`, falling back to the caller's active workspace, so omitting the field
  is not an escape hatch.
- Postgres refuses the write: `messages` (only `sender = 'employee'`) and `hires` carry a
  `BEFORE INSERT` trigger that raises `23514 ai_locked`. The browser holds the publishable key, so
  a client-side check alone would be decoration.
- The app says so plainly. A banner sits above every dashboard page, Billing shows the paused state
  with *Update payment method* (the Stripe portal), run buttons are disabled with a title, and a
  locked conversation stores your message but never fabricates an employee reply — the "Scripted"
  badge would be a lie there.

Nothing is deleted by a lock: tasks, threads, and delivered work stay readable, and paying again
unlocks the same team. Tasks can still be queued, because planning is free; only employee output is
stopped. Copy for each Stripe state lives in `lockExplanation()` in `src/lib/billing.ts`, and a test
pins `LOCKED_STATUSES` to the SQL list so the two cannot drift.

The Billing page shows only confirmed state: no plan means *no plan*, with no renewal date and no
invoices. While the keys are missing it names them. Returning from Checkout lands on
`/dashboard/billing?checkout=success`, which polls `workspace_billing()` for ~15s because the
webhook usually lands a moment after the redirect — if Stripe has not confirmed by then it says so
rather than pretending.

### Team seats

A workspace is a first-class thing now, not just one person's row.

- `workspaces` — name, owner, plan. `workspace_members` — who is in it and with what role
  (`owner` / `admin` / `member`). `workspace_invites` — pending invite links.
- `hires`, `tasks`, `messages` and `activities` carry a `workspace_id`; RLS is membership-based
  (`is_workspace_member(workspace_id)`), so everyone in a workspace sees the same AI workforce and
  the same queue. `profiles` additionally allows reading teammates in your workspace.
- `my_workspace()` returns the workspace you are currently looking at (`profiles.active_workspace_id`,
  falling back to your first membership). `ensure_workspace()` creates one on first sign-in, and the
  `handle_new_user` trigger does the same for every new account.
- **Invites are links, not emails.** An admin types an address in *Team → People with access*,
  the app creates an invite row and copies `…/invite/<token>` to the clipboard. Only the account
  with that exact email can redeem it (`accept_invite(token)`), and redeeming switches the
  workspace to the one they were invited to. Nothing is emailed — wire an SMTP provider before
  calling this production-ready.
- **Switching workspaces.** `my_workspaces()` lists every membership (name, role, member
  count) and the sidebar's workspace card becomes a menu when you belong to more than one;
  picking one calls `switch_workspace(id)`, which validates membership, stores the choice on
  `profiles.active_workspace_id` and refetches the workspace. Half of this already existed and
  was unreachable from the UI — you could be in two workspaces and only ever see one.
- **Creating workspaces.** `create_workspace(name)` inserts the workspace, makes the caller its
  `owner` and sets it active. The menu's *New workspace* row takes a name inline; the function
  trims it, rejects empty or 60+ character names, and caps an account at 10 workspaces. The
  sidebar menu therefore appears for every backend account, not only multi-workspace ones.
- **Leaving and the roster.** `leave_workspace(id)` lets anyone exit a workspace they were invited
  to. If the caller owns it, ownership passes to the oldest admin (else the oldest member) and that
  person is promoted, so a workspace can never be orphaned; the sole member is told to delete the
  workspace instead. `remove_member(id, user)` and `set_member_role(id, user, role)` are the
  server-side guards for the roster: admins can remove people, only the owner can change roles, and
  neither can touch the owner's row. The RLS policies on `workspace_members` were tightened to
  match, so an admin cannot demote or evict the owner with a direct table write either.
- **Invite roles.** The invite form picks `member` or `admin`, and only owners/admins see it at all
  (the insert policy already required that, so a plain member used to get a raw RLS error).
- **Renaming workspaces.** `rename_workspace(id, name)` trims the name and rejects empty or 60+
  character ones exactly like creation, and refuses anyone who is not an `owner` or `admin` of that
  workspace. Settings → *Workspace* renames the one you are in; the sidebar label follows.
- **Deleting workspaces.** `delete_workspace(id)` is owner-only and refuses to remove your only
  workspace — `ensure_workspace()` would otherwise quietly recreate a shell on your next sign-in.
  Everything workspace-scoped cascades (hires, tasks, messages, activities, invites, the roster)
  and the caller is moved to their oldest remaining workspace; teammates whose profile pointed at
  the deleted workspace fall back through `my_workspace()`. The danger zone makes you type the
  workspace name before the button enables.
- Settings reports your role, members and hires instead of a plan; it used to print
  **“Plan · Growth · monthly”** for an account that never checked out.
- The sidebar card shows seats and people, never a plan name: `workspaces.plan` defaults to
  `growth` for every new row whether or not anyone paid, so the only screen that mentions a tier is
  Billing, where the copy says plainly that Stripe is not connected.

### Demo access

A fully local demo workspace ships with the build, so you can look around without creating an account.

- **Sign in:** `demo@nexora.ai` / `demo1234`, or press **“Continue with the demo workspace.”**
  This account always uses the seeded local workspace, even when Supabase is configured.
- **Sign up:** any valid email + an 8-character password creates a real Supabase account with an
  empty workspace (honest empty states), or a local one when no backend is configured.
- Hiring from a profile while signed out carries the intent through signup, so the employee lands
  on your team immediately after account creation.

State lives in `localStorage`:

- `nexora.auth.v1` — session/profile
- `nexora.workspace.v2` — hires, tasks, conversations, activity
- `nexora.pendingHire` (session) — hire intent across auth

Use **Settings → Reset demo workspace** to restore the seeded team.

---

### Security and isolation

Every table is behind row level security keyed on workspace membership (`is_workspace_member`), and
no client role holds a grant on a billing column: `plan`, `status`, the Stripe ids and the period
end are written only by `stripe-webhook` through the service role, and a trigger
(`guard_workspace_billing`) rejects an insert or update that carries them from a browser. The trial
flag lives on `profiles.trial_started_at`, which is not in the client's insert or update grants.

The hourly ceilings — 20 runs, 60 replies, 20 invites per workspace — are counted from
`usage_events`, a table with row level security and no policies: the service role writes it and no
client can read, write or trim it. Counting them from `activities`, `messages` or
`workspace_invites` meant deleting a row reset the budget.

The roster moves through `set_member_role`, `remove_member`, `accept_invite` and `leave_workspace`
(security definer, each with its own owner-only rules). `authenticated` holds no insert or update
grant on `workspace_members`, so those rules cannot be sidestepped with a direct table write.

`supabase/migrations/20261101000000_audit_hardening.sql` is the state of those grants and that
ledger as applied.

### Seats, and what a plan actually buys

The pricing page says one AI employee on Launch, five on Growth, unlimited on Scale. That is now a
database rule, not a suggestion in the UI: a trigger on `hires` (`enforce_seat_limit`) reads the
plan and refuses the row past the allowance with `42501 seat_limit_reached`. The mapping lives in
`plan_seat_limit()`, a workspace with no plan yet is uncapped (there is no tier to enforce — the
hourly run ceiling still bounds its spend), and any plan string the app does not recognise fails
closed at one rather than falling through to unlimited. `workspace_billing()` returns the allowance
and the count, so nothing in the app hardcodes a number the database would not enforce.

`supabase/migrations/20261101010000_seat_limits_and_brief_verification.sql` is that cap.

### Checking the work against the brief

`run-task` does not accept a deliverable on faith. Before writing it back it applies rules to the
text — empty or placeholder drafts, a figure the brief never supplied, quoted wording that was
dropped, a list that was asked for and not written, a word ceiling that was blown — and then asks a
second model, preferring a different provider from the one that wrote the draft, whether the draft
actually does what the task asked. A draft only passes when both agree; when the reader cannot be
reached the verdict is `unverified`, never `passes`. If the first draft fails, one repair pass is
made with the failures named in the prompt and the better of the two drafts is kept.

The verdict is stored on the task (`verification`, `verification_status`, `verified_at`) and shown
in the task sheet as **Brief check**. Members can read those columns and cannot write them: only the
service role records a check, so a browser cannot mark its own work as passing. The rules are pure
functions in `supabase/functions/run-task/index.ts`, imported directly by
`src/test/briefCheck.test.ts`.

## Deploying

Live on Vercel as `nexora-ai-employees` → **https://nexora-ai-employees.vercel.app**.

- Framework preset Vite, build `npm run build`, output `dist`; `vercel.json` carries the SPA
  rewrite plus immutable caching for `/assets` and a week for `/team`.
- Set `VITE_SUPABASE_URL` and either `VITE_SUPABASE_ANON_KEY` or
  `VITE_SUPABASE_PUBLISHABLE_KEY` in the project (the second is what Vercel's Supabase
  integration creates).
- `VITE_SITE_URL` sets the host used for `sitemap.xml`, `robots.txt`, canonical and social tags.
  It defaults to the production alias above — set it once a custom domain exists.
- `sitemap.xml`, `robots.txt` and **one HTML file per route** are generated at build time from
  `src/data/routes.ts`. `/dashboard`, `/invite` and the password pages are excluded from the
  sitemap, disallowed in `robots.txt`, and served with `noindex, nofollow` in the HTML itself.
- Each route's `dist/<path>/index.html` carries that route's title, description, canonical and
  social tags. The app is still a single-page app, but a crawler that never runs JavaScript now gets
  the right head — the dashboard pages get `noindex` — instead of one generic title on every URL.
- **Social cards** live in `public/og/`, one per route, named after its path. They are generated by
  `npm run og` (`scripts/og.mjs`) from the same data the pages render and then committed, so the
  Vercel build needs neither the rasteriser nor the fonts. Regenerate after renaming an employee,
  editing a guide summary or adding a route —
  `src/test/app.test.tsx` fails if a public route points at a card that does not exist.

## Project structure

```
public/
  favicon.svg
  robots.txt
  team/*.jpg              # 8 editorial AI-employee portraits (640², optimised)
src/
  App.tsx                 # routes, route metadata, error boundary
  index.css               # Tailwind v4 theme tokens + primitives (panel, buttons, reveal…)
  components/
    ui/                   # Button, Logo, Avatar, Field, Accordion, Reveal, SectionHeading, BackButton
    marketing/            # Navbar, Footer, layout, ambient AI-OS background, hero floating cards,
                          # app preview, phone showcase, perks band, employee cards, CTA, auth shell
    dashboard/            # dashboard layout, protected route, charts, assign-task modal, primitives
    ErrorBoundary.tsx
  context/
    AuthContext.tsx       # auth state, profile, password recovery
    WorkspaceContext.tsx  # hires, tasks, messages, activity, analytics helpers
  data/
    employees.ts          # 8 richly modelled AI employees
    site.ts               # plans, comparison, FAQs, testimonials, logos, stats
  lib/                    # cn, currency, hire intent, file downloads
scripts/
  og.mjs                  # renders public/og/*.png from the route table (npm run og)
  og/fonts/               # Sora + Inter, SIL OFL, registered through fontconfig
  pages/                  # marketing pages, auth pages, 404
  pages/dashboard/        # overview, team, tasks, conversations, analytics, billing, settings
  test/                   # Vitest setup + route/interaction tests
```

---

## Design system

Tokens live in the `@theme` block of `src/index.css`:

- **Canvas** deep teal-black `#051718` → **surface** `#092128` → **panel** `#0a252c`
- **Accent** emerald `#0bd39a`, with mint `#12e3c0`, soft `#9df7c2` and deep `#06795a`. It is used
  sparingly: live dots, active states, chart marks, one highlighted phrase per section. Primary
  buttons stay near-white with ink text rather than an accent fill.
- **Token aliases are decorative names now.** `--color-blue`, `--color-violet`, `--color-lime`,
  `--color-ember` and `--color-olive` are all remapped onto the teal values above, so old utility
  class names keep working. There is no lime (`#c8f060`) and no blue-violet cast left in the theme —
  do not reintroduce either.
- **Borders and text** are cool on the teal canvas: hairlines `rgba(186,255,228,0.1)`, text ramp from
  `#eef7f5` (white token) down through `#b9c9cf`/`#8d9ea7`.
- **Section wash** every page section paints `.page-section` — `rgba(255, 255, 255, 0.03)` on the
  canvas, so the glass has depth without lifting the page off its near-black. The rule behind that
  value is a white wash at low alpha (`rgba(255,255,255,0.1)` is the ceiling); never retint it blue or
  emerald, and do not raise the alpha without looking at every section.
- **Type** Sora (display) / Inter (UI) / JetBrains Mono (labels & data)
- **Primitives** `.glass` / `.glass-strong` (translucent, blurred surfaces), `.panel`, `.panel-hover`,
  `.card-sheen`, `.eyebrow`, `.bg-grid`, `.mask-fade-*`, `.reveal`, `.text-gradient`
- Depth comes from frosted glass (34–44px backdrop blur, 185–195% saturation), layered emerald/teal aurora glows, drifting particles and a masked hairline grid, 1px inset
  highlights, layered gradients, conic light rings, and low-opacity white borders rather than heavy
  shadows. Signature surfaces: `.panel-accent` (graphite card with an
  emerald hairline), `.ring-glow`, and `.neon-line`. The marketing header is a compact 52–56px floating
  glass bar.
- Motion is restrained: scroll reveals (IntersectionObserver), marquee, float, typing dots, and a
  full `prefers-reduced-motion` fallback.

Accessibility: semantic landmarks, visible focus rings, `aria-pressed`/`aria-expanded` on toggles,
labelled form fields and icon buttons, keyboard-operable tabs/modals/kanban, and AA-contrast body
text on the dark canvas.

---

## Production notes

- **Auth, persistence, replies, invites and billing are real** — `supabase.auth`, workspace-scoped
  tables, and the `employee-reply`, `invite-member`, `run-task`, `create-checkout-session`,
  `billing-portal` and `stripe-webhook` edge functions.
- **Billing is built but inert until the Stripe secrets exist** (see *Billing (Stripe)* above). That
  is the one seam: with no `STRIPE_*` secrets, checkout answers `501 not_configured` and the Billing
  page names what is missing instead of pretending.
- **Email needs a real sender.** Signup is auto-confirmed, but invites and password resets go through
  Supabase's shared mailer (a couple of messages an hour, often spam) until custom SMTP is set —
  `supabase/email-templates/README.md` has the fields and the templates.
- **Only the publishable key ships.** It is safe in a browser bundle; RLS is what protects the data.
- **No secrets or network calls** are required to run the app — without env vars it is fully local.
- **Vercel:** `vercel.json` is included with SPA rewrites and asset caching; `npm run build` outputs
  a static `dist/`.
- **Performance:** ~102 kB gzipped for the app shell; the Supabase SDK (~59 kB gzipped) is a
  separate chunk that only loads on an auth action, every route below Home is lazy, and likely
  routes are prefetched on hover/idle. Portraits are self-hosted and lazy-loaded.

### Sensible next steps

1. **Stripe secrets, then live mode.** The seven secrets in *Billing (Stripe)*, a test-mode buy-through,
   then `sk_live_…` plus the six live price ids and a live webhook endpoint.
2. **Custom SMTP**, so invites and password resets are not throttled by the shared mailer.
3. **A custom domain.** Add it in Vercel, set `VITE_SITE_URL` and redeploy, and — easy to miss — add
   the new origin to Supabase → Authentication → URL configuration (`site_url` + redirect allow
   list), or invite and recovery links keep pointing at the vercel.app host.
4. **Streaming replies.** Conversations wait for the whole reply; SSE would make it feel immediate.
5. **Background execution.** `run-task` is synchronous and single-shot by design; a queue is the next
   step if runs ever take longer than a request.
