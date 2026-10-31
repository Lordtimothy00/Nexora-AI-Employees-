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

The one piece of real execution: the Play button on a task card (or **Run task** in the detail
sheet) calls the `run-task` edge function (`supabase/functions/run-task`, JWT verification on) and
the employee hands back finished work.

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

**The 3-day trial.** A workspace that has never held a subscription gets three days free and no
more: `create-checkout-session` sends `subscription_data[trial_period_days]=3`, so Stripe — not the
UI — is the thing enforcing the length. Because a trial is worthless without a card, the same call
keeps `payment_method_collection=always`: the card is taken when Checkout opens and is charged when
the three days end unless the customer cancels first. It is granted once per workspace —
`stripe_subscription_id` survives a cancellation, so a returning workspace is charged from its first
invoice instead of farming trials. While `subscription_status` is `trialing`, Billing shows the date
the trial ends and that the card is used then, and the plan card's button reads *Start 3-day free
trial*. The number lives in two places on purpose (the edge function and `TRIAL_DAYS` in
`src/lib/billing.ts`), and a test pins `TRIAL_DAYS` to 3 so the interface cannot promise a trial
longer than the function grants.

Data model: `workspaces` gained `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`,
`billing_interval`, `current_period_end` and `cancel_at_period_end`. `plan` no longer has a default —
a plan is something Stripe said, not something assumed on insert, and `workspace_billing()` reads it
back for the current workspace. Clients can no longer write those columns: the table grant is
`update (name)` only, so an admin can rename a workspace but nobody can self-assign Scale.

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

## Deploying

Live on Vercel as `nexora-ai-employees` → **https://nexora-ai-employees.vercel.app**.

- Framework preset Vite, build `npm run build`, output `dist`; `vercel.json` carries the SPA
  rewrite plus immutable caching for `/assets` and a week for `/team`.
- Set `VITE_SUPABASE_URL` and either `VITE_SUPABASE_ANON_KEY` or
  `VITE_SUPABASE_PUBLISHABLE_KEY` in the project (the second is what Vercel's Supabase
  integration creates).
- `VITE_SITE_URL` sets the host used for `sitemap.xml`, `robots.txt`, canonical and social tags.
  It defaults to the production alias above — set it once a custom domain exists.
- `sitemap.xml` and `robots.txt` are generated at build time from the route list in
  `vite.config.ts`; `/dashboard` is excluded and disallowed.

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
  pages/                  # marketing pages, auth pages, 404
  pages/dashboard/        # overview, team, tasks, conversations, analytics, billing, settings
  test/                   # Vitest setup + route/interaction tests
```

---

## Design system

Tokens live in the `@theme` block of `src/index.css`:

- **Canvas** deep teal-black `#051718` → **surface** `#092128` → **panel** `#0a252c`
- **Monochrome** cool-slate surfaces, silver borders (`rgba(226,236,247,0.10)`) and a near-white
  text ramp from `#f6f8fa` down to `#5f666d`
- **Single accent** lime `#c8f060` (soft `#e2fa9e`, deep `#8fae2f`), used sparingly: live dots,
  active states, chart marks, one highlighted phrase per section. Primary buttons are near-white
  with ink text rather than an accent fill.
- **Secondary accents** are deliberately desaturated silver (`#d3d5cd`, `#b9bcb4`, `#c8cac2`) so the
  UI reads as monochrome
- **Type** Sora (display) / Inter (UI) / JetBrains Mono (labels & data)
- **Primitives** `.glass` / `.glass-strong` (translucent, blurred surfaces), `.panel`, `.panel-hover`,
  `.card-sheen`, `.eyebrow`, `.bg-grid`, `.mask-fade-*`, `.reveal`, `.text-gradient`
- Depth comes from frosted glass (34–44px backdrop blur, 185–195% saturation), layered emerald/teal aurora glows, drifting particles and a masked hairline grid, 1px inset
  highlights, layered gradients, conic light rings, and low-opacity white borders rather than heavy
  shadows. Signature surfaces: `.panel-accent` (graphite card with a
  lime hairline), `.ring-glow`, and `.neon-line`. The marketing header is a compact 52–56px floating
  glass bar.
- Motion is restrained: scroll reveals (IntersectionObserver), marquee, float, typing dots, and a
  full `prefers-reduced-motion` fallback.

Accessibility: semantic landmarks, visible focus rings, `aria-pressed`/`aria-expanded` on toggles,
labelled form fields and icon buttons, keyboard-operable tabs/modals/kanban, and AA-contrast body
text on the dark canvas.

---

## Production notes

- **Auth, persistence, replies and invites are real** — `supabase.auth`, workspace-scoped tables,
  and the `employee-reply` / `invite-member` edge functions. Email deliverability needs custom SMTP
  (`supabase/email-templates/README.md`), and Billing/Stripe is the remaining seam.
- **Only the publishable key ships.** It is safe in a browser bundle; RLS is what protects the data.
- **No secrets or network calls** are required to run the app — without env vars it is fully local.
- **Vercel:** `vercel.json` is included with SPA rewrites and asset caching; `npm run build` outputs
  a static `dist/`.
- **Performance:** ~102 kB gzipped for the app shell; the Supabase SDK (~59 kB gzipped) is a
  separate chunk that only loads on an auth action, every route below Home is lazy, and likely
  routes are prefetched on hover/idle. Portraits are self-hosted and lazy-loaded.

### Sensible next steps

1. Stream real employee responses (SSE) into Conversations.
2. Add Stripe Checkout for the three plans.
3. Add per-route Open Graph images and a sitemap once a production domain is chosen.
4. Add team/seat sharing (multi-member orgs) on top of the current per-user RLS model.
