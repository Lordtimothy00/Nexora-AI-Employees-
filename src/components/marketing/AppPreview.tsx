import {
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  Check,
  ChevronDown,
  Command,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const chartPoints = [
  { label: 'Mon', value: 28 },
  { label: 'Tue', value: 42 },
  { label: 'Wed', value: 38 },
  { label: 'Thu', value: 57 },
  { label: 'Fri', value: 51 },
  { label: 'Sat', value: 72 },
  { label: 'Sun', value: 84 },
];

function AreaChart() {
  const width = 420;
  const height = 128;
  const max = 90;
  const step = width / (chartPoints.length - 1);
  const points = chartPoints.map((point, index) => ({
    x: index * step,
    y: height - (point.value / max) * height,
  }));
  const line = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const prev = points[index - 1];
      const cx = (prev.x + point.x) / 2;
      return `C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(' ');

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height + 8}`} className="h-32 w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="preview-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8f060" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#c8f060" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="preview-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d7f68c" />
            <stop offset="100%" stopColor="#c8f060" />
          </linearGradient>
        </defs>
        {[0.25, 0.55, 0.85].map((ratio) => (
          <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="rgba(245,245,243,0.055)" strokeDasharray="4 6" />
        ))}
        <path d={`${line} L ${width} ${height} L 0 ${height} Z`} fill="url(#preview-area)" />
        <path d={line} fill="none" stroke="url(#preview-line)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#111213" stroke="#c8f060" strokeWidth="2.5" />
      </svg>
      <div className="mt-2 flex justify-between px-0.5 font-mono text-[9px] uppercase tracking-wider text-[#7c7d79]">
        {chartPoints.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: Users, label: 'My team' },
  { icon: Check, label: 'Tasks', badge: '12' },
  { icon: MessageSquare, label: 'Conversations', badge: '3' },
  { icon: BarChart3, label: 'Analytics' },
];

const activity = [
  { name: 'Kai', initials: 'KA', accent: 'mint' as const, text: 'Resolved 112 delay tickets', time: '2m', avatar: '/team/kai.jpg' },
  { name: 'Ava', initials: 'AV', accent: 'violet' as const, text: 'Booked 3 qualified meetings', time: '11m', avatar: '/team/ava.jpg' },
  { name: 'Atlas', initials: 'AT', accent: 'sky' as const, text: 'Published the October churn memo', time: '38m', avatar: '/team/atlas.jpg' },
];

