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


const Overview = lazy(() => import('@/pages/dashboard/Overview').then((m) => ({ default: m.Overview })));
const Team = lazy(() => import('@/pages/dashboard/Team').then((m) => ({ default: m.Team })));
const Tasks = lazy(() => import('@/pages/dashboard/Tasks').then((m) => ({ default: m.Tasks })));
const Conversations = lazy(() => import('@/pages/dashboard/Conversations').then((m) => ({ default: m.Conversations })));
const Analytics = lazy(() => import('@/pages/dashboard/Analytics').then((m) => ({ default: m.Analytics })));
const Billing = lazy(() => import('@/pages/dashboard/Billing').then((m) => ({ default: m.Billing })));
const Settings = lazy(() => import('@/pages/dashboard/Settings').then((m) => ({ default: m.Settings })));

const routeTitles: { match: RegExp; title: string }[] = [
  { match: /^\/$/, title: 'Your AI employees, always working' },
  { match: /^\/employees\/?$/, title: 'AI Employees' },
  { match: /^\/employees\/[^/]+$/, title: 'AI Employee' },
  { match: /^\/how-it-works$/, title: 'How it works' },
  { match: /^\/pricing$/, title: 'Pricing' },
  { match: /^\/resources$/, title: 'Resources' },
  { match: /^\/resources\/[^/]+$/, title: 'Resources' },
  { match: /^\/login$/, title: 'Sign in' },
  { match: /^\/signup$/, title: 'Create your workspace' },
  { match: /^\/dashboard\/?$/, title: 'Dashboard' },
  { match: /^\/dashboard\/team$/, title: 'My team' },
  { match: /^\/dashboard\/tasks$/, title: 'Tasks' },
  { match: /^\/dashboard\/conversations$/, title: 'Conversations' },
  { match: /^\/dashboard\/analytics$/, title: 'Analytics' },
  { match: /^\/dashboard\/billing$/, title: 'Billing' },
  { match: /^\/dashboard\/settings$/, title: 'Settings' },
];

function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const entry = routeTitles.find((route) => route.match.test(pathname));
    document.title = entry ? `${entry.title} · Nexora` : 'Page not found · Nexora';
  }, [pathname]);

  return null;
}

export default function App() {
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
