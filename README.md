# Nexora — AI Employees

A production-quality front-end for **Nexora**, a platform where teams hire AI employees for
sales, support, marketing, operations, finance, and people. Built as a complete product
experience: marketing site, catalogue, employee profiles, pricing, auth, and an authenticated
workspace with a working demo of the product.

> Design direction: **Nexora AI OS** — Apple Vision Pro meets a futuristic SaaS command center.
> Deep-space canvas (`#0a0c11`) with electric-blue (`#4d8dff`) and violet (`#8b5cf6`) aurora layers,
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
| `/dashboard`              | Authenticated overview: KPIs, delivery chart, live activity, team, approval queue, assign-task modal |
| `/dashboard/team`         | Employee cards with pause/resume, remove, utilisation, team economics             |
| `/dashboard/tasks`        | Kanban board with drag & drop, filters, task detail, assign-task flow            |
| `/dashboard/conversations`| Team chat with canned AI replies, typing indicator, suggestion prompts           |
| `/dashboard/analytics`    | Charts, department mix, employee scorecard, CSV export, insights                 |
| `/dashboard/billing`      | Plan, usage meters, payment method, invoices (downloadable), plan switching      |
| `/dashboard/settings`     | Profile, workspace preferences, security, reset demo, sign out                   |
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
npm test           # Vitest + Testing Library (10 tests)
npm run test:watch
```

Requirements: Node 20+ (developed on Node 22).

### Demo access

This build ships with a fully local demo workspace — no backend, no real accounts.

- **Sign in:** `demo@nexora.ai` / `demo1234`, or press **“Continue with the demo workspace.”**
- **Sign up:** any valid email + an 8-character password creates a local workspace.
- Hiring from a profile while signed out carries the intent through signup, so the employee lands
  on your team immediately after account creation.

State lives in `localStorage`:

- `nexora.auth.v1` — session/profile
- `nexora.workspace.v2` — hires, tasks, conversations, activity
- `nexora.pendingHire` (session) — hire intent across auth

Use **Settings → Reset demo workspace** to restore the seeded team.

---

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
    AuthContext.tsx       # mock auth with persistence
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

- **Canvas** near-black `#0a0c11` → **surface** `#121620` → **panel** `#151a24`
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
- Depth comes from frosted glass (34–44px backdrop blur, 185–195% saturation), layered blue/violet aurora glows, drifting particles and a masked hairline grid, 1px inset
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

- **Auth and AI responses are simulated.** `AuthContext`, `WorkspaceContext`, and `replyFor()` are
  the seams to replace with a real API (Supabase is a natural fit: auth + tables for hires/tasks/
  messages, plus an edge function for employee replies).
- **No secrets or network calls** are required to run the app.
- **Vercel:** `vercel.json` is included with SPA rewrites and asset caching; `npm run build` outputs
  a static `dist/`.
- **Performance:** single JS bundle (~123 kB gzipped), self-hosted portrait assets, lazy-loaded
  images, and no runtime CSS-in-JS.

### Sensible next steps

1. Replace mock auth with Supabase Auth and add org/role tables.
2. Plumb `WorkspaceContext` to Postgres with optimistic updates.
3. Stream real employee responses (SSE) into Conversations.
4. Add Stripe Checkout for the three plans.
5. Add per-route Open Graph images and a sitemap once a production domain is chosen.
