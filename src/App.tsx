import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { MarketingLayout, ScrollToTop } from '@/components/marketing/MarketingLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { RequireAuth } from '@/components/dashboard/RequireAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BackButton } from '@/components/ui/BackButton';
import { RouteFallback } from '@/components/ui/RouteFallback';
import { prefetchLikelyRoutes } from '@/lib/prefetch';
import { Home } from '@/pages/Home';

const Employees = lazy(() => import('@/pages/Employees').then((m) => ({ default: m.Employees })));
const EmployeeDetail = lazy(() => import('@/pages/EmployeeDetail').then((m) => ({ default: m.EmployeeDetail })));
const HowItWorks = lazy(() => import('@/pages/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const Pricing = lazy(() => import('@/pages/Pricing').then((m) => ({ default: m.Pricing })));
const Resources = lazy(() => import('@/pages/Resources').then((m) => ({ default: m.Resources })));
const ResourceArticle = lazy(() => import('@/pages/ResourceArticle').then((m) => ({ default: m.ResourceArticle })));
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Signup = lazy(() => import('@/pages/Signup').then((m) => ({ default: m.Signup })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));
const Invite = lazy(() => import('@/pages/Invite').then((m) => ({ default: m.Invite })));


const Overview = lazy(() => import('@/pages/dashboard/Overview').then((m) => ({ default: m.Overview })));
const Team = lazy(() => import('@/pages/dashboard/Team').then((m) => ({ default: m.Team })));
const Tasks = lazy(() => import('@/pages/dashboard/Tasks').then((m) => ({ default: m.Tasks })));
const Conversations = lazy(() => import('@/pages/dashboard/Conversations').then((m) => ({ default: m.Conversations })));
const Analytics = lazy(() => import('@/pages/dashboard/Analytics').then((m) => ({ default: m.Analytics })));
const Billing = lazy(() => import('@/pages/dashboard/Billing').then((m) => ({ default: m.Billing })));
const Settings = lazy(() => import('@/pages/dashboard/Settings').then((m) => ({ default: m.Settings })));

const DEFAULT_DESCRIPTION =
  'Intelligent AI employees that plug into your stack, learn your playbook, and deliver finished work — 24/7.';

const routes: { match: RegExp; title: string; description: string }[] = [
  { match: /^\/$/, title: 'Your AI employees, always working', description: DEFAULT_DESCRIPTION },
  {
    match: /^\/employees\/?$/,
    title: 'AI Employees',
    description:
      'Eight specialised AI employees across sales, support, marketing, operations, finance and people. Compare deliverables, playbooks and pricing.',
  },
  {
    match: /^\/employees\/[^/]+$/,
    title: 'AI Employee',
    description:
      'See what this AI employee delivers, the tools they connect to, and how they work inside your team.',
  },
  {
    match: /^\/how-it-works$/,
    title: 'How it works',
    description:
      'How Nexora hires, trains and supervises AI employees — integrations, approvals, security and data handling.',
  },
  {
    match: /^\/pricing$/,
    title: 'Pricing',
    description:
      'Flat monthly pricing from $12. Every plan includes playbooks, integrations, approvals and unlimited human seats.',
  },
  {
    match: /^\/resources$/,
    title: 'Resources',
    description:
      'Playbooks and field notes on running AI employees: briefs, onboarding, and measuring return.',
  },
  {
    match: /^\/resources\/[^/]+$/,
    title: 'Resources',
    description: 'A practical guide to running AI employees inside a real team.',
  },
  { match: /^\/login$/, title: 'Sign in', description: 'Sign in to your Nexora workspace.' },
  {
    match: /^\/invite\/[^/]+$/,
    title: 'Join a workspace',
    description: 'Accept an invite to a Nexora workspace.',
  },
  {
    match: /^\/signup$/,
    title: 'Create your workspace',
    description: 'Create a Nexora workspace and hire your first AI employee in minutes.',
  },
  { match: /^\/dashboard\/?$/, title: 'Dashboard', description: 'Your AI workforce at a glance.' },
  { match: /^\/dashboard\/team$/, title: 'My team', description: 'Your hired AI employees.' },
  { match: /^\/dashboard\/tasks$/, title: 'Tasks', description: 'The work queue for your AI employees.' },
  { match: /^\/dashboard\/conversations$/, title: 'Conversations', description: 'Talk to your AI employees.' },
  { match: /^\/dashboard\/analytics$/, title: 'Analytics', description: 'What your AI workforce delivers.' },
  { match: /^\/dashboard\/billing$/, title: 'Billing', description: 'Plan, seats and invoices.' },
  { match: /^\/dashboard\/settings$/, title: 'Settings', description: 'Workspace settings.' },
];

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

/**
 * Client-side equivalent of what a crawler needs: one canonical URL, a description and
 * social tags per route, and `noindex` on everything behind the auth gate.
 */
function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const entry = routes.find((route) => route.match.test(pathname));
    const title = entry ? `${entry.title} · Nexora` : 'Page not found · Nexora';
    const description = entry?.description ?? DEFAULT_DESCRIPTION;
    const origin = (import.meta.env.VITE_SITE_URL ?? window.location.origin).replace(/\/+$/, '');
    const url = `${origin}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`;
    const isPrivate = pathname.startsWith('/dashboard') || pathname.startsWith('/invite');

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'robots', isPrivate ? 'noindex, nofollow' : 'index, follow');
    setCanonical(url);
  }, [pathname]);

  return null;
}

export default function App() {
  useEffect(() => {
    prefetchLikelyRoutes();
  }, []);

  return (
    <AuthProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <ScrollToTop />
          <RouteMeta />
          <BackButton />
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
            <Routes>
            <Route element={<MarketingLayout />}>
              <Route index element={<Home />} />
              <Route path="employees" element={<Employees />} />
              <Route path="employees/:slug" element={<EmployeeDetail />} />
              <Route path="how-it-works" element={<HowItWorks />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="resources" element={<Resources />} />
              <Route path="resources/:slug" element={<ResourceArticle />} />
            </Route>

            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />

            <Route element={<RequireAuth />}>
              <Route path="invite/:token" element={<Invite />} />
              <Route path="dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="team" element={<Team />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="conversations" element={<Conversations />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="billing" element={<Billing />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