export function AppPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[1080px]">
      <div
        aria-hidden="true"
        className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_20%,rgba(245,245,243,0.14),rgba(200,240,96,0.05)_55%,transparent_72%)] blur-2xl"
      />

      <div className="relative overflow-hidden rounded-[22px] border border-white/12 bg-[#0d0e0f]/70 p-1.5 shadow-[0_50px_130px_-40px_rgba(0,0,0,0.9),0_40px_100px_-50px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(245,245,243,0.12)] backdrop-blur-xl md:rounded-[26px] md:p-2">
        <div className="pointer-events-none absolute inset-x-16 -top-px h-px bg-gradient-to-r from-transparent via-[#d7f68c] to-transparent" />
        <div className="pointer-events-none absolute inset-x-24 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(245,245,243,0.08),transparent_70%)]" />
        <div className="overflow-hidden rounded-[16px] border border-white/8 bg-[#111213] md:rounded-[20px]">
          {/* chrome */}
          <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.018] px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#4a4d50]/80" />
              <span className="size-2.5 rounded-full bg-[#5c5f62]/80" />
              <span className="size-2.5 rounded-full bg-[#28c840]/80" />
            </div>
            <div className="mx-auto flex items-center gap-2 rounded-full border border-white/8 bg-black/30 px-3 py-1">
              <Search className="size-3 text-[#7c7d79]" />
              <span className="font-mono text-[10px] text-[#9d9e9a]">app.nexora.ai/workspace</span>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-mint/25 bg-mint/[0.07] px-2 py-1 sm:flex">
              <span className="size-1.5 rounded-full bg-mint" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#e2fa9e]">live</span>
            </div>
          </div>

          <div className="flex">
            {/* sidebar */}
            <aside className="hidden w-[178px] shrink-0 flex-col border-r border-white/8 bg-[#0b0c0d]/60 p-3 md:flex">
              <div className="flex items-center gap-2 px-1 py-2">
                <LogoMark className="size-7 rounded-[8px]" />
                <div className="leading-tight">
                  <p className="font-display text-[11px] font-semibold tracking-[0.12em] text-white">NEXORA</p>
                  <p className="text-[8.5px] text-[#8e8f8b]">Growth plan</p>
                </div>
              </div>
              <button className="mt-2 flex w-full items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-left">
                <span className="flex items-center gap-1.5 text-[10px] text-[#cecfcb]">
                  <span className="grid size-4 place-items-center rounded bg-[#c8f060]/25 text-[7.5px] font-bold text-[#e2fa9e]">N</span>
                  Northwind Labs
                </span>
                <ChevronDown className="size-3 text-[#7c7d79]" />
              </button>
              <nav className="mt-4 space-y-0.5">
                {navItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10.5px]',
                      item.active ? 'bg-white/[0.07] text-white' : 'text-[#a0a19d]',
                    )}
                  >
                    <item.icon className="size-3.5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-white/[0.07] px-1.5 text-[8.5px] text-[#b2b3af]">{item.badge}</span>
                    )}
                  </div>
                ))}
              </nav>
              <div className="mt-auto rounded-xl border border-[#c8f060]/25 bg-[linear-gradient(160deg,rgba(200,240,96,0.18),rgba(200,240,96,0.03))] p-2.5">
                <div className="flex items-center gap-1.5 text-[9.5px] font-medium text-[#e7e8e4]">
                  <Sparkles className="size-3" /> Hire an employee
                </div>
                <p className="mt-1 text-[8.5px] leading-relaxed text-[#a4a5a1]">2 seats left on Growth.</p>
                <div className="mt-2 flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-1 text-[8.5px] text-white">
                  <Plus className="size-2.5" /> Browse team
                </div>
              </div>
            </aside>

            {/* main */}
            <div className="min-w-0 flex-1 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8e8f8b]">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <h3 className="mt-1 font-display text-[15px] font-semibold text-white md:text-[17px]">
                    Good morning, Alex
                  </h3>
                  <p className="mt-0.5 text-[10.5px] text-[#a0a19d]">
                    Your team shipped <span className="text-white">47 tasks</span> since yesterday.
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex -space-x-1.5">
                    {activity.map((person) => (
                      <Avatar
                        key={person.name}
                        name={person.name}
                        src={person.avatar}
                        initials={person.initials}
                        accent={person.accent}
                        size="xs"
                        className="ring-2 ring-[#111213]"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-[#f4f4f2] px-2.5 py-1 text-[9.5px] font-semibold text-[#0a0b0c]">
                    <Zap className="size-2.5" /> Assign task
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Delivered', value: '1,284', delta: '+18%', tone: 'text-mint' },
                  { label: 'Hours saved', value: '96', delta: '+12h', tone: 'text-[#dadbd7]' },
                  { label: 'Active hires', value: '3', delta: 'of 5', tone: 'text-[#e2fa9e]' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-2">
                    <p className="text-[8.5px] uppercase tracking-wider text-[#8e8f8b]">{kpi.label}</p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-[15px] font-semibold text-white">{kpi.value}</span>
                      <span className={cn('text-[8.5px] font-medium', kpi.tone)}>{kpi.delta}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1.35fr_1fr]">
                <div className="rounded-xl border border-white/8 bg-white/[0.045] backdrop-blur-xl p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-[#d8d9d5]">Tasks completed</p>
                    <span className="flex items-center gap-1 rounded-full border border-white/8 px-1.5 py-0.5 text-[8px] text-[#a0a19d]">
                      Last 7 days <ChevronDown className="size-2" />
                    </span>
                  </div>
                  <AreaChart />
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.045] backdrop-blur-xl p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-[#d8d9d5]">Live activity</p>
                    <span className="flex items-center gap-1 text-[8px] text-[#a0a19d]">
                      <span className="size-1 rounded-full bg-mint" /> now
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activity.map((person) => (
                      <div key={person.name} className="flex items-start gap-2">
                        <Avatar
                          name={person.name}
                          src={person.avatar}
                          initials={person.initials}
                          accent={person.accent}
                          size="xs"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[9.5px] text-[#cecfcb]">
                            <span className="font-medium text-white">{person.name}</span> {person.text}
                          </p>
                          <p className="font-mono text-[8px] text-[#7c7d79]">{person.time} ago</p>
                        </div>
                        <Check className="mt-0.5 size-2.5 text-mint" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/8 bg-black/25 px-2 py-1.5">
                    <span className="flex gap-0.5">
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="size-1 animate-bounce rounded-full bg-[#d7f68c]"
                          style={{ animationDelay: `${dot * 140}ms` }}
                        />
                      ))}
                    </span>
                    <span className="text-[8.5px] text-[#a0a19d]">Ava is drafting your sequence…</span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 hidden items-center justify-between rounded-xl border border-white/8 bg-white/[0.045] backdrop-blur-xl px-3 py-2 sm:flex">
                <div className="flex items-center gap-4 text-[9px] text-[#a0a19d]">
                  <span className="flex items-center gap-1"><Inbox className="size-3" /> 4 approvals waiting</span>
                  <span className="flex items-center gap-1"><CalendarCheck className="size-3" /> 3 meetings booked</span>
                  <span className="flex items-center gap-1"><Command className="size-3" /> 6 integrations live</span>
                </div>
                <ArrowUpRight className="size-3 text-[#7c7d79]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating cards */}
      <div className="absolute -right-3 top-24 hidden w-[196px] animate-float rounded-xl border border-white/12 bg-[#16181a]/95 p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:block xl:-right-10">
        <div className="flex items-center gap-2">
          <Avatar name="Kai" src="/team/kai.jpg" initials="KA" accent="mint" size="sm" status="online" />
          <div>
            <p className="text-[11px] font-medium text-white">Kai resolved 112 tickets</p>
            <p className="font-mono text-[8.5px] text-[#8e8f8b]">in the last 4 hours</p>
          </div>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/8">
          <div className="h-full w-[86%] rounded-full bg-[linear-gradient(90deg,#c8f060,#b9bcb4)]" />
        </div>
      </div>

      <div
        className="absolute -left-4 bottom-12 hidden w-[238px] animate-float overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(150deg,#24272a_0%,#141516_46%,#131415_100%)] p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:block xl:-left-12"
        style={{ animationDelay: '1.6s' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-[radial-gradient(circle,rgba(200,240,96,0.14),transparent_70%)] blur-xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-[#ddf89e] to-transparent"
        />
        <div className="relative flex items-center justify-between">
          <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#e2fa9e]/80">
            Nexora · employee
          </span>
          <Sparkles className="size-3 text-[#ddf89e]" />
        </div>
        <div className="relative mt-3 flex items-center gap-2.5">
          <Avatar name="Ava" src="/team/ava.jpg" initials="AV" accent="violet" size="sm" status="online" />
          <div>
            <p className="text-[12.5px] font-medium text-white">Ava</p>
            <p className="text-[9.5px] text-[#d6d7d3]">Sales Development Rep</p>
          </div>
        </div>
        <div className="relative mt-3.5 flex items-end justify-between border-t border-white/10 pt-2.5">
          <div>
            <p className="font-display text-[17px] font-semibold leading-none text-white">+96h</p>
            <p className="mt-0.5 text-[8.5px] text-[#a4a5a1]">saved this week</p>
          </div>
          <div className="flex items-end gap-[3px]">
            {[30, 46, 38, 60, 72, 96].map((value, index) => (
              <div
                key={index}
                className="w-[4px] rounded-sm bg-[linear-gradient(180deg,#e2fa9e,rgba(200,240,96,0.35))]"
                style={{ height: `${Math.round(value * 0.26)}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
