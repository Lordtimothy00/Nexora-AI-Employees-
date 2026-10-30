# Nexora — AI Employees

A production-quality front-end for **Nexora**, a platform where teams hire AI employees for
sales, support, marketing, operations, finance, and people. Built as a complete product
experience: marketing site, catalogue, employee profiles, pricing, auth, and an authenticated
workspace with a working demo of the product.

> Design direction: cinematic neon fintech. Espresso-black canvas (`#0b0402`), a vibrant ember
> gradient system (`#ff9a4d → #dd6816 → #c02c0a`) with an olive accent (`#b5b56f`), glass panels,
> aurora and conic lighting, Sora display type, Inter UI type, and warm editorial portraits for the
> AI roster. Inspired by premium dark banking interfaces.

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
    ui/                   # Button, Logo, Avatar, Field, Accordion, Reveal, SectionHeading
    marketing/            # Navbar, Footer, layout, hero preview, phone showcase, perks band, cards, CTA, auth shell
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

- **Canvas** espresso `#0b0402` → **surface** `#180b07` → **panel** `#1a0c07`
- **Ember system** `#ff9a4d` → `#dd6816` → `#c02c0a` (buttons, glow, charts)
- **Accents** peach `#ffa15c`, olive `#b5b56f`, gold `#e9b45f`, clay `#e08a48`, coral `#e2593f`
- **Warm neutrals** cream `#fff4ec` (all `white` utilities) and taupe text ramp from `#ead8cd` to `#8a7365`
- **Type** Sora (display) / Inter (UI) / JetBrains Mono (labels & data)
- **Primitives** `.panel`, `.panel-hover`, `.card-sheen`, `.eyebrow`, `.bg-grid`, `.mask-fade-*`,
  `.reveal`, `.text-gradient`
- Depth comes from 1px inset highlights, layered gradients, conic light rings, and low-opacity
  warm borders rather than heavy shadows. Signature surfaces: `.panel-ember` (neon gradient card),
  `.ring-glow`, and `.neon-line`.
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
