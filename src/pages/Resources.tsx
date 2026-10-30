import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  Clock,
  Compass,
  FileText,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroBackdrop } from '@/components/marketing/HeroBackdrop';
import { FinalCta } from '@/components/marketing/FinalCta';
import { Accordion } from '@/components/ui/Accordion';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { guides } from '@/data/resources';
import { faqs } from '@/data/site';

const guideIcons = {
  'first-week-checklist': Compass,
  'writing-a-brief': FileText,
  'measuring-roi': Play,
} as const;

const guideTints: Record<string, string> = {
  'first-week-checklist': 'rgba(11,211,154,0.16)',
  'writing-a-brief': 'rgba(18,227,192,0.16)',
  'measuring-roi': 'rgba(146,255,214,0.14)',
};

const library = [
  {
    title: 'Documentation',
    body: 'Pick a role, calibrate it, and understand every screen in the workspace.',
    meta: 'Step by step',
    icon: BookOpen,
    to: '/how-it-works',
  },
  {
    title: 'Integrations',
    body: 'Connect your CRM, helpdesk, inbox, or warehouse — or build a custom tool.',
    meta: '40+ native tools',
    icon: Braces,
    to: '/how-it-works#integrations',
  },
  {
    title: 'Security & trust',
    body: 'Scoped permissions, audit logs, and what happens to your data on day 30.',
    meta: 'SOC 2 Type II',
    icon: ShieldCheck,
    to: '/how-it-works#security',
  },
  {
    title: 'Customer stories',
    body: 'How teams from 6 to 600 people run their first AI employees.',
    meta: 'Real teams',
    icon: Sparkles,
    to: '/#customers',
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
                <BookOpen className="size-3 text-[#9df7c2]" />
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
              <p className="mx-auto mt-6 max-w-xl text-[15.5px] leading-relaxed text-[#aabbc2] md:text-[16.5px]">
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

      {/* FEATURED GUIDES */}
      <section className="page-section relative py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            eyebrow="Start here"
            title="Three reads before you hire."
            description="Short, practical, and written by people who run AI employees every day."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {guides.map((guide, index) => {
              const Icon = guideIcons[guide.slug as keyof typeof guideIcons] ?? FileText;

              return (
                <Reveal key={guide.slug} delay={index * 70}>
                  <Link
                    to={`/resources/${guide.slug}`}
                    className="glass group relative flex h-full flex-col overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-white/25"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full blur-2xl"
                      style={{ background: guideTints[guide.slug] }}
                    />
                    <div className="relative flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#9df7c2]">
                        <Icon className="size-3" />
                        {guide.category}
                      </span>
                      <ArrowUpRight className="size-4 text-[#8d9ea7] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                    </div>
                    <h3 className="relative mt-5 font-display text-[17px] font-semibold leading-snug text-white">
                      {guide.title}
                    </h3>
                    <p className="relative mt-3 flex-1 text-[13.5px] leading-relaxed text-[#a3b4bc]">
                      {guide.summary}
                    </p>
                    <div className="relative mt-6 flex items-center gap-1.5 text-[11px] text-[#8d9ea7]">
                      <Clock className="size-3" />
                      {guide.readTime}
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIBRARY */}
      <section className="page-section relative py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            eyebrow="Library"
            title="The whole shelf."
            description="Documentation, integrations, security, and the teams already running AI employees."
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

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {library.map((item, index) => (
              <Reveal key={item.title} delay={index * 45}>
                <Link
                  to={item.to}
                  className="glass group flex h-full items-start gap-4 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/25"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-[linear-gradient(140deg,rgba(11,211,154,0.22),rgba(18,227,192,0.18))] text-[#d6ffef] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <item.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-[14.5px] font-medium text-white">
                        {item.title}
                      </h3>
                      <ArrowUpRight className="size-3.5 shrink-0 text-[#8d9ea7] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#9daeb6]">{item.body}</p>
                    <span className="mt-2.5 inline-block font-mono text-[9px] uppercase tracking-[0.14em] text-[#2fe3b0]">
                      {item.meta}
                    </span>
                  </div>
                </Link>
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
              <Accordion items={faqs.slice(0, 5)} className="glass px-6" />
            </Reveal>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
