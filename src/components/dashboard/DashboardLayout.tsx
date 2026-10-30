import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { getEmployeeById } from '@/data/employees';
import { cn, initialsOf } from '@/lib/utils';

const workspaceNav = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'My team', to: '/dashboard/team', icon: Users },
  { label: 'Tasks', to: '/dashboard/tasks', icon: Check },
  { label: 'Conversations', to: '/dashboard/conversations', icon: MessageSquare },
  { label: 'Analytics', to: '/dashboard/analytics', icon: BarChart3 },
];

const accountNav = [
  { label: 'Billing', to: '/dashboard/billing', icon: CreditCard },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/team': 'My team',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/conversations': 'Conversations',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/billing': 'Billing',
  '/dashboard/settings': 'Settings',
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { hires, activities } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
    setShowNotifications(false);
    setShowProfile(false);
  }, [location.pathname]);

  const title = pageTitles[location.pathname] ?? 'Workspace';
  const seatsUsed = hires.length;
  const seatsTotal = 5;

  const sidebar = (
    <div className="flex h-full flex-col border-r border-white/8 bg-[#0b0c0d]">
      <div className="flex h-16 items-center justify-between px-4">
        <Logo />
        <button
          type="button"
          className="grid size-8 place-items-center rounded-lg text-[#8e8f8b] hover:bg-white/5 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="px-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f4f4f2] font-display text-[12px] font-bold text-[#0a0b0c]">
            {initialsOf(user?.company ?? 'Nexora')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-white">{user?.company ?? 'Workspace'}</p>
            <p className="text-[10px] capitalize text-[#9d9e9a]">Growth plan · {seatsUsed} seats</p>
          </div>
          <ChevronDown className="size-3.5 shrink-0 text-[#7c7d79]" />
        </div>
      </div>

      <div className="px-3 pt-2.5">
        <ButtonLink to="/employees" size="sm" className="w-full" iconLeft={<Sparkles className="size-3.5" />}>
          Hire an employee
        </ButtonLink>
      </div>

      <nav className="scroll-thin mt-5 flex-1 overflow-y-auto px-2 pb-4" aria-label="Workspace">
        <p className="px-3 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#5e5f5c]">
          Workspace
        </p>
        {workspaceNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'group relative mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] transition-colors',
                isActive
                  ? 'bg-white/[0.07] text-white'
                  : 'text-[#a0a19d] hover:bg-white/[0.04] hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#d7f68c,#8fae2f)]" />
                )}
                <item.icon className={cn('size-4', isActive ? 'text-[#e2fa9e]' : 'text-[#8e8f8b]')} />
                <span className="flex-1">{item.label}</span>
                {item.label === 'Tasks' && (
                  <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-[#b2b3af]">
                    12
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        <p className="mt-5 px-3 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#5e5f5c]">
          Account
        </p>
        {accountNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] transition-colors',
                isActive ? 'bg-white/[0.07] text-white' : 'text-[#a0a19d] hover:bg-white/[0.04] hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('size-4', isActive ? 'text-[#e2fa9e]' : 'text-[#8e8f8b]')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/6 p-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-[#a0a19d]">Employee seats</span>
            <span className="font-medium text-white">
              {seatsUsed} / {seatsTotal}
            </span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: seatsTotal }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  index < seatsUsed ? 'bg-[linear-gradient(90deg,#d7f68c,#8fae2f)]' : 'bg-white/10',
                )}
              />
            ))}
          </div>
          <Link
            to="/pricing"
            className="mt-2.5 inline-flex items-center gap-1 text-[10.5px] text-[#e2fa9e] hover:text-white"
          >
            Add seats <ArrowUpRight className="size-2.5" />
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2.5 rounded-xl p-1.5">
          <Avatar name={user?.name ?? 'You'} initials={initialsOf(user?.name ?? 'You')} accent="violet" size="sm" status="online" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-white">{user?.name}</p>
            <p className="truncate text-[10px] text-[#8e8f8b]">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            aria-label="Sign out"
            className="grid size-7 place-items-center rounded-lg text-[#8e8f8b] transition hover:bg-white/8 hover:text-white"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08090a]">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[276px] animate-rise">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-white/8 bg-[#08090a]/85 px-4 backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-[#cecfcb] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
            <div className="hidden items-center gap-1.5 text-[11.5px] text-[#7c7d79] sm:flex">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-[#cecfcb]">{title}</span>
            </div>
            <span className="text-[13px] font-medium text-white sm:hidden">{title}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] text-[#a0a19d] transition hover:bg-white/5 hover:text-white sm:flex"
            >
              View site <ArrowUpRight className="size-3" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((value) => !value);
                  setShowProfile(false);
                }}
                aria-label="Notifications"
                aria-expanded={showNotifications}
                className="relative grid size-9 place-items-center rounded-lg text-[#a0a19d] transition hover:bg-white/5 hover:text-white"
              >
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#d7f68c] ring-2 ring-[#08090a]" />
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-11 z-40 w-[300px] overflow-hidden rounded-xl border border-white/10 bg-[#111213] shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-2.5">
                      <p className="text-[12px] font-medium text-white">Activity</p>
                      <span className="text-[10px] text-[#8e8f8b]">{activities.length} updates</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {activities.slice(0, 6).map((activity) => {
                        const person = getEmployeeById(activity.employeeId);
                        return (
                          <div key={activity.id} className="flex gap-2.5 border-b border-white/5 px-3.5 py-2.5 last:border-0">
                            <Avatar
                              name={person?.name ?? 'Nexora'}
                              src={person?.avatar}
                              initials={person?.initials ?? 'NX'}
                              accent={person?.accent ?? 'violet'}
                              size="xs"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] leading-relaxed text-[#cecfcb]">{activity.text}</p>
                              <p className="mt-0.5 text-[9.5px] text-[#7c7d79]">
                                {person?.name} · {timeAgo(activity.at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowNotifications(false)}
                      className="block border-t border-white/8 px-3.5 py-2.5 text-center text-[11px] text-[#e2fa9e] hover:bg-white/[0.03]"
                    >
                      View all activity
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfile((value) => !value);
                  setShowNotifications(false);
                }}
                aria-label="Account menu"
                aria-expanded={showProfile}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5 pr-1.5 transition hover:bg-white/[0.06]"
              >
                <Avatar name={user?.name ?? 'You'} initials={initialsOf(user?.name ?? 'You')} accent="violet" size="xs" />
                <ChevronDown className="size-3 text-[#8e8f8b]" />
              </button>
              {showProfile && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowProfile(false)} />
                  <div className="absolute right-0 top-11 z-40 w-[240px] overflow-hidden rounded-xl border border-white/10 bg-[#111213] shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]">
                    <div className="border-b border-white/8 px-3.5 py-3">
                      <p className="truncate text-[12px] font-medium text-white">{user?.name}</p>
                      <p className="truncate text-[10.5px] text-[#8e8f8b]">{user?.email}</p>
                    </div>
                    <Link to="/dashboard/settings" className="flex items-center gap-2 px-3.5 py-2 text-[11.5px] text-[#b2b3af] hover:bg-white/[0.04] hover:text-white">
                      <Settings className="size-3.5" /> Account settings
                    </Link>
                    <Link to="/dashboard/billing" className="flex items-center gap-2 px-3.5 py-2 text-[11.5px] text-[#b2b3af] hover:bg-white/[0.04] hover:text-white">
                      <CreditCard className="size-3.5" /> Billing
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="flex w-full items-center gap-2 border-t border-white/8 px-3.5 py-2 text-left text-[11.5px] text-[#b2b3af] hover:bg-white/[0.04] hover:text-white"
                    >
                      <LogOut className="size-3.5" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </div>
      </div>

    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
