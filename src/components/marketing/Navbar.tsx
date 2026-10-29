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
    const onScroll = () => setScrolled(window.scrollY > 14);
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
        className={cn(
          'mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-5 transition-all duration-300 md:h-[72px] md:px-8',
        )}
      >
        <Logo />

        <nav
          aria-label="Main"
          className={cn(
            'hidden items-center gap-1 rounded-full border px-1.5 py-1.5 transition-all duration-300 md:flex',
            scrolled
              ? 'border-white/10 bg-[#140805]/80 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl'
              : 'border-transparent bg-transparent',
          )}
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'relative rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors',
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-[#bea99c] hover:bg-white/[0.05] hover:text-white',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          {user ? (
            <ButtonLink to="/dashboard" size="sm" iconRight={<ArrowRight className="size-3.5" />}>
              Dashboard
            </ButtonLink>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-[#bea99c] transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <ButtonLink to="/signup" size="sm" iconRight={<ArrowRight className="size-3.5" />}>
                Hire your first AI
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-white md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[90px]" aria-hidden="true">
        <div className={cn('h-full w-full transition-opacity duration-300', scrolled ? 'opacity-100 bg-[#0b0402]/85 backdrop-blur-xl border-b border-white/6' : 'opacity-0')} />
      </div>

      {open && (
        <div className="fixed inset-0 top-16 z-40 overflow-y-auto border-t border-white/8 bg-[#0b0402]/97 px-5 pb-10 pt-6 backdrop-blur-2xl md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] transition-colors',
                    isActive ? 'bg-white/[0.06] text-white' : 'text-[#c5b2a6] hover:bg-white/[0.04]',
                  )
                }
              >
                {link.label}
                <ArrowRight className="size-4 opacity-50" />
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            {user ? (
              <ButtonLink to="/dashboard" size="lg" className="w-full">
                Open dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/signup" size="lg" className="w-full">
                  Hire your first AI
                </ButtonLink>
                <ButtonLink to="/login" variant="secondary" size="lg" className="w-full">
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8a7365]">
            AI employees · 24/7
          </p>
        </div>
      )}
    </header>
  );
}
