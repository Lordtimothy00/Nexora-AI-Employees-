import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ButtonLink } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const links = [
  { label: 'AI Employees', to: '/employees' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Pricing', to: '/pricing' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-[#08090a] via-[#08090a]/75 to-transparent"
      />

      <div className="mx-auto max-w-[1200px] px-3 pt-3 md:px-6">
        <div
          className={cn(
            'flex h-[52px] items-center justify-between gap-2 rounded-2xl border px-2 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 md:h-[56px] md:gap-4 md:px-3',
            scrolled
              ? 'border-white/14 bg-[#0b0c0d]/72 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(245,245,243,0.12)]'
              : 'border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(245,245,243,0.1)]',
          )}
        >
          <Logo size="sm" className="pl-1" />

          <nav
            aria-label="Main"
            className="hidden items-center gap-0.5 rounded-full border border-white/[0.07] bg-white/[0.035] p-0.5 md:flex"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'relative rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                    isActive
                      ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(245,245,243,0.14)]'
                      : 'text-[#b2b3af] hover:bg-white/[0.05] hover:text-white',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-1 md:flex">
            {user ? (
              <ButtonLink
                to="/dashboard"
                size="sm"
                className="h-9 px-3.5 text-[12.5px]"
                iconRight={<ArrowRight className="size-3.5" />}
              >
                Dashboard
              </ButtonLink>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-3 py-2 text-[12.5px] font-medium text-[#b2b3af] transition-colors hover:text-white"
                >
                  Sign in
                </Link>
                <ButtonLink
                  to="/signup"
                  size="sm"
                  className="h-9 px-3.5 text-[12.5px]"
                  iconRight={<ArrowRight className="size-3.5" />}
                >
                  Hire your first AI
                </ButtonLink>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid size-9 place-items-center rounded-xl border border-white/12 bg-white/[0.05] text-white backdrop-blur-md md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-3 top-[70px] z-40 max-h-[calc(100dvh-84px)] overflow-y-auto rounded-2xl border border-white/12 bg-[#0b0c0d]/85 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(245,245,243,0.12)] backdrop-blur-2xl backdrop-saturate-150 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-xl px-3.5 py-3 text-[14px] transition-colors',
                    isActive ? 'bg-white/[0.07] text-white' : 'text-[#b8b9b5] hover:bg-white/[0.05]',
                  )
                }
              >
                {link.label}
                <ArrowRight className="size-4 opacity-50" />
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <ButtonLink to="/dashboard" size="md" className="w-full">
                Open dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/signup" size="md" className="w-full">
                  Hire your first AI
                </ButtonLink>
                <ButtonLink to="/login" variant="secondary" size="md" className="w-full">
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7c7d79]">
            AI employees · 24/7
          </p>
        </div>
      )}
    </header>
  );
}
