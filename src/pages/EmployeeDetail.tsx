import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe2,
  Languages,
  MessageSquare,
  Plug,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { EmployeeCard } from '@/components/marketing/EmployeeCard';
import { HeroBackdrop } from '@/components/marketing/HeroBackdrop';
import { accentClasses, employees, getEmployeeBySlug } from '@/data/employees';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'work', label: 'Sample work' },
  { id: 'integrations', label: 'Integrations' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function EmployeeDetail() {
  const { slug = '' } = useParams();
  const employee = getEmployeeBySlug(slug);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hires, hire, release } = useWorkspace();
  const [tab, setTab] = useState<TabId>('overview');
  const [justHired, setJustHired] = useState(false);

  const isHired = Boolean(user) && employee ? hires.some((entry) => entry.employeeId === employee.id) : false;

  useEffect(() => {
    setTab('overview');
    setJustHired(false);
  }, [slug]);

  useEffect(() => {
    if (!justHired) return;
    const timer = setTimeout(() => setJustHired(false), 6000);
    return () => clearTimeout(timer);
  }, [justHired]);

  const related = useMemo(() => {
    if (!employee) return [];
    const sameDepartment = employees.filter(
      (entry) => entry.id !== employee.id && entry.department === employee.department,
    );
    const others = employees.filter(
      (entry) => entry.id !== employee.id && entry.department !== employee.department,
    );
    return [...sameDepartment, ...others].slice(0, 3);
  }, [employee]);

  if (!employee) {
    return (
      <section className="shell flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
        <span className="eyebrow">404 · Role not found</span>
        <h1 className="mt-6 text-3xl font-semibold">That employee is not on the roster.</h1>
        <p className="mt-3 max-w-md text-[14px] text-[#8b8fa3]">
          They may have been renamed or the link is out of date. Browse the full team to find the
          right specialist.
        </p>
        <ButtonLink to="/employees" className="mt-6" iconLeft={<ArrowLeft className="size-4" />}>
          Back to all employees
        </ButtonLink>
      </section>
    );
  }

  const tone = accentClasses[employee.accent];

  const handleHire = () => {
    if (!user) {
      try {
        sessionStorage.setItem('nexora.pendingHire', employee.id);
      } catch {
        /* ignore */
      }
      navigate('/signup?intent=hire');
      return;
    }
    hire(employee.id);
    setJustHired(true);
  };

  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-24 md:pt-32">
        <HeroBackdrop />
        <div className="shell relative">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[#6c7085]">
            <Link to="/employees" className="transition-colors hover:text-white">
              AI Employees
            </Link>
            <ChevronRight className="size-3" />
            <Link to={`/employees?department=${employee.department}`} className="transition-colors hover:text-white">
              {employee.department}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-[#a3a7b8]">{employee.name}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <Avatar
                  name={employee.name}
                  src={employee.avatar}
                  initials={employee.initials}
                  accent={employee.accent}
                  size="xl"
                  status="online"
                  glow
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ring-1 ring-inset',
                        tone.bg,
                        tone.text,
                        tone.ring,
                      )}
                    >
                      {employee.department}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/25 bg-mint/[0.07] px-2.5 py-1 text-[10.5px] text-[#8bf0d8]">
                      <span className="size-1.5 rounded-full bg-mint" /> {employee.availability}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#9296a8]">
                      AI employee
                    </span>
                  </div>
                  <h1 className="mt-4 font-display text-[clamp(2.2rem,4.6vw,3.4rem)] font-semibold leading-[1.02]">
                    {employee.name}
                  </h1>
                  <p className="mt-1 text-[16px] text-[#b9bccb] md:text-lg">{employee.role}</p>
                  <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#8b8fa3]">
                    {employee.tagline}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#9296a8]">
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="size-3.5 fill-[#ffb86b] text-[#ffb86b]" />
                      <span className="font-medium text-white">{employee.rating.toFixed(1)}</span>
                      <span className="text-[#6c7085]">rating</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 text-[#7c8095]" />
                      {employee.deployments.toLocaleString()} teams
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 text-[#7c8095]" />
                      Replies {employee.responseTime.toLowerCase()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Languages className="size-3.5 text-[#7c8095]" />
                      {employee.languages.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Tasks delivered', value: employee.tasksCompleted.toLocaleString() },
                  { label: 'Hours saved / wk', value: `${employee.hoursSavedPerWeek}h` },
                  { label: 'First response', value: employee.responseTime.replace('Under ', '<') },
                  { label: 'Monthly from', value: `$${employee.priceMonthly}` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
                    <p className="font-display text-[18px] font-semibold text-white">{stat.value}</p>
                    <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.08em] text-[#6c7085]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hire card */}
            <div className="lg:sticky lg:top-24">
              <div className="panel relative overflow-hidden p-5 md:p-6">
                <div
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-gradient-to-br opacity-30 blur-3xl',
                    tone.glow,
                  )}
                />
                <div className="relative">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6c7085]">
                        Hire {employee.name}
                      </p>
                      <p className="mt-2 flex items-baseline gap-1.5">
                        <span className="font-display text-[32px] font-semibold leading-none text-white">
                          ${employee.priceMonthly}
                        </span>
                        <span className="text-[12.5px] text-[#8b8fa3]">/ month</span>
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-[#9296a8]">
                      Included in Growth
                    </span>
                  </div>

                  {isHired ? (
                    <div className="mt-5 space-y-2.5">
                      <div className="flex items-center gap-2 rounded-xl border border-mint/25 bg-mint/[0.07] px-3.5 py-3">
                        <CheckCircle2 className="size-4 shrink-0 text-mint" />
                        <p className="text-[12.5px] text-[#b7f5e7]">
                          {employee.name} is already on your team.
                        </p>
                      </div>
                      <ButtonLink to="/dashboard/team" size="lg" className="w-full" iconRight={<ArrowRight className="size-4" />}>
                        Open your workspace
                      </ButtonLink>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[12px] text-[#7c8095] hover:text-rose-300"
                        onClick={() => release(employee.id)}
                      >
                        Remove from team
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="mt-5 w-full"
                        onClick={handleHire}
                        iconRight={<ArrowRight className="size-4" />}
                      >
                        {user ? `Hire ${employee.name}` : 'Start free and hire'}
                      </Button>
                      <p className="mt-3 text-center text-[11px] text-[#6c7085]">
                        14-day trial · No card required · Cancel anytime
                      </p>
                    </>
                  )}

                  <div className="my-5 h-px w-full bg-white/8" />

                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6c7085]">
                    What you get
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      `${employee.role} fully calibrated to your business`,
                      'Unlimited revisions on any deliverable',
                      `${employee.tools.length} native tool integrations`,
                      'Human-in-the-loop approval policies',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-[#b9bccb]">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-mint" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/8 bg-[#0a0c13] px-3.5 py-3">
                    <ShieldCheck className="size-4 shrink-0 text-[#a9cdff]" />
                    <p className="text-[11px] leading-relaxed text-[#8b8fa3]">
                      Every action logged and reversible. Data never used to train shared models.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTab('work')}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 text-[12px] text-[#c4b5fd] transition-colors hover:text-white"
                  >
                    <Sparkles className="size-3" /> See {employee.name}&apos;s sample work
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-2 text-[11.5px] text-[#8b8fa3]">
                  <Users className="size-3.5" />
                  Hired by {employee.deployments.toLocaleString()} teams
                </div>
                <div className="flex -space-x-1.5">
                  {['/team/nova.jpg', '/team/kai.jpg', '/team/mira.jpg'].map((src, index) => (
                    <span
                      key={src}
                      className="size-5 overflow-hidden rounded-full border border-[#0a0c13] bg-white/10"
                    >
                      <img src={src} alt="" className="size-full object-cover" />
                      <span className="sr-only">Customer {index + 1}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="relative border-y border-white/6 bg-[#06070c]/60">
        <div className="shell">
          <div className="scroll-thin flex gap-1 overflow-x-auto">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-pressed={tab === item.id}
                className={cn(
                  'relative shrink-0 px-4 py-4 text-[13px] font-medium transition-colors',
                  tab === item.id ? 'text-white' : 'text-[#7c8095] hover:text-[#c3c6d4]',
                )}
              >
                {item.label}
                {tab === item.id && (
                  <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-[linear-gradient(90deg,#a78bfa,#5d7cff)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="shell">
          {tab === 'overview' && (
            <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
              <div className="space-y-10">
                <Reveal>
                  <div>
                    <h2 className="font-display text-[22px] font-semibold">About {employee.name}</h2>
                    <p className="mt-3 text-[14.5px] leading-[1.75] text-[#a3a7b8]">{employee.bio}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {employee.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11.5px] text-[#b9bccb]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={60}>
                  <div>
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="size-4 text-[#a78bfa]" />
                      <h2 className="font-display text-[22px] font-semibold">What {employee.name} delivers</h2>
                    </div>
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {employee.deliverables.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.025] p-3.5 text-[13px] leading-relaxed text-[#b9bccb]"
                        >
                          <Check className="mt-0.5 size-4 shrink-0 text-mint" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-[#a78bfa]" />
                      <h2 className="font-display text-[22px] font-semibold">A real working session</h2>
                    </div>
                    <p className="mt-2 text-[13px] text-[#7c8095]">
                      Excerpt from a workspace conversation with {employee.name}.
                    </p>
                    <div className="panel mt-4 space-y-3 p-4 md:p-5">
                      {employee.sampleConversation.map((turn, index) => (
                        <div
                          key={index}
                          className={cn('flex', turn.from === 'human' ? 'justify-end' : 'justify-start')}
                        >
                          <div className="flex max-w-[88%] items-end gap-2">
                            {turn.from === 'employee' && (
                              <Avatar
                                name={employee.name}
                                src={employee.avatar}
                                initials={employee.initials}
                                accent={employee.accent}
                                size="xs"
                                className="mb-0.5"
                              />
                            )}
                            <div
                              className={cn(
                                'rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed',
                                turn.from === 'human'
                                  ? 'rounded-br-md bg-[#7c5cff]/18 text-[#e6deff]'
                                  : 'rounded-bl-md border border-white/8 bg-white/[0.045] text-[#c9ccd9]',
                              )}
                            >
                              {turn.from === 'employee' && (
                                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#7c8095]">
                                  {employee.name}
                                </p>
                              )}
                              {turn.text}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pl-9 text-[10.5px] text-[#5f6376]">
                        <span className="size-1.5 rounded-full bg-mint" /> Session logged · 4 min
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>

              <aside className="space-y-4">
                <Reveal>
                  <div className="panel p-5">
                    <h3 className="font-display text-[15px] font-semibold">Calibration profile</h3>
                    <div className="mt-4 space-y-3">
                      {[
                        { label: 'Works best on', value: employee.tags.join(', ') },
                        { label: 'Typical turnaround', value: employee.responseTime.replace('Under ', 'Under ') },
                        { label: 'Languages', value: employee.languages.join(', ') },
                        { label: 'Approval required', value: 'Sends, spend, and external comms' },
                      ].map((row) => (
                        <div key={row.label} className="flex items-start justify-between gap-4 border-b border-white/6 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-[11.5px] text-[#6c7085]">{row.label}</span>
                          <span className="max-w-[60%] text-right text-[11.5px] font-medium text-[#c9ccd9]">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={60}>
                  <div className="panel p-5">
                    <h3 className="font-display text-[15px] font-semibold">Tool access</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {employee.tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-[#b9bccb]"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('integrations')}
                      className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-[#c4b5fd] hover:text-white"
                    >
                      Integration details <ArrowRight className="size-3" />
                    </button>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <div className="rounded-2xl border border-[#7c5cff]/25 bg-[linear-gradient(160deg,rgba(124,92,255,0.14),rgba(124,92,255,0.02))] p-5">
                    <Zap className="size-4 text-[#c4b5fd]" />
                    <p className="mt-3 text-[13px] leading-relaxed text-[#cfc6ec]">
                      Pair {employee.name} with a second employee and share context across both. Most
                      teams hire two within the first month.
                    </p>
                    <ButtonLink to="/pricing" variant="subtle" size="sm" className="mt-4">
                      See team plans
                    </ButtonLink>
                  </div>
                </Reveal>
              </aside>
            </div>
          )}

          {tab === 'capabilities' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {employee.skills.map((skill, index) => (
                <Reveal key={skill} delay={index * 40}>
                  <div className="panel h-full p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5f6376]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <CheckCircle2 className="size-4 text-mint/80" />
                    </div>
                    <p className="mt-3 font-display text-[14.5px] font-medium text-white">{skill}</p>
                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={cn('h-full rounded-full bg-gradient-to-r', tone.gradient)}
                        style={{ width: `${72 + ((index * 7) % 26)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[10.5px] text-[#6c7085]">Calibrated to your playbook</p>
                  </div>
                </Reveal>
              ))}
              <Reveal delay={200}>
                <div className="panel flex h-full flex-col justify-center p-5">
                  <h3 className="font-display text-[15px] font-semibold">Need something custom?</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[#8b8fa3]">
                    Growth and Scale workspaces can extend any employee with a custom playbook or
                    internal API.
                  </p>
                  <ButtonLink to="/pricing" variant="secondary" size="sm" className="mt-4 w-fit">
                    Explore Scale
                  </ButtonLink>
                </div>
              </Reveal>
            </div>
          )}

          {tab === 'work' && (
            <div className="grid gap-4 lg:grid-cols-2">
              {employee.sampleWork.map((work, index) => (
                <Reveal key={work.title} delay={index * 70}>
                  <div className="panel h-full overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3.5">
                      <div>
                        <p className="font-display text-[14px] font-medium text-white">{work.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#6c7085]">
                          {work.meta}
                        </p>
                      </div>
                      <span className="rounded-full border border-mint/25 bg-mint/[0.07] px-2 py-0.5 text-[9.5px] uppercase tracking-wider text-[#8bf0d8]">
                        Delivered
                      </span>
                    </div>
                    <pre className="scroll-thin max-h-[320px] overflow-auto whitespace-pre-wrap px-5 py-4 font-sans text-[12.5px] leading-[1.8] text-[#b3b7c6]">
{work.body}
                    </pre>
                  </div>
                </Reveal>
              ))}
              <Reveal delay={140}>
                <div className="panel flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-[#a78bfa]" />
                    <p className="max-w-md text-[12.5px] leading-relaxed text-[#9ea2b3]">
                      These are real outputs generated during a calibration run. Your employee learns
                      your standards from every review you give.
                    </p>
                  </div>
                  <ButtonLink to="/signup" size="sm" className="shrink-0">
                    Try it yourself
                  </ButtonLink>
                </div>
              </Reveal>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div>
                <h2 className="font-display text-[22px] font-semibold">Native connections</h2>
                <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[#8b8fa3]">
                  {employee.name} works inside these tools with scoped permissions. Connect once at
                  onboarding; every action appears in the audit log.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {employee.tools.map((tool, index) => (
                    <Reveal key={tool} delay={index * 40}>
                      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3.5">
                        <span className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] font-display text-[13px] font-semibold text-[#c4b5fd]">
                          {tool[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-white">{tool}</p>
                          <p className="text-[10.5px] text-[#6c7085]">Read & write · scoped</p>
                        </div>
                        <Plug className="size-3.5 text-mint" />
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
              <aside className="space-y-3">
                <div className="panel p-5">
                  <h3 className="font-display text-[15px] font-semibold">Permissions</h3>
                  <ul className="mt-3 space-y-2.5 text-[12px] text-[#9ea2b3]">
                    {[
                      'Read: CRM records, inbox threads, docs',
                      'Write: drafts only until approved',
                      'Spend: blocked above policy limit',
                      'Export: logged and rate-limited',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#a9cdff]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="panel p-5">
                  <div className="flex items-center gap-2">
                    <Globe2 className="size-4 text-[#8bf0d8]" />
                    <h3 className="font-display text-[15px] font-semibold">Need a custom API?</h3>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#8b8fa3]">
                    Scale workspaces can expose internal endpoints as tools with request-level audit
                    logs.
                  </p>
                  <ButtonLink to="/pricing" variant="secondary" size="sm" className="mt-4 w-full">
                    See Scale plan
                  </ButtonLink>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {/* Related */}
      <section className="border-t border-white/6 bg-[#06070c]/60 py-14">
        <div className="shell">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6c7085]">
                Build a team
              </p>
              <h2 className="mt-2 font-display text-[22px] font-semibold">Employees who pair well with {employee.name}</h2>
            </div>
            <Link
              to="/employees"
              className="hidden items-center gap-1.5 text-[12.5px] text-[#c4b5fd] transition hover:text-white sm:inline-flex"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry, index) => (
              <Reveal key={entry.id} delay={index * 60}>
                <EmployeeCard employee={entry} index={index} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Hire toast */}
      {justHired && (
        <div className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-rise">
          <div className="flex items-start gap-3 rounded-2xl border border-mint/30 bg-[#08130f]/95 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,1)] backdrop-blur-xl">
            <Avatar
              name={employee.name}
              src={employee.avatar}
              initials={employee.initials}
              accent={employee.accent}
              size="sm"
              status="online"
            />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-white">{employee.name} is on your team.</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#9fc9bd]">
                First task queued. Head to your workspace to assign briefs and set approvals.
              </p>
              <Link
                to="/dashboard"
                className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#8bf0d8] hover:text-white"
              >
                Open dashboard <ArrowRight className="size-3" />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setJustHired(false)}
              aria-label="Dismiss"
              className="grid size-6 place-items-center rounded-full text-[#6c7085] hover:bg-white/10 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {!user && (
        <div className="sr-only" aria-live="polite">
          Sign in to hire {employee.name}
        </div>
      )}
    </>
  );
}
