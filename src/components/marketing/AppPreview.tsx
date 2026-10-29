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
            <stop offset="0%" stopColor="#8b6dff" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#8b6dff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="preview-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4fe3c1" />
          </linearGradient>
        </defs>
        {[0.25, 0.55, 0.85].map((ratio) => (
          <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="rgba(255,255,255,0.055)" strokeDasharray="4 6" />
        ))}
        <path d={`${line} L ${width} ${height} L 0 ${height} Z`} fill="url(#preview-area)" />
        <path d={line} fill="none" stroke="url(#preview-line)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#0b0d14" stroke="#4fe3c1" strokeWidth="2.5" />
      </svg>
      <div className="mt-2 flex justify-between px-0.5 font-mono text-[9px] uppercase tracking-wider text-[#5f6376]">
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
        className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_20%,rgba(124,92,255,0.28),transparent_70%)] blur-2xl"
      />

      <div className="relative overflow-hidden rounded-[22px] border border-white/12 bg-[#080a11]/90 p-1.5 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl md:rounded-[26px] md:p-2">
        <div className="overflow-hidden rounded-[16px] border border-white/8 bg-[#0a0c13] md:rounded-[20px]">
          {/* chrome */}
          <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.018] px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
              <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
              <span className="size-2.5 rounded-full bg-[#28c840]/80" />
            </div>
            <div className="mx-auto flex items-center gap-2 rounded-full border border-white/8 bg-black/30 px-3 py-1">
              <Search className="size-3 text-[#5f6376]" />
              <span className="font-mono text-[10px] text-[#7c8095]">app.nexora.ai/workspace</span>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-mint/25 bg-mint/[0.07] px-2 py-1 sm:flex">
              <span className="size-1.5 rounded-full bg-mint" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#9df0dc]">live</span>
            </div>
          </div>

          <div className="flex">
            {/* sidebar */}
            <aside className="hidden w-[178px] shrink-0 flex-col border-r border-white/8 bg-[#080a10] p-3 md:flex">
              <div className="flex items-center gap-2 px-1 py-2">
                <LogoMark className="size-7 rounded-[8px]" />
                <div className="leading-tight">
                  <p className="font-display text-[11px] font-semibold tracking-[0.12em] text-white">NEXORA</p>
                  <p className="text-[8.5px] text-[#6c7085]">Growth plan</p>
                </div>
              </div>
              <button className="mt-2 flex w-full items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-left">
                <span className="flex items-center gap-1.5 text-[10px] text-[#c3c6d4]">
                  <span className="grid size-4 place-items-center rounded bg-[#7c5cff]/25 text-[7.5px] font-bold text-[#c4b5fd]">N</span>
                  Northwind Labs
                </span>
                <ChevronDown className="size-3 text-[#5f6376]" />
              </button>
              <nav className="mt-4 space-y-0.5">
                {navItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10.5px]',
                      item.active ? 'bg-white/[0.07] text-white' : 'text-[#8b8fa3]',
                    )}
                  >
                    <item.icon className="size-3.5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-white/[0.07] px-1.5 text-[8.5px] text-[#a3a7b8]">{item.badge}</span>
                    )}
                  </div>
                ))}
              </nav>
              <div className="mt-auto rounded-xl border border-[#7c5cff]/25 bg-[linear-gradient(160deg,rgba(124,92,255,0.18),rgba(124,92,255,0.03))] p-2.5">
                <div className="flex items-center gap-1.5 text-[9.5px] font-medium text-[#d8ccff]">
                  <Sparkles className="size-3" /> Hire an employee
                </div>
                <p className="mt-1 text-[8.5px] leading-relaxed text-[#9b93b8]">2 seats left on Growth.</p>
                <div className="mt-2 flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-1 text-[8.5px] text-white">
                  <Plus className="size-2.5" /> Browse team
                </div>
              </div>
            </aside>

            {/* main */}
            <div className="min-w-0 flex-1 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6c7085]">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <h3 className="mt-1 font-display text-[15px] font-semibold text-white md:text-[17px]">
                    Good morning, Alex
                  </h3>
                  <p className="mt-0.5 text-[10.5px] text-[#8b8fa3]">
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
                        className="ring-2 ring-[#0a0c13]"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-[linear-gradient(100deg,#8b6dff,#5d7cff)] px-2.5 py-1 text-[9.5px] font-medium text-white">
                    <Zap className="size-2.5" /> Assign task
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Delivered', value: '1,284', delta: '+18%', tone: 'text-mint' },
                  { label: 'Hours saved', value: '96', delta: '+12h', tone: 'text-[#a9cdff]' },
                  { label: 'Active hires', value: '3', delta: 'of 5', tone: 'text-[#c4b5fd]' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-2">
                    <p className="text-[8.5px] uppercase tracking-wider text-[#6c7085]">{kpi.label}</p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-[15px] font-semibold text-white">{kpi.value}</span>
                      <span className={cn('text-[8.5px] font-medium', kpi.tone)}>{kpi.delta}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1.35fr_1fr]">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-[#d3d5e0]">Tasks completed</p>
                    <span className="flex items-center gap-1 rounded-full border border-white/8 px-1.5 py-0.5 text-[8px] text-[#8b8fa3]">
                      Last 7 days <ChevronDown className="size-2" />
                    </span>
                  </div>
                  <AreaChart />
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-[#d3d5e0]">Live activity</p>
                    <span className="flex items-center gap-1 text-[8px] text-[#8b8fa3]">
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
                          <p className="truncate text-[9.5px] text-[#c3c6d4]">
                            <span className="font-medium text-white">{person.name}</span> {person.text}
                          </p>
                          <p className="font-mono text-[8px] text-[#5f6376]">{person.time} ago</p>
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
                          className="size-1 animate-bounce rounded-full bg-[#a78bfa]"
                          style={{ animationDelay: `${dot * 140}ms` }}
                        />
                      ))}
                    </span>
                    <span className="text-[8.5px] text-[#8b8fa3]">Ava is drafting your sequence…</span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 hidden items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 sm:flex">
                <div className="flex items-center gap-4 text-[9px] text-[#8b8fa3]">
                  <span className="flex items-center gap-1"><Inbox className="size-3" /> 4 approvals waiting</span>
                  <span className="flex items-center gap-1"><CalendarCheck className="size-3" /> 3 meetings booked</span>
                  <span className="flex items-center gap-1"><Command className="size-3" /> 6 integrations live</span>
                </div>
                <ArrowUpRight className="size-3 text-[#5f6376]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating cards */}
      <div className="absolute -right-3 top-24 hidden w-[196px] animate-float rounded-xl border border-white/12 bg-[#0d1018]/95 p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:block xl:-right-10">
        <div className="flex items-center gap-2">
          <Avatar name="Kai" src="/team/kai.jpg" initials="KA" accent="mint" size="sm" status="online" />
          <div>
            <p className="text-[11px] font-medium text-white">Kai resolved 112 tickets</p>
            <p className="font-mono text-[8.5px] text-[#6c7085]">in the last 4 hours</p>
          </div>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/8">
          <div className="h-full w-[86%] rounded-full bg-[linear-gradient(90deg,#4fe3c1,#5aa9ff)]" />
        </div>
      </div>

      <div
        className="absolute -left-4 bottom-16 hidden w-[210px] animate-float rounded-xl border border-white/12 bg-[#0d1018]/95 p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:block xl:-left-12"
        style={{ animationDelay: '1.6s' }}
      >
        <div className="flex items-center justify-between">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#6c7085]">This week</p>
          <Sparkles className="size-3 text-[#a78bfa]" />
        </div>
        <p className="mt-1 font-display text-[19px] font-semibold text-white">+96 hours</p>
        <p className="text-[9.5px] text-[#8b8fa3]">of work your team did not do</p>
        <div className="mt-2 flex items-end gap-1">
          {[34, 52, 41, 68, 59, 82, 96].map((value, index) => (
            <div
              key={index}
              className="flex-1 rounded-sm bg-[linear-gradient(180deg,#a78bfa,rgba(167,139,250,0.15))]"
              style={{ height: `${value * 0.35}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
