import { Fragment, useState } from 'react';
import { ArrowRight, Check, Minus, Sparkles, Star } from 'lucide-react';
import { HeroBackdrop } from '@/components/marketing/HeroBackdrop';
import { FinalCta } from '@/components/marketing/FinalCta';
import { Accordion } from '@/components/ui/Accordion';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { comparisonRows, faqs, plans, testimonials } from '@/data/site';
import { TestimonialCard } from '@/components/marketing/TestimonialCard';
import { cn } from '@/lib/utils';

const groups = Array.from(new Set(comparisonRows.map((row) => row.group ?? '')));

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-grid size-5 place-items-center rounded-full bg-mint/12">
        <Check className="size-3 text-mint" />
      </span>
    );
  }
  if (value === false) {
    return <Minus className="size-3.5 text-[#3f4356]" aria-label="Not included" />;
  }
  return <span className="text-[12px] text-[#b9bccb]">{value}</span>;
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden pb-14 pt-28 md:pt-36">
        <HeroBackdrop />
        <div className="shell relative">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="eyebrow">
                <Sparkles className="size-3 text-[#a78bfa]" /> Pricing
              </span>
            </Reveal>
            <Reveal delay={70}>
              <h1 className="mt-6 text-[clamp(2.3rem,5.4vw,4rem)] font-semibold leading-[1.02]">
                Hire a department
                <br />
                <span className="text-gradient">for less than a salary.</span>
              </h1>
            </Reveal>
            <Reveal delay={130}>
              <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[#9ea2b3] md:text-base">
                Flat monthly pricing. Every plan includes playbooks, integrations, approvals, and
                unlimited human seats. Start with 14 days free — no card required.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-8 flex flex-col items-center gap-3">
                <div
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1"
                  role="group"
                  aria-label="Billing period"
                >
                  <button
                    type="button"
                    onClick={() => setAnnual(false)}
                    aria-pressed={!annual}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-all',
                      !annual ? 'bg-white/[0.1] text-white shadow-sm' : 'text-[#8b8fa3] hover:text-white',
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnual(true)}
                    aria-pressed={annual}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-all',
                      annual ? 'bg-white/[0.1] text-white shadow-sm' : 'text-[#8b8fa3] hover:text-white',
                    )}
                  >
                    Annual
                    <span className="rounded-full bg-mint/15 px-1.5 py-0.5 text-[9.5px] text-[#8bf0d8]">
                      2 months free
                    </span>
                  </button>
                </div>
                <p className="text-[11.5px] text-[#6c7085]">
                  {annual ? 'Billed annually. Cancel or upgrade anytime, prorated.' : 'Billed monthly. Cancel in one click.'}
                </p>
              </div>
            </Reveal>
          </div>

          {/* plans */}
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 lg:grid-cols-3 lg:items-start">
            {plans.map((plan, index) => {
              const price = annual ? plan.annual : plan.monthly;
              return (
                <Reveal key={plan.id} delay={index * 80}>
                  <div
                    className={cn(
                      'relative flex h-full flex-col rounded-3xl border p-6',
                      plan.popular
                        ? 'border-[#7c5cff]/45 bg-[linear-gradient(165deg,rgba(124,92,255,0.16),rgba(15,18,25,0.9)_55%)] shadow-[0_30px_90px_-40px_rgba(124,92,255,0.7)] lg:-mt-3 lg:pb-8'
                        : 'border-white/10 bg-white/[0.02]',
                    )}
                  >
                    {plan.popular && (
                      <>
                        <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent" />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(100deg,#8b6dff,#5d7cff)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white shadow-[0_8px_24px_-8px_rgba(124,92,255,0.9)]">
                            <Star className="size-2.5 fill-white" /> Most teams pick this
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-[17px] font-semibold">{plan.name}</h2>
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#6c7085]">
                        {plan.employeeLimit}
                      </span>
                    </div>
                    <p className="mt-2 min-h-[40px] text-[12.5px] leading-relaxed text-[#8b8fa3]">
                      {plan.description}
                    </p>

                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="font-display text-[40px] font-semibold leading-none tracking-[-0.03em] text-white">
                        ${price}
                      </span>
                      <span className="text-[12.5px] text-[#8b8fa3]">/ month</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#6c7085]">
                      {annual ? `$${price * 12} billed yearly` : 'Billed monthly'} · {plan.taskLimit}
                    </p>

                    <ButtonLink
                      to={`/signup?plan=${plan.id}`}
                      size="lg"
                      variant={plan.popular ? 'primary' : 'secondary'}
                      className="mt-6 w-full"
                      iconRight={<ArrowRight className="size-4" />}
                    >
                      {plan.cta}
                    </ButtonLink>

                    <div className="my-5 h-px w-full bg-white/8" />

                    <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#6c7085]">
                      Includes
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-[#b9bccb]">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-mint" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={100}>
            <div className="mx-auto mt-6 flex max-w-5xl flex-col items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 sm:flex-row">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-[#7c5cff]/12 ring-1 ring-inset ring-[#7c5cff]/25">
                  <Sparkles className="size-3.5 text-[#c4b5fd]" />
                </span>
                <p className="text-[12.5px] text-[#a3a7b8]">
                  Need an extra seat mid-cycle? Add another AI employee for{' '}
                  <span className="text-white">$39/month</span> on any plan.
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6c7085]">
                Prorated automatically
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* comparison */}
      <section className="border-y border-white/6 bg-[#06070c]/60 py-16 md:py-24">
        <div className="shell">
          <SectionHeading
            eyebrow="Compare"
            title="Every detail, side by side."
            description="No hidden add-ons for the things that matter. If it is in the table, it is in the plan."
            align="center"
          />

          <Reveal delay={80}>
            <div className="mt-10 overflow-x-auto rounded-2xl border border-white/8 bg-[#080a10]">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/8">
                    <th scope="col" className="sticky left-0 z-10 bg-[#080a10] px-5 py-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#6c7085]">
                      Feature
                    </th>
                    {plans.map((plan) => (
                      <th key={plan.id} scope="col" className="px-4 py-4 text-center">
                        <span className={cn('text-[12.5px] font-medium', plan.popular ? 'text-white' : 'text-[#d3d5e0]')}>
                          {plan.name}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] text-[#6c7085]">
                          ${annual ? plan.annual : plan.monthly}/mo
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <Fragment key={group}>
                      <tr className="bg-white/[0.025]">
                        <th
                          scope="colgroup"
                          colSpan={4}
                          className="sticky left-0 px-5 py-2 text-left font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#7c8095]"
                        >
                          {group}
                        </th>
                      </tr>
                      {comparisonRows
                        .filter((row) => (row.group ?? '') === group)
                        .map((row) => (
                          <tr key={row.label} className="border-t border-white/6 transition-colors hover:bg-white/[0.015]">
                            <th scope="row" className="sticky left-0 z-10 bg-[#080a10] px-5 py-3 text-left text-[12.5px] font-normal text-[#a3a7b8]">
                              {row.label}
                            </th>
                            {row.values.map((value, index) => (
                              <td key={index} className="px-4 py-3 text-center">
                                <div className="flex justify-center">
                                  <CellValue value={value} />
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-[11.5px] text-[#6c7085]">
                All prices in USD. Taxes calculated at checkout. Annual plans renew at the same rate.
              </p>
              <ButtonLink to="/signup" size="sm" variant="secondary" iconRight={<ArrowRight className="size-3.5" />}>
                Start free trial
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* testimonial strip */}
      <section className="py-16 md:py-20">
        <div className="shell">
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <Reveal key={testimonial.name} delay={index * 60}>
                <TestimonialCard testimonial={testimonial} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/6 py-16 md:py-24">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionHeading
                eyebrow="Pricing questions"
                title="No asterisks."
                description="Everything about billing, data, and what happens when you cancel. If it is not here, ask us."
              />
              <Reveal delay={100}>
                <div className="mt-6 rounded-2xl border border-[#7c5cff]/25 bg-[linear-gradient(160deg,rgba(124,92,255,0.14),rgba(124,92,255,0.02))] p-5">
                  <p className="text-[12.5px] leading-relaxed text-[#cfc6ec]">
                    “We replaced a $7k/month agency with two Nexora employees. The savings paid for the
                    whole team in the first month.”
                  </p>
                  <p className="mt-3 text-[11px] text-[#8b8fa3]">Daniel Okonkwo · CEO, Northwind Pay</p>
                </div>
              </Reveal>
            </div>
            <Reveal delay={80}>
              <div className="panel px-5 md:px-7">
                <Accordion items={faqs} defaultOpen={null} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
