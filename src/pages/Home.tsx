import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BrainCircuit,
  CalendarCheck,
  Check,
  CircleDollarSign,
  Clock,
  Fingerprint,
  Gauge,
  Layers,
  MessageSquare,
  Plug,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { HeroBackdrop, SectionGlow } from '@/components/marketing/HeroBackdrop';
import { AppPreview } from '@/components/marketing/AppPreview';
import { EmployeeCard } from '@/components/marketing/EmployeeCard';
import { LogoMarquee } from '@/components/marketing/LogoMarquee';
import { FinalCta } from '@/components/marketing/FinalCta';
import { TestimonialCard } from '@/components/marketing/TestimonialCard';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Avatar } from '@/components/ui/Avatar';
import { featuredEmployees, employees } from '@/data/employees';
import { stats, testimonials } from '@/data/site';
import { useAuth } from '@/context/AuthContext';

const proofPeople = [
  { name: 'Sofia Marchetti', src: '/team/nova.jpg', initials: 'SM', accent: 'lilac' as const },
  { name: 'Daniel Okonkwo', src: '/team/atlas.jpg', initials: 'DO', accent: 'sky' as const },
  { name: 'Ava Chen', src: '/team/ava.jpg', initials: 'AC', accent: 'violet' as const },
  { name: 'Marcus Feld', src: '/team/lumen.jpg', initials: 'MF', accent: 'amber' as const },
];

const pillars = [
  {
    icon: Target,
    title: 'They own outcomes, not prompts',
    body: 'Each employee has a role, a playbook, and a definition of done. You assign the outcome; they handle the steps and come back with finished work.',
    accent: 'text-[#ffc08e]',
  },
  {
    icon: Plug,
    title: 'They work inside your stack',
    body: 'CRM, inbox, warehouse, ticketing, docs. Your employee reads context and takes action in the tools your team already uses — with permissions you set.',
    accent: 'text-[#d9d9a0]',
  },
  {
    icon: Fingerprint,
    title: 'They remember your business',
    body: 'Brand voice, past decisions, customer history, and your standards are part of every task. No re-explaining your company every morning.',
    accent: 'text-[#f2c08f]',
  },
];

const steps = [
  {
    n: '01',
    title: 'Choose the role',
    body: 'Eight specialised employees across sales, support, marketing, ops, finance, and people. Compare real deliverables, not feature lists.',
    icon: Users,
  },
  {
    n: '02',
    title: 'Connect and calibrate',
    body: 'Give them the tools and context they need. Five calibration questions set voice, limits, and what “done” looks like.',
    icon: Workflow,
  },
  {
    n: '03',
    title: 'Delegate and review',
    body: 'Assign work from Slack, email, or the dashboard. Approve what needs a human. Everything is logged, reversible, and measured.',
    icon: BadgeCheck,
  },
];

const capabilities = [
  {
    icon: MessageSquare,
    title: 'Slack-native delegation',
    body: 'Message your employee like a colleague. They reply with progress, decisions, and finished files.',
  },
  {
    icon: BrainCircuit,
    title: 'Shared company memory',
    body: 'Every employee learns from the same source of truth, so answers stay consistent across departments.',
  },
  {
    icon: ShieldCheck,
    title: 'Approval policies',
    body: 'Set spend limits and action gates. Anything outside policy arrives as a decision request, never a surprise.',
  },
  {
    icon: Gauge,
    title: 'Workforce analytics',
    body: 'See tasks delivered, hours saved, and utilisation per employee. Justify the spend in one screen.',
  },
  {
    icon: Layers,
    title: 'Custom playbooks',
    body: 'Encode how your best operator works. New hires inherit the playbook on day one.',
  },
  {
    icon: CircleDollarSign,
    title: 'Predictable cost',
    body: 'Flat monthly pricing per team. No seat sprawl, no agency retainers, no surprise token bills.',
  },
];

const miniChecks = ['Role, playbook, and limits defined', 'Tools connected in one click', 'First task delivered same day'];

