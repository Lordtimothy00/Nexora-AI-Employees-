import {
  ArrowRight,
  Braces,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Database,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Lock,
  MessageSquare,
  Plug,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import { HeroBackdrop, SectionGlow } from '@/components/marketing/HeroBackdrop';
import { FinalCta } from '@/components/marketing/FinalCta';
import { Accordion } from '@/components/ui/Accordion';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { faqs, integrations } from '@/data/site';
import { cn } from '@/lib/utils';

const phases = [
  {
    number: '01',
    title: 'Pick the role, not the model',
    body: 'Choose from eight specialised employees. Each one arrives with a job description, a playbook, and a definition of done — so you know exactly what you are hiring before you spend a dollar.',
    points: ['Compare real deliverables', 'See typical turnaround', 'Start with one or build a team'],
    icon: Users,
    visual: 'roles',
  },
  {
    number: '02',
    title: 'Calibrate it to your business',
    body: 'Five questions set the tone, the limits, and the quality bar. Upload a style guide or connect your docs and the employee learns how your best operator writes, prioritises, and decides.',
    points: ['Brand voice and tone', 'Spend and approval limits', 'What “done” means to you'],
    icon: Target,
    visual: 'calibration',
  },
  {
    number: '03',
    title: 'Connect the tools it needs',
    body: 'OAuth into your inbox, CRM, helpdesk, or warehouse. Permissions are scoped per employee and every write is logged. Disconnect a tool and that access disappears instantly.',
    points: ['40+ native integrations', 'Scoped read / write access', 'Custom API tools on Scale'],
    icon: Plug,
    visual: 'tools',
  },
  {
    number: '04',
    title: 'Delegate from anywhere',
    body: 'Assign work in the dashboard or just message your employee in Slack. They confirm the brief, ask only the questions that matter, and get moving — updates arrive without you chasing.',
    points: ['Slack and email delegation', 'Progress without meetings', 'Decisions surfaced, not buried'],
    icon: Workflow,
    visual: 'delegate',
  },
  {
    number: '05',
    title: 'Review, approve, and scale',
    body: 'You review finished work, not process. Approve, give feedback once, and the playbook updates. Add employees as the workload grows and watch hours saved compound.',
    points: ['One-click approvals', 'Feedback becomes playbook', 'Utilisation and ROI analytics'],
    icon: FileCheck2,
    visual: 'analytics',
  },
];

const dayInLife = [
  { time: '06:40', title: 'Inbox triaged before you wake up', detail: 'Lumen sorts 84 messages into decide, delegate, and archive. Six need your voice.', icon: MessageSquare },
  { time: '07:30', title: 'Pipeline update in your DMs', detail: 'Ava posts tonight’s 20 outbound accounts, warm replies, and 3 meetings booked.', icon: Target },
  { time: '09:00', title: 'Support queue is already clear', detail: 'Kai resolved 112 tickets overnight. Four refunds wait on your approval.', icon: Users },
  { time: '11:30', title: 'Meeting brief in your hand', detail: 'Lumen prepares the investor sync brief with the two questions they always ask.', icon: CalendarClock },
  { time: '15:00', title: 'Data question answered', detail: 'Atlas replies to your churn question with the cohort split and a save-play list.', icon: Database },
  { time: '18:00', title: 'Tomorrow is set', detail: 'Your team schedules the next day, flags blockers, and goes quiet until needed.', icon: Clock },
];

const security = [
  {
    icon: Lock,
    title: 'Encrypted end to end',
    body: 'AES-256 at rest, TLS 1.3 in transit. Credentials are stored in an isolated vault with per-workspace keys.',
  },
  {
    icon: KeyRound,
    title: 'Scoped permissions',
    body: 'Each employee gets only the scopes it needs. Revoke any tool or action at any time from the dashboard.',
  },
  {
    icon: ScrollText,
    title: 'Complete audit trail',
    body: 'Every read, write, and send is logged with a timestamp, the employee, and the originating request.',
  },
  {
    icon: Fingerprint,
    title: 'No training on your data',
    body: 'Your content is never used to train shared models. Delete a workspace and its data is purged within 30 days.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise controls',
    body: 'SSO, SCIM, custom data residency, DPA, and annual penetration tests on the Scale plan.',
  },
  {
    icon: Braces,
    title: 'Human in the loop',
    body: 'Approval gates for sends, spend, and external communication. Nothing leaves without your policy saying so.',
  },
];

const visualFrame =
  'relative flex h-full flex-col justify-center overflow-hidden rounded-[22px] border border-white/12 bg-[#0b111f] p-5';

function PhaseVisual({ kind }: { kind: string }) {
  if (kind === 'roles') {
    return (
      <div className={visualFrame}>
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="relative space-y-2">
          {[
            { name: 'Ava', role: 'Sales Development', src: '/team/ava.jpg', accent: 'violet' as const, active: true },
            { name: 'Kai', role: 'Customer Support', src: '/team/kai.jpg', accent: 'mint' as const },
            { name: 'Atlas', role: 'Data Analyst', src: '/team/atlas.jpg', accent: 'sky' as const },
          ].map((row) => (
            <div
              key={row.name}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition',
                row.active
                  ? 'border-[#4d8dff]/40 bg-[#4d8dff]/10'
                  : 'border-white/12 bg-white/[0.025]',
              )}
            >
              <Avatar name={row.name} src={row.src} initials={row.name.slice(0, 1)} accent={row.accent} size="sm" />
              <div className="flex-1">
                <p className="text-[12px] font-medium text-white">{row.name}</p>
                <p className="text-[10.5px] text-[#a7b4c8]">{row.role}</p>
              </div>
              {row.active ? (
                <span className="rounded-full bg-[#4d8dff]/20 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#9cc0ff]">
                  selected
                </span>
              ) : (
                <span className="size-4 rounded-full border border-white/15" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'calibration') {
    return (
      <div className={visualFrame}>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#9aa7bd]">Calibration · 3 of 5</p>
        <div className="mt-4 space-y-4">
          {[
            { label: 'Tone', value: 'Direct, warm', pct: 72 },
            { label: 'Risk appetite', value: 'Moderate', pct: 46 },
            { label: 'Detail level', value: 'Thorough', pct: 84 },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-[#aab8cc]">{row.label}</span>
                <span className="text-[#d8e1ee]">{row.value}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#7aa8ff,#2a5fd6)]"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-white/12 bg-white/[0.03] p-2.5 text-[10px] leading-relaxed text-[#b8c5d7]">
          “Write like a founder, not a brochure. Escalate anything over $150.”
        </div>
      </div>
    );
  }

  if (kind === 'tools') {
    return (
      <div className={visualFrame}>
        <div className="relative grid grid-cols-2 gap-2">
          {['HubSpot', 'Gmail', 'Slack', 'Notion', 'Stripe', 'Calendly'].map((tool, index) => (
            <div
              key={tool}
              className={cn(
                'flex items-center justify-between rounded-lg border px-2.5 py-2 text-[10.5px]',
                index % 3 === 1
                  ? 'border-mint/25 bg-mint/[0.06] text-[#7aa8ff]'
                  : 'border-white/12 bg-white/[0.03] text-[#b9c6d9]',
              )}
            >
              {tool}
              {index % 3 === 1 ? <Check className="size-3 text-mint" /> : <Plug className="size-3 text-[#8d9bb1]" />}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[9.5px] text-[#9aa7bd]">4 connected · 2 available</p>
      </div>
    );
  }

  if (kind === 'delegate') {
    return (
      <div className={visualFrame}>
        <div className="space-y-2.5">
          <div className="ml-auto w-fit max-w-[90%] rounded-[22px] rounded-br-md bg-[#4d8dff]/18 px-3 py-2 text-[11px] text-[#e7edf7]">
            Prep the Q4 board deck narrative by Friday.
          </div>
          <div className="w-fit max-w-[92%] rounded-[22px] rounded-bl-md border border-white/12 bg-white/[0.04] px-3 py-2 text-[11px] text-[#ced8e6]">
            Got it. I will pull numbers from Atlas, the churn story from last month, and draft the
            narrative before slides. First pass tomorrow at 10.
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/12 bg-black/25 px-2.5 py-2">
            <span className="flex gap-0.5">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="size-1 animate-bounce rounded-full bg-[#7aa8ff]"
                  style={{ animationDelay: `${dot * 130}ms` }}
                />
              ))}
            </span>
            <span className="text-[9.5px] text-[#aab8cc]">Drafting · 62%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={visualFrame}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-white">Hours saved this month</p>
        <span className="rounded-full bg-mint/12 px-2 py-0.5 text-[9px] text-[#9cc0ff]">+22%</span>
      </div>
      <p className="mt-2 font-display text-[26px] font-semibold text-white">312h</p>
      <div className="mt-3 flex items-end gap-1.5">
        {[38, 54, 44, 68, 61, 78, 72, 86, 94].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-sm bg-[linear-gradient(180deg,rgba(77,141,255,0.9),rgba(139,92,246,0.12))]"
            style={{ height: `${height * 0.5}px` }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/12 pt-2.5 text-[9.5px] text-[#9aa7bd]">
        <span>3 employees</span>
        <span className="text-[#9cc0ff]">View analytics →</span>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <>
      <section className="page-section relative overflow-hidden pb-16 pt-24 md:pt-32">
        <HeroBackdrop />
        <div className="shell relative">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="eyebrow">
                <Sparkles className="size-3 text-[#7aa8ff]" /> How Nexora works
              </span>
            </Reveal>
            <Reveal delay={70}>
              <h1 className="mt-6 text-[clamp(2.3rem,5.4vw,4rem)] font-semibold leading-[1.02]">
                Hiring, without
                <br />
                <span className="text-gradient">the hiring process.</span>
              </h1>
            </Reveal>
            <Reveal delay={130}>
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[#b8c5d7] md:text-base">
                No job posts, no interview loops, no six-week ramp. Pick a role, calibrate it to your
                business, and assign the work you have been putting off.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink to="/signup" size="lg" iconRight={<ArrowRight className="size-4" />}>
                  Start free for 14 days
                </ButtonLink>
                <ButtonLink to="/employees" variant="secondary" size="lg">
                  Browse the roster
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-[22px] border border-white/12 bg-white/[0.045] backdrop-blur-xl px-6 py-4">
              {[
                { label: 'Set-up time', value: '4 minutes' },
                { label: 'First delivery', value: 'Same day' },
                { label: 'Tools supported', value: '40+' },
                { label: 'Decisions you make', value: 'Only the important ones' },
              ].map((item, index) => (
                <div key={item.label} className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-white">{item.value}</p>
                    <p className="text-[10.5px] uppercase tracking-[0.08em] text-[#9aa7bd]">{item.label}</p>
                  </div>
                  {index < 3 && <span className="hidden h-7 w-px bg-white/10 sm:block" />}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* phases */}
      <section className="page-section relative py-10 md:py-16">
        <div className="shell">
          <div className="relative space-y-4">
            {phases.map((phase, index) => (
              <Reveal key={phase.number} delay={index * 40}>
                <div className="grid gap-6 rounded-[22px] border border-white/12 bg-white/[0.045] backdrop-blur-xl p-5 transition-colors hover:border-white/14 md:grid-cols-[1.15fr_1fr] md:items-center md:p-7">
                  <div className={cn(index % 2 === 1 && 'md:order-2')}>
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl border border-[#4d8dff]/25 bg-[#4d8dff]/10 font-mono text-[11px] text-[#9cc0ff]">
                        {phase.number}
                      </span>
                      <phase.icon className="size-4 text-[#a7b4c8]" strokeWidth={1.7} />
                    </div>
                    <h2 className="mt-4 font-display text-[clamp(1.35rem,2.4vw,1.8rem)] font-semibold leading-snug">
                      {phase.title}
                    </h2>
                    <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-[#aab8cc]">{phase.body}</p>
                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                      {phase.points.map((point) => (
                        <li key={point} className="inline-flex items-center gap-1.5 text-[12px] text-[#cfd9e8]">
                          <Check className="size-3.5 text-mint" /> {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={cn('h-full min-h-[210px]', index % 2 === 1 && 'md:order-1')}>
                    <PhaseVisual kind={phase.visual} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* day in the life */}
      <section className="page-section relative overflow-hidden border-y border-white/10 py-20 md:py-28">
        <div className="absolute -right-40 top-10 -z-10">
          <SectionGlow tone="clay" />
        </div>
        <div className="shell relative">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                eyebrow="A day in the life"
                title={
                  <>
                    You sleep.
                    <br />
                    The work doesn’t.
                  </>
                }
                description="Nexora employees run on your priorities, not office hours. Here is what a Tuesday looks like with three of them on your team."
              />
              <Reveal delay={100}>
                <div className="panel mt-8 p-5">
                  <div className="flex items-center gap-2 text-[11px] text-[#aab8cc]">
                    <Clock className="size-3.5 text-[#7aa8ff]" /> Working hours
                  </div>
                  <p className="mt-2 font-display text-[22px] font-semibold text-white">24 / 7 / 365</p>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div
                        key={hour}
                        className={cn(
                          'h-5 flex-1 rounded-[2px]',
                          hour % 5 === 0 ? 'bg-[#4d8dff]/70' : 'bg-[#4d8dff]/25',
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex justify-between font-mono text-[9px] text-[#8d9bb1]">
                    <span>00</span>
                    <span>06</span>
                    <span>12</span>
                    <span>18</span>
                    <span>24</span>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="relative">
              <div className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-[#4d8dff]/50 via-white/10 to-transparent" />
              <div className="space-y-3">
                {dayInLife.map((item, index) => (
                  <Reveal key={item.time} delay={index * 50}>
                    <div className="relative flex gap-4">
                      <div className="relative z-10 mt-3 grid size-8 shrink-0 place-items-center rounded-full border border-white/10 bg-[#0b111f]">
                        <item.icon className="size-3.5 text-[#7aa8ff]" strokeWidth={1.7} />
                      </div>
                      <div className="flex-1 rounded-xl border border-white/12 bg-white/[0.045] backdrop-blur-xl p-4 transition-colors hover:border-white/14">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] font-medium text-white">{item.title}</p>
                          <span className="font-mono text-[10px] text-[#9aa7bd]">{item.time}</span>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-[#aab8cc]">{item.detail}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* integrations */}
      <section className="page-section relative py-20 md:py-28">
        <div className="shell">
          <SectionHeading
            eyebrow="Integrations"
            title="Lives where your work already lives."
            description="Native connections to the tools your team opens every day. One click to connect, scoped permissions, instant revoke."
            align="center"
          />
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {integrations.map((integration, index) => (
              <Reveal key={integration.name} delay={index * 25}>
                <div className="group flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.045] backdrop-blur-xl px-3 py-2.5 transition-all hover:border-[#4d8dff]/30 hover:bg-white/[0.04]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] font-display text-[11px] font-semibold text-[#9cc0ff]">
                    {integration.name[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] font-medium text-[#d8e1ee]">{integration.name}</p>
                    <p className="truncate text-[9px] uppercase tracking-[0.08em] text-[#8d9bb1]">
                      {integration.category}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <p className="mt-6 text-center text-[12px] text-[#9aa7bd]">
              Plus Google Sheets, Airtable, Segment, Linear, Ashby, and any REST API on Scale.{' '}
              <a href="#security" className="text-[#9cc0ff] hover:text-white">
                Read the security model <ChevronRight className="inline size-3" />
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* security */}
      <section id="security" className="page-section relative overflow-hidden border-y border-white/10 py-20 md:py-28">
        <div className="shell relative">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Trust & security"
                title={
                  <>
                    Autonomy with
                    <br />
                    a short leash.
                  </>
                }
                description="AI employees act only within the boundaries you set. Every action is visible, attributable, and reversible — because a teammate you cannot audit is a liability."
              />
              <Reveal delay={100}>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    { label: 'SOC 2', value: 'Type II' },
                    { label: 'Uptime', value: '99.9% SLA' },
                    { label: 'Data deletion', value: '30 days' },
                    { label: 'Encryption', value: 'AES-256' },
                  ].map((badge) => (
                    <div key={badge.label} className="rounded-xl border border-white/12 bg-white/[0.025] px-4 py-3">
                      <p className="font-display text-[15px] font-semibold text-white">{badge.value}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-[#9aa7bd]">{badge.label}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {security.map((item, index) => (
                <Reveal key={item.title} delay={index * 50}>
                  <div className="h-full rounded-[22px] border border-white/12 bg-white/[0.045] backdrop-blur-xl p-5">
                    <item.icon className="size-4 text-[#dae3f0]" strokeWidth={1.7} />
                    <h3 className="mt-3 font-display text-[14px] font-medium text-white">{item.title}</h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[#aab8cc]">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="page-section py-20 md:py-28">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionHeading
                eyebrow="Questions"
                title="The things teams ask first."
                description="Still unsure? Talk to a human on our team — we answer in under a day."
              />
              <Reveal delay={100}>
                <div className="mt-6 flex items-center gap-3 rounded-[22px] border border-white/12 bg-white/[0.045] backdrop-blur-xl p-4">
                  <div className="flex -space-x-2">
                    {['/team/nova.jpg', '/team/kai.jpg', '/team/atlas.jpg'].map((src) => (
                      <Avatar key={src} name="Nexora team" src={src} initials="NX" accent="violet" size="sm" className="ring-2 ring-[#0b111f]" />
                    ))}
                  </div>
                  <div className="text-[12px]">
                    <p className="text-[#d8e1ee]">Real humans, no sales theatre.</p>
                    <p className="text-[#9aa7bd]">Average reply: 3 hours</p>
                  </div>
                </div>
              </Reveal>
            </div>
            <Reveal delay={80}>
              <div className="panel px-5 md:px-7">
                <Accordion items={faqs.slice(0, 6)} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
