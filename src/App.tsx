import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { MarketingLayout, ScrollToTop } from '@/components/marketing/MarketingLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { RequireAuth } from '@/components/dashboard/RequireAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BackButton } from '@/components/ui/BackButton';
import { Home } from '@/pages/Home';
import { Employees } from '@/pages/Employees';
import { EmployeeDetail } from '@/pages/EmployeeDetail';
import { HowItWorks } from '@/pages/HowItWorks';
import { Pricing } from '@/pages/Pricing';
import { Resources } from '@/pages/Resources';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { NotFound } from '@/pages/NotFound';
import { Overview } from '@/pages/dashboard/Overview';
import { Team } from '@/pages/dashboard/Team';
import { Tasks } from '@/pages/dashboard/Tasks';
import { Conversations } from '@/pages/dashboard/Conversations';
import { Analytics } from '@/pages/dashboard/Analytics';
import { Billing } from '@/pages/dashboard/Billing';
import { Settings } from '@/pages/dashboard/Settings';

const routeTitles: { match: RegExp; title: string }[] = [
  { match: /^\/$/, title: 'Your AI employees, always working' },
  { match: /^\/employees\/?$/, title: 'AI Employees' },
  { match: /^\/employees\/[^/]+$/, title: 'AI Employee' },
  { match: /^\/how-it-works$/, title: 'How it works' },
  { match: /^\/pricing$/, title: 'Pricing' },
  { match: /^\/resources$/, title: 'Resources' },
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
            <Routes>
            <Route element={<MarketingLayout />}>
              <Route index element={<Home />} />
              <Route path="employees" element={<Employees />} />
              <Route path="employees/:slug" element={<EmployeeDetail />} />
              <Route path="how-it-works" element={<HowItWorks />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="resources" element={<Resources />} />
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
          </ErrorBoundary>
        </BrowserRouter>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