export function Home() {
  const { user } = useAuth();
  const startingPrice = Math.min(...employees.map((employee) => employee.priceMonthly));

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden pb-10 pt-28 md:pt-36">
        <HeroBackdrop />
        <div className="shell relative">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="flex justify-center">
                <span className="eyebrow group cursor-default">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-mint" />
                  </span>
                  Hiring now · 8 AI employees available
                  <ArrowUpRight className="size-3 text-[#a68e80] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Reveal>

            <Reveal delay={70}>
              <h1 className="mt-6 text-[clamp(2.6rem,6.4vw,4.7rem)] font-semibold leading-[0.96] tracking-[-0.035em]">
                Hire AI employees
                <br className="hidden sm:block" /> who{' '}
                <span className="relative inline-block">
                  <span className="text-gradient">actually do</span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-[#dd6816]/60"
                    viewBox="0 0 300 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M2 9C60 3 150 2 298 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>{' '}
                the work.
              </h1>
            </Reveal>

            <Reveal delay={130}>
              <p className="mx-auto mt-7 max-w-xl text-[15.5px] leading-relaxed text-[#b7a296] md:text-[17px]">
                Nexora gives you a team of AI teammates for sales, support, marketing, and operations.
                Onboard in minutes, delegate real work, and get{' '}
                <span className="text-[#d9d9a0]">finished output</span> — not another chat transcript.
              </p>
            </Reveal>

            <Reveal delay={190}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink
                  to={user ? '/dashboard' : '/signup'}
                  size="lg"
                  iconRight={<ArrowRight className="size-4" />}
                  className="w-full sm:w-auto"
                >
                  {user ? 'Open your workspace' : `Hire your first AI — from $${startingPrice}/mo`}
                </ButtonLink>
                <ButtonLink
                  to="/employees"
                  variant="secondary"
                  size="lg"
                  className="w-full group sm:w-auto"
                  iconRight={<ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
                >
                  Meet the team
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={250}>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    {proofPeople.map((person) => (
                      <Avatar
                        key={person.name}
                        name={person.name}
                        src={person.src}
                        initials={person.initials}
                        accent={person.accent}
                        size="xs"
                        className="ring-2 ring-[#0b0402]"
                      />
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map((star) => (
                        <Star key={star} className="size-3 fill-[#e9b45f] text-[#e9b45f]" />
                      ))}
                      <span className="ml-1 text-[12px] font-medium text-white">4.9</span>
                    </div>
                    <p className="text-[11.5px] text-[#a68e80]">from 2,400+ teams</p>
                  </div>
                </div>
                <span className="hidden h-8 w-px bg-white/10 sm:block" />
                <p className="text-[12px] text-[#a68e80]">
                  14-day free trial · No credit card
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="mt-16 md:mt-20">
            <AppPreview />
          </Reveal>
        </div>
      </section>

      {/* ---------------- LOGOS ---------------- */}
      <section className="relative border-y border-white/6 bg-[#0f0604]/60 py-8">
        <div className="shell">
          <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
            <p className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#8a7365] md:max-w-[140px]">
              Trusted by teams who ship
            </p>
            <div className="w-full flex-1">
              <LogoMarquee />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- PILLARS ---------------- */}
      <section className="relative py-20 md:py-28">
        <div className="shell relative">
          <SectionHeading
            eyebrow="Not another chatbot"
            title={
              <>
                An employee has a job.
                <br />
                <span className="text-[#a28c80]">A chatbot has a window.</span>
              </>
            }
            description="Most AI tools wait for you to ask better questions. Nexora employees are hired into a role, given a playbook, and measured on the output."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar.title} delay={index * 80}>
                <div className="panel panel-hover group h-full p-6">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <pillar.icon className={`size-5 ${pillar.accent}`} strokeWidth={1.7} />
                  </div>
                  <h3 className="mt-5 font-display text-[17px] font-semibold leading-snug">{pillar.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#a28c80]">{pillar.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="panel mt-4 grid gap-8 overflow-hidden p-6 md:grid-cols-[1.05fr_1fr] md:p-10">
              <div className="flex flex-col justify-center">
                <span className="eyebrow w-fit">
                  <Clock className="size-3 text-[#ffa15c]" /> Onboarding, measured
                </span>
                <h3 className="mt-5 max-w-md text-[clamp(1.5rem,2.6vw,2.1rem)] font-semibold leading-[1.12]">
                  From “we should hire” to first delivery in under an hour.
                </h3>
                <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[#a28c80]">
                  No implementation project. No six-week onboarding. Pick a role, connect tools,
                  answer five questions, and assign the first real piece of work.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {miniChecks.map((check) => (
                    <li key={check} className="flex items-center gap-2.5 text-[13px] text-[#dbc9be]">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-mint/12 ring-1 ring-inset ring-mint/25">
                        <Check className="size-3 text-mint" />
                      </span>
                      {check}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/how-it-works"
                  className="mt-7 inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-[#ffc08e] transition-colors hover:text-white"
                >
                  See how onboarding works
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#160a06] p-5">
                <div className="absolute inset-0 bg-dots opacity-40" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#998173]">Hire · step 3 of 3</p>
                    <span className="rounded-full bg-mint/12 px-2 py-0.5 text-[10px] text-[#d9d9a0]">Ready</span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Avatar name="Ava" src="/team/ava.jpg" initials="AV" accent="violet" size="lg" status="online" glow />
                    <div>
                      <p className="font-display text-[16px] font-semibold text-white">Ava · Sales Development Rep</p>
                      <p className="text-[11.5px] text-[#a28c80]">Calibrated on your voice and ICP</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    {[
                      { label: 'Brand voice', value: 'Confident, concise' },
                      { label: 'Tools connected', value: 'HubSpot · Gmail · Slack' },
                      { label: 'Daily task limit', value: '40 prospects' },
                      { label: 'Approval gate', value: 'Before any send' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2"
                      >
                        <span className="text-[11.5px] text-[#a68e80]">{row.label}</span>
                        <span className="text-[11.5px] font-medium text-[#e9d8ce]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#dd6816]/25 bg-[#dd6816]/10 px-3 py-2.5">
                    <Sparkles className="size-3.5 text-[#ffc08e]" />
                    <p className="text-[11.5px] text-[#ffe1c8]">Ava started her first task 4 minutes ago.</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- TEAM ---------------- */}
      <section className="relative overflow-hidden py-4 md:py-10" id="team">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2">
          <SectionGlow tone="ember" />
        </div>
        <div className="shell">
          <SectionHeading
            eyebrow="The roster"
            title={
              <>
                Meet the team you can
                <br className="hidden sm:block" /> hire today.
              </>
            }
            description="Every employee is specialised, calibrated to your business, and priced like a subscription — not a headcount."
            action={
              <ButtonLink to="/employees" variant="secondary" iconRight={<ArrowRight className="size-3.5" />}>
                Browse all {employees.length} employees
              </ButtonLink>
            }
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredEmployees.map((employee, index) => (
              <Reveal key={employee.id} delay={index * 70}>
                <EmployeeCard employee={employee} index={index} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={100}>
            <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 sm:flex-row">
              <p className="text-[13px] text-[#a28c80]">
                Plus specialists in content, talent, finance, and executive operations.
              </p>
              <Link
                to="/employees"
                className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-white"
              >
                See every role and deliverable
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="relative py-20 md:py-28" id="how-it-works">
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="How it works"
                title={
                  <>
                    Three steps.
                    <br />
                    One new department.
                  </>
                }
                description="You do not configure software. You hire someone and tell them what needs to happen."
              />
              <Reveal delay={100}>
                <div className="panel mt-8 p-5">
                  <div className="flex items-center gap-2 text-[11.5px] text-[#a28c80]">
                    <span className="flex size-6 items-center justify-center rounded-md bg-[#dd6816]/15 ring-1 ring-inset ring-[#dd6816]/25">
                      <MessageSquare className="size-3 text-[#ffc08e]" />
                    </span>
                    Direct message · Ava
                  </div>
                  <div className="mt-3 space-y-2.5">
                    <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#dd6816]/18 px-3.5 py-2 text-[12.5px] text-[#ffe7d3]">
                      Need 12 qualified meetings by Nov 15. Mid-market fintech ops.
                    </div>
                    <div className="w-fit max-w-[88%] rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.04] px-3.5 py-2 text-[12.5px] text-[#dbc9be]">
                      240 accounts matched, 61 already in CRM. Sequence drafted in your voice — 9.4%
                      reply rate on v1. First 20 send at 8:10am.
                    </div>
                    <div className="flex items-center gap-1.5 pl-1 text-[10.5px] text-[#998173]">
                      <span className="size-1.5 rounded-full bg-mint" /> Delivered · 3 meetings booked
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="relative">
              <div className="absolute left-[27px] top-6 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-[#dd6816]/50 via-white/10 to-transparent sm:block" />
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <Reveal key={step.n} delay={index * 90}>
                    <div className="group relative flex gap-5 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.035] sm:p-6">
                      <div className="relative hidden size-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-[#180b07] shadow-[inset_0_1px_0_rgba(255,244,236,0.08)] sm:grid">
                        <step.icon className="size-5 text-[#ffa15c]" strokeWidth={1.6} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[10px] tracking-[0.18em] text-[#998173]">{step.n}</span>
                          <span className="h-px w-5 bg-white/15" />
                        </div>
                        <h3 className="mt-2 font-display text-[17px] font-semibold">{step.title}</h3>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-[#a28c80]">{step.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={200}>
                <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/8 bg-[#160a06] px-5 py-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#998173]">
                    Works with
                  </span>
                  {['Slack', 'HubSpot', 'Notion', 'Zendesk', 'Stripe', 'Snowflake'].map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-[#bea99c]"
                    >
                      {tool}
                    </span>
                  ))}
                  <span className="text-[11px] text-[#8a7365]">+ 40 more</span>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CAPABILITIES ---------------- */}
      <section className="relative overflow-hidden border-y border-white/6 bg-[#100604] py-20 md:py-28">
        <div className="absolute -left-40 top-20 -z-10">
          <SectionGlow tone="olive" />
        </div>
        <div className="shell relative">
          <SectionHeading
            eyebrow="The workspace"
            title={
              <>
                One dashboard.
                <br className="hidden sm:block" /> An entire operating bench.
              </>
            }
            description="Everything you need to hire, brief, supervise, and measure a workforce that runs on your rules."
            align="center"
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability, index) => (
              <Reveal key={capability.title} delay={index * 60}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-all duration-300 hover:border-[#dd6816]/30 hover:bg-white/[0.04]">
                  <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-[#dd6816]/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                  <capability.icon className="size-5 text-[#ffa15c]" strokeWidth={1.6} />
                  <h3 className="mt-4 font-display text-[15px] font-semibold">{capability.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#a28c80]">{capability.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={100}>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/8 bg-[linear-gradient(160deg,rgba(255,244,236,0.045),rgba(255,244,236,0.01))] px-5 py-6 text-center"
                >
                  <p className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold text-white">{stat.value}</p>
                  <p className="mt-1 text-[11.5px] uppercase tracking-[0.08em] text-[#a68e80]">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="relative py-20 md:py-28" id="customers">
        <div className="shell">
          <SectionHeading
            eyebrow="Customers"
            title="Teams that stopped doing busywork."
            description="Real outcomes from teams who hired their first AI employee and never went back to the backlog."
            action={
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2">
                <Star className="size-3.5 fill-[#e9b45f] text-[#e9b45f]" />
                <span className="text-[12.5px] font-medium text-white">4.9 / 5</span>
                <span className="text-[11.5px] text-[#a68e80]">2,400+ reviews</span>
              </div>
            }
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Reveal key={testimonial.name} delay={index * 60}>
                <TestimonialCard testimonial={testimonial} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- PRICING TEASER ---------------- */}
      <section className="relative pb-4">
        <div className="shell">
          <Reveal>
            <div className="panel-ember relative overflow-hidden p-6 md:p-10">
              <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-[radial-gradient(circle,rgba(221,104,22,0.22),transparent_65%)]" />
              <div className="relative grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
                <div>
                  <span className="eyebrow">
                    <Zap className="size-3 text-[#ffa15c]" /> Simple pricing
                  </span>
                  <h2 className="mt-5 text-[clamp(1.7rem,3.4vw,2.5rem)] font-semibold leading-[1.08]">
                    A full-time hire costs $6,000 a month.
                    <br />
                    <span className="text-[#a28c80]">An AI employee starts at ${startingPrice}.</span>
                  </h2>
                  <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[#a28c80]">
                    No per-seat maths, no token roulette. Pick a plan, hire your team, and cancel any
                    time. Every plan includes playbooks, integrations, and human-in-the-loop approvals.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <ButtonLink to="/pricing" size="lg" iconRight={<ArrowRight className="size-4" />}>
                    Compare plans
                  </ButtonLink>
                  <ButtonLink to="/signup" variant="secondary" size="lg" iconLeft={<Sparkles className="size-4" />}>
                    Start free for 14 days
                  </ButtonLink>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-[#a68e80]">
                    <span className="inline-flex items-center gap-1"><Check className="size-3 text-mint" /> No card required</span>
                    <span className="inline-flex items-center gap-1"><CalendarCheck className="size-3 text-mint" /> Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
