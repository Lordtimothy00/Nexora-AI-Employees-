import { useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pageLabel, previousPage, recordPage, type PageEntry } from '@/lib/backStack';

/**
 * Global "back to the last page" control. Mounted once inside the router so it appears on every
 * route — marketing, auth, dashboard and 404. It remembers the previous page label, and falls back
 * to a sensible destination when the visitor landed directly on a deep link.
 */
export function BackButton() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const [previous, setPrevious] = useState<PageEntry | null>(null);

  useLayoutEffect(() => {
    recordPage(
      { path: `${location.pathname}${location.search}`, label: pageLabel(location.pathname) },
      navigationType,
    );
    setPrevious(previousPage());
  }, [location.pathname, location.search, navigationType]);

  const isHome = location.pathname === '/';

  // Nothing to go back to on the landing page.
  if (isHome && !previous) return null;

  const destination = previous?.path ?? '/';
  const label = previous ? `Back to ${previous.label}` : 'Back to home';
  const onDashboard = location.pathname.startsWith('/dashboard');

  const goBack = () => {
    const historyIndex =
      typeof window !== 'undefined'
        ? ((window.history.state as { idx?: number } | null)?.idx ?? 0)
        : 0;

    if (historyIndex > 0) navigate(-1);
    else navigate(destination);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      title={label}
      className={cn(
        'group fixed bottom-4 left-4 z-40 grid size-11 place-items-center rounded-full border border-white/12',
        'bg-[#10131b]/70 text-[#ced8e6]',
        'shadow-[0_18px_50px_-30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.34)] backdrop-blur-2xl backdrop-saturate-200',
        'transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d8dff]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c11]',
        'md:bottom-6 md:left-6 print:hidden',
        // keep clear of the fixed dashboard sidebar on large screens
        onDashboard && 'lg:left-[264px]',
      )}
    >
      <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
    </button>
  );
}
