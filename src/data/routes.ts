import { employees } from './employees.ts';
import { guides } from './resources.ts';

/**
 * One table for the title, description, social card and indexability of every route.
 *
 * Three consumers read it, which is why it lives outside `App.tsx`: the router (runtime meta as you
 * navigate), the build (a static HTML file per public route, so a crawler that never runs JavaScript
 * still sees the right title), and `scripts/og.mjs` (one card image per route). Paths are concrete —
 * the eight employees and three guides are listed individually rather than as patterns — because
 * only concrete paths can be prerendered or given their own image.
 */
export interface RouteMeta {
  /** The concrete path, no trailing slash. */
  path: string;
  /** Page title without the `· Nexora` suffix. */
  title: string;
  description: string;
  /** Social card, relative to the site root. Written by `npm run og`. */
  image: string;
  /** Which layout the card is drawn in. */
  card: 'default' | 'employee' | 'guide';
  /** Behind the auth gate or holding a token: never in the sitemap, noindex at runtime. */
  private?: boolean;
}

export const DEFAULT_DESCRIPTION =
  'Intelligent AI employees that plug into your stack, learn your playbook, and deliver finished work — 24/7.';

/**
 * The card that belongs to a path. Kept as a function so the router, the build and the image script
 * cannot disagree about where a route's picture lives.
 */
export function ogImageFor(path: string) {
  const slug = path === '/' ? 'home' : path.replace(/^\/+/, '').replace(/\/+/g, '-');
  return `/og/${slug}.png`;
}

function route(
  path: string,
  title: string,
  description: string,
  card: RouteMeta['card'] = 'default',
  isPrivate = false,
): RouteMeta {
  return { path, title, description, image: ogImageFor(path), card, ...(isPrivate ? { private: true } : {}) };
}

export const routeMeta: RouteMeta[] = [
  route('/', 'Your AI employees, always working', DEFAULT_DESCRIPTION),
  route(
    '/employees',
    'AI Employees',
    'Eight specialised AI employees across sales, support, marketing, operations, finance and people. Compare deliverables, playbooks and pricing.',
  ),
  ...employees.map((employee) =>
    route(
      `/employees/${employee.slug}`,
      `${employee.name} — ${employee.role}`,
      employee.tagline,
      'employee',
    ),
  ),
  route(
    '/how-it-works',
    'How it works',
    'How Nexora hires, trains and supervises AI employees — integrations, approvals, security and data handling.',
  ),
  route(
    '/pricing',
    'Pricing',
    'Flat monthly pricing from $12. Every plan includes playbooks, integrations, approvals and unlimited human seats.',
  ),
  route(
    '/resources',
    'Resources',
    'Playbooks and field notes on running AI employees: briefs, onboarding, and measuring return.',
  ),
  ...guides.map((guide) =>
    route(`/resources/${guide.slug}`, guide.title, guide.summary, 'guide'),
  ),
  route('/login', 'Sign in', 'Sign in to your Nexora workspace.'),
  route('/signup', 'Create your workspace', 'Create a Nexora workspace and hire your first AI employee in minutes.'),
  route('/forgot-password', 'Reset your password', 'Get a single-use link to choose a new Nexora password.', 'default', true),
  route('/reset-password', 'Choose a new password', 'Finish resetting your Nexora password.', 'default', true),
  route('/dashboard', 'Dashboard', 'Your AI workforce at a glance.', 'default', true),
  route('/dashboard/team', 'My team', 'Your hired AI employees.', 'default', true),
  route('/dashboard/tasks', 'Tasks', 'The work queue for your AI employees.', 'default', true),
  route('/dashboard/conversations', 'Conversations', 'Talk to your AI employees.', 'default', true),
  route('/dashboard/analytics', 'Analytics', 'What your AI workforce delivers.', 'default', true),
  route('/dashboard/billing', 'Billing', 'Plan, seats and payments.', 'default', true),
  route('/dashboard/settings', 'Settings', 'Workspace settings.', 'default', true),
];

/** Everything that belongs in the sitemap and gets its own HTML file at build time. */
export const publicRoutes = routeMeta.filter((entry) => !entry.private);

// Fallbacks exist for paths that are not in the table (an old slug, a mistyped link). They reuse a
// card that does exist rather than pointing at one nothing generates.
const genericEmployee: RouteMeta = {
  ...route(
    '/employees/ai-employee',
    'AI Employee',
    'See what this AI employee delivers, the tools they connect to, and how they work inside your team.',
    'employee',
    true,
  ),
  image: ogImageFor('/employees'),
};

const genericGuide: RouteMeta = {
  ...route(
    '/resources/guide',
    'Resources',
    'A practical guide to running AI employees inside a real team.',
    'guide',
    true,
  ),
  image: ogImageFor('/resources'),
};

const invite = route('/invite', 'Join a workspace', 'Accept an invite to a Nexora workspace.', 'default', true);

const notFound: RouteMeta = {
  ...route('/404', 'Page not found', DEFAULT_DESCRIPTION, 'default', true),
  image: ogImageFor('/'),
};

/**
 * Metadata for whatever the router is showing. Exact paths win; then the dynamic shapes
 * (`/employees/:slug`, `/resources/:slug`, `/invite/:token`); anything else is the 404, which must
 * never be indexed.
 */
export function routeFor(pathname: string): RouteMeta {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const exact = routeMeta.find((entry) => entry.path === clean);
  if (exact) return exact;
  if (/^\/employees\/[^/]+$/.test(clean)) return genericEmployee;
  if (/^\/resources\/[^/]+$/.test(clean)) return genericGuide;
  if (/^\/invite\/[^/]+$/.test(clean)) return invite;
  if (clean.startsWith('/dashboard')) return { ...notFound, title: 'Dashboard', description: 'Your AI workforce at a glance.' };
  return notFound;
}
