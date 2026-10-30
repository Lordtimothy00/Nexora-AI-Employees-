import type { ReactNode } from 'react';
import {
  BatteryFull,
  Check,
  ChevronLeft,
  Home,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Signal,
  Sparkles,
  Users,
  Wifi,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------- frame --- */

function StatusBar() {
  return (
    <div className="relative flex items-center justify-between px-4 pb-1 pt-2.5">
      <span className="text-[8.5px] font-semibold text-white">9:41</span>
      <div className="absolute left-1/2 top-2 h-[15px] w-[58px] -translate-x-1/2 rounded-full bg-black/90" />
      <div className="flex items-center gap-[3px] text-white/75">
        <Signal className="size-2.5" />
        <Wifi className="size-2.5" />
        <BatteryFull className="size-3" />
      </div>
    </div>
  );
}

function TabBar({ active }: { active: number }) {
  const items = [
    { icon: Home, label: 'Home' },
    { icon: Users, label: 'Team' },
    { icon: Check, label: 'Tasks' },
    { icon: MessageCircle, label: 'Chat' },
  ];

  return (
    <div className="mt-auto flex items-center justify-around border-t border-white/8 bg-[#0f0604]/95 px-2 pb-2 pt-1.5">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'flex flex-col items-center gap-0.5 transition-colors',
            index === active ? 'text-[#ffc08e]' : 'text-[#6e574b]',
          )}
        >
          <item.icon className="size-3" />
          <span className="text-[6px]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function PhoneFrame({
  children,
  className,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative rounded-[38px] border border-[#ffc08e]/25 bg-[linear-gradient(160deg,#3d160a,#180b06_55%,#200e08)] p-[6px]',
        glow
          ? 'shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95),0_0_90px_-20px_rgba(221,104,22,0.65)]'
          : 'shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]',
        className,
      )}
    >
      <span aria-hidden="true" className="absolute -left-[2px] top-24 h-8 w-[2px] rounded-full bg-[#3d160a]" />
      <span aria-hidden="true" className="absolute -left-[2px] top-36 h-12 w-[2px] rounded-full bg-[#3d160a]" />
      <span aria-hidden="true" className="absolute -right-[2px] top-28 h-14 w-[2px] rounded-full bg-[#3d160a]" />
      <div className="relative overflow-hidden rounded-[33px] border border-white/10 bg-[#0b0402]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-[33px] bg-[linear-gradient(115deg,rgba(255,244,236,0.08)_0%,transparent_32%,transparent_70%,rgba(255,244,236,0.04)_100%)]"
        />
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- screens --- */

