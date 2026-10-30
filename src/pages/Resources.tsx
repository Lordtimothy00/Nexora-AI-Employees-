import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  Clock,
  Compass,
  FileText,
  LifeBuoy,
  Play,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { HeroBackdrop } from '@/components/marketing/HeroBackdrop';
import { FinalCta } from '@/components/marketing/FinalCta';
import { Accordion } from '@/components/ui/Accordion';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { faqs } from '@/data/site';

const featured = [
  {
    category: 'Playbook',
    title: 'The first-week onboarding checklist for an AI employee',
    body: 'What to connect, what to calibrate, and the three tasks to hand over first so your employee is productive on day one.',
    read: '6 min read',
    icon: Compass,
    tint: 'rgba(77,141,255,0.16)',
  },
  {
    category: 'Guide',
    title: 'How to write a brief an AI can actually execute',
    body: 'The difference between “clean up our pipeline” and a brief that ships. Templates for briefs, reviews, and handoffs.',
    read: '8 min read',
    icon: FileText,
    tint: 'rgba(139,92,246,0.16)',
  },
  {
    category: 'Benchmark',
    title: 'Measuring ROI on your AI team',
    body: 'Hours reclaimed, response times, and pipeline touched — the four numbers we track with every customer.',
    read: '5 min read',
    icon: Play,
    tint: 'rgba(156,192,255,0.14)',
  },
];

const library = [
  {
    title: 'Documentation',
    body: 'Setup, calibration, permissions, and every dashboard screen explained.',
    meta: '24 articles',
    icon: BookOpen,
  },
  {
    title: 'API & integrations',
    body: 'Connect your CRM, helpdesk, inbox, or warehouse — or build a custom tool.',
    meta: '40+ integrations',
    icon: Braces,
  },
  {
    title: 'Security & trust',
    body: 'How scoped permissions, audit logs, and data retention actually work.',
    meta: 'SOC 2 Type II',
    icon: ShieldCheck,
  },
  {
    title: 'Templates',
    body: 'Briefs, playbooks, and QA rubrics you can hand to an employee today.',
    meta: '18 templates',
    icon: ScrollText,
  },
  {
    title: 'Customer stories',
    body: 'How teams from 6 to 600 people run their first AI employees.',
    meta: '12 stories',
    icon: Sparkles,
  },
  {
    title: 'Help center',
    body: 'Stuck on something? Search answers or talk to a human in minutes.',
    meta: 'Avg. reply 3m',
    icon: LifeBuoy,
  },
];

export function Resources() {
  return (
    <>
      {/* HERO */}
      <section className="page-section relative overflow-hidden pb-14 pt-24 md:pt-32">
        <HeroBackdrop />
        <div className="shell relative">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="eyebrow">
                <BookOpen className="size-3 text-[#9cc0ff]" />
                Resources
              </span>
            </Reveal>
            <Reveal delay={70}>
              <h1 className="mt-6 text-[clamp(2.4rem,5.4vw,4rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
                Everything you need to
                <br />
                <span className="text-gradient">run an AI team.</span>
              </h1>
            </Reveal>
            <Reveal delay={130}>
              <p className="mx-auto mt-6 max-w-xl text-[15.5px] leading-relaxed text-[#aab8cc] md:text-[16.5px]">
                Playbooks, templates, and benchmarks from teams already delegating real work to AI
                employees.
              </p>
            </Reveal>
            <Reveal delay={190}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink to="/employees" size="lg" iconRight={<ArrowRight className="size-4" />}>
                  Browse AI employees
                </ButtonLink>
                <ButtonLink to="/how-it-works" variant="secondary" size="lg">
                  See how it works
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="page-section relative py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            eyebrow="Start here"
            title="Three reads before you hire."
            description="Short, practical, and written by people who run AI employees every day."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {featured.map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <article className="glass group relative flex h-full flex-col overflow-hidden rounded-[22px] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/25">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full blur-2xl"
                    style={{ background: item.tint }}
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#9cc0ff]">
                      <item.icon className="size-3" />
                      {item.category}
                    </span>
                    <ArrowUpRight className="size-4 text-[#6f7f96] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                  </div>
                  <h3 className="relative mt-5 font-display text-[17px] font-semibold leading-snug text-white">
                    {item.title}
                  </h3>
                  <p className="relative mt-3 flex-1 text-[13.5px] leading-relaxed text-[#a3b1c6]">
                    {item.body}
                  </p>
                  <div className="relative mt-6 flex items-center gap-1.5 text-[11px] text-[#7f8ea6]">
                    <Clock className="size-3" />
                    {item.read}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LIBRARY */}
      <section className="page-section relative py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            eyebrow="Library"
            title="The whole shelf."
            description="Documentation, integrations, templates, and the trust center — all in one place."
            action={
              <ButtonLink
                to="/signup"
                variant="secondary"
                size="md"
                iconRight={<ArrowRight className="size-4" />}
              >
                Start free
              </ButtonLink>
            }
          />

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {library.map((item, index) => (
              <Reveal key={item.title} delay={index * 45}>
                <div className="glass group flex h-full items-start gap-4 rounded-[22px] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/25">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-[linear-gradient(140deg,rgba(77,141,255,0.22),rgba(139,92,246,0.18))] text-[#cfe0ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <item.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-[14.5px] font-medium text-white">
                        {item.title}
                      </h3>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7f8ea6]">
                        {item.meta}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#9dabc0]">
                      {item.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="page-section relative py-16 md:py-20">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <SectionHeading
              eyebrow="Questions"
              title="Answers, before you ask."
              description="The things teams want to know before their first hire."
            />
            <Reveal delay={80}>
              <Accordion items={faqs.slice(0, 5)} className="glass rounded-[22px] px-6" />
            </Reveal>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