function Bubble({ side, children }: { side: 'left' | 'right'; children: ReactNode }) {
  return (
    <div className={cn('flex', side === 'right' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[86%] rounded-xl px-2 py-1.5 text-[7.5px] leading-[1.55]',
          side === 'right'
            ? 'rounded-br-sm bg-[linear-gradient(140deg,#dd6816,#a32b0b)] text-[#fff1e5]'
            : 'rounded-bl-sm border border-white/8 bg-white/[0.045] text-[#d2c0b5]',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ChatScreen() {
  return (
    <div className="flex h-[520px] flex-col">
      <StatusBar />
      <div className="flex items-center gap-2 border-b border-white/8 px-3 pb-2.5 pt-1.5">
        <ChevronLeft className="size-3.5 shrink-0 text-[#a68e80]" />
        <Avatar name="Ava" src="/team/ava.jpg" initials="AV" accent="violet" size="xs" status="online" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium text-white">Ava</p>
          <p className="flex items-center gap-1 text-[7px] text-[#b5b56f]">
            <span className="size-1 rounded-full bg-[#b5b56f]" /> online · replies in 2 min
          </p>
        </div>
        <MoreHorizontal className="size-3.5 shrink-0 text-[#8a7365]" />
      </div>

      <div className="flex-1 space-y-2 overflow-hidden px-2.5 pb-2 pt-2.5">
        <p className="text-center font-mono text-[6px] uppercase tracking-[0.18em] text-[#8a7365]">
          Today · 07:12
        </p>
        <Bubble side="left">
          Morning. <span className="text-white">20 accounts</span> queued for 8:10am. Three warm replies
          came in overnight — approved and sent.
        </Bubble>
        <Bubble side="right">Nice. How is the reply rate holding?</Bubble>
        <Bubble side="left">
          9.4% on v1, above the 6% baseline. Draft v2 is ready:
          <div className="mt-1.5 rounded-lg border border-white/10 bg-white/[0.05] p-1.5">
            <div className="flex items-center gap-1.5">
              <span className="grid size-5 place-items-center rounded-md bg-[#dd6816]/25">
                <Sparkles className="size-2.5 text-[#ffc08e]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[7.5px] font-medium text-white">Sequence v2</p>
                <p className="truncate text-[6px] text-[#8a7365]">3 touches · reconciliation angle</p>
              </div>
              <Check className="size-2.5 text-[#b5b56f]" />
            </div>
          </div>
          <div className="mt-1.5 rounded-md bg-[linear-gradient(100deg,#ff9a4d,#df5a12)] px-2 py-1 text-center text-[7.5px] font-medium text-white">
            Approve &amp; launch
          </div>
        </Bubble>
        <div className="flex items-end gap-1.5">
          <Avatar name="Ava" src="/team/ava.jpg" initials="AV" accent="violet" size="xs" className="size-5" />
          <div className="flex items-center gap-0.5 rounded-xl rounded-bl-sm border border-white/8 bg-white/[0.045] px-2 py-1.5">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="size-[3px] animate-bounce rounded-full bg-[#ffa15c]"
                style={{ animationDelay: `${dot * 130}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-white/8 px-2.5 py-2">
        <div className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[7.5px] text-[#8a7365]">
          Message Ava…
        </div>
        <span className="grid size-6 place-items-center rounded-full bg-[linear-gradient(140deg,#ff9a4d,#c02c0a)]">
          <Send className="size-2.5 text-white" />
        </span>
      </div>
    </div>
  );
}

function TaskCard({
  title,
  meta,
  priority,
  pill,
}: {
  title: string;
  meta: string;
  priority: 'High' | 'Medium' | 'Low';
  pill?: string;
}) {
  const priorityColor = {
    High: 'text-[#ffb3a3]',
    Medium: 'text-[#f8dfb4]',
    Low: 'text-[#a68e80]',
  }[priority];

  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2">
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[7.5px] font-medium leading-snug text-white">{title}</p>
        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#dd6816]" />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[6px] text-[#8a7365]">{meta}</span>
        <div className="flex items-center gap-1">
          {pill && (
            <span className="rounded-full bg-[#ffb86b]/12 px-1.5 py-0.5 text-[5.5px] text-[#f8dfb4]">{pill}</span>
          )}
          <span className={cn('text-[5.5px] uppercase tracking-wider', priorityColor)}>{priority}</span>
        </div>
      </div>
    </div>
  );
}

function TasksScreen() {
  return (
    <div className="flex h-[430px] flex-col">
      <StatusBar />
      <div className="flex items-center justify-between px-3 pt-1.5">
        <div>
          <p className="font-mono text-[5.5px] uppercase tracking-[0.16em] text-[#8a7365]">Wednesday</p>
          <p className="text-[13px] font-semibold leading-tight text-white">Tasks</p>
        </div>
        <span className="grid size-6 place-items-center rounded-full border border-white/12 bg-white/[0.03]">
          <Plus className="size-3 text-white" />
        </span>
      </div>

      <div className="mt-2 flex gap-1 px-3">
        <span className="rounded-full bg-[#dd6816] px-2 py-1 text-[6px] font-medium text-white">All · 9</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[6px] text-[#a68e80]">Review · 4</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[6px] text-[#a68e80]">Done</span>
      </div>

      <div className="mt-2 flex-1 space-y-1.5 overflow-hidden px-3">
        <TaskCard title="Clear carrier delay tickets" meta="Kai · due today" priority="High" pill="Review" />
        <TaskCard title="Revenue churn readout" meta="Atlas · due Fri" priority="Medium" />
        <TaskCard title="Sequence v2 approval" meta="Ava · 2h ago" priority="High" pill="Review" />
        <TaskCard title="Monday insight memo" meta="Atlas · Monday" priority="Low" />
      </div>

      <TabBar active={2} />
    </div>
  );
}

function TeamScreen() {
  return (
    <div className="flex h-[430px] flex-col">
      <StatusBar />
      <div className="flex items-center justify-between px-3 pt-1.5">
        <div>
          <p className="font-mono text-[5.5px] uppercase tracking-[0.16em] text-[#8a7365]">Northwind Labs</p>
          <p className="text-[13px] font-semibold leading-tight text-white">Your team</p>
        </div>
        <span className="rounded-full border border-[#ffc08e]/30 bg-[#dd6816]/15 px-2 py-1 text-[6px] text-[#ffc08e]">
          + Hire
        </span>
      </div>

      <div className="mt-2 px-3">
        <div className="relative overflow-hidden rounded-xl border border-[#ffc08e]/25 bg-[linear-gradient(140deg,#43140a,#220c06_60%,#1c1208)] p-2.5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-8 size-20 rounded-full bg-[radial-gradient(circle,rgba(255,138,61,0.5),transparent_70%)] blur-lg"
          />
          <div className="relative flex items-center justify-between">
            <span className="font-mono text-[5px] uppercase tracking-[0.2em] text-[#ffc08e]/80">
              Nexora · employee
            </span>
            <Sparkles className="size-2.5 text-[#ffb27a]" />
          </div>
          <div className="relative mt-2 flex items-center gap-2">
            <Avatar name="Ava" src="/team/ava.jpg" initials="AV" accent="violet" size="xs" status="online" />
            <div>
              <p className="text-[8px] font-medium text-white">Ava</p>
              <p className="text-[6px] text-[#e8b78e]">Sales Development Rep</p>
            </div>
          </div>
          <div className="relative mt-2 flex items-center justify-between border-t border-white/10 pt-1.5">
            <span className="font-mono text-[5.5px] text-[#dab99e]">96h SAVED</span>
            <div className="flex items-end gap-[2px]">
              {[6, 9, 7, 12, 14].map((height, index) => (
                <span
                  key={index}
                  className="w-[2px] rounded-sm bg-[linear-gradient(180deg,#ffc08e,rgba(221,104,22,0.4))]"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex-1 space-y-1.5 px-3">
        {[
          { name: 'Kai', role: 'Support · 91%', src: '/team/kai.jpg', accent: 'mint' as const, bar: 91 },
          { name: 'Atlas', role: 'Data · 64%', src: '/team/atlas.jpg', accent: 'sky' as const, bar: 64 },
          { name: 'Nova', role: 'Growth · 48%', src: '/team/nova.jpg', accent: 'lilac' as const, bar: 48 },
        ].map((person) => (
          <div key={person.name} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.025] p-1.5">
            <Avatar name={person.name} src={person.src} initials={person.name[0]} accent={person.accent} size="xs" status="online" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[7.5px] font-medium text-white">{person.name}</p>
                <span className="font-mono text-[5.5px] text-[#8a7365]">{person.bar}%</span>
              </div>
              <p className="text-[5.5px] text-[#8a7365]">{person.role}</p>
              <div className="mt-1 h-[2px] overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#ffa15c,#dd6816)]"
                  style={{ width: `${person.bar}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <TabBar active={1} />
    </div>
  );
}

/* ------------------------------------------------------------- composition --- */

export function PhoneMockups() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[548px] w-full max-w-[300px] select-none sm:h-[600px] sm:max-w-[540px] lg:max-w-[600px]"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(221,104,22,0.28),rgba(181,181,111,0.08)_55%,transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-6 h-[520px] w-[340px] -translate-x-1/2 rounded-full opacity-60 blur-[50px] [background:conic-gradient(from_160deg_at_50%_50%,transparent_0deg,rgba(255,138,61,0.3)_70deg,transparent_150deg,rgba(181,181,111,0.22)_230deg,transparent_320deg)]" />

      <div className="absolute left-0 top-24 z-10 hidden w-[196px] -rotate-[9deg] sm:block lg:left-1 lg:w-[208px]">
        <PhoneFrame>
          <TasksScreen />
        </PhoneFrame>
      </div>

      <div className="absolute right-0 top-14 z-10 hidden w-[196px] rotate-[8deg] sm:block lg:right-1 lg:w-[208px]">
        <PhoneFrame>
          <TeamScreen />
        </PhoneFrame>
      </div>

      <div className="absolute left-1/2 top-0 z-20 w-[252px] -translate-x-1/2 sm:w-[268px]">
        <PhoneFrame glow>
          <ChatScreen />
        </PhoneFrame>
      </div>

      <div className="absolute -left-1 bottom-6 z-30 hidden items-center gap-2 rounded-xl border border-white/12 bg-[#1d0e08]/95 px-3 py-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:flex">
        <span className="grid size-6 place-items-center rounded-full bg-[#b5b56f]/15">
          <Check className="size-3 text-[#d9d9a0]" />
        </span>
        <div>
          <p className="text-[10px] font-medium text-white">Approved in 2 taps</p>
          <p className="font-mono text-[7.5px] text-[#8a7365]">while queuing for coffee</p>
        </div>
      </div>

      <div className="absolute -right-2 bottom-24 z-30 hidden items-center gap-2 rounded-xl border border-white/12 bg-[#1d0e08]/95 px-3 py-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:flex">
        <span className="grid size-6 place-items-center rounded-full bg-[#dd6816]/15">
          <Sparkles className="size-3 text-[#ffc08e]" />
        </span>
        <div>
          <p className="text-[10px] font-medium text-white">12 tasks overnight</p>
          <p className="font-mono text-[7.5px] text-[#8a7365]">digest ready at 7:00am</p>
        </div>
      </div>
    </div>
  );
}
