import { ArrowLeft, ArrowUpRight, Check, Clock, Quote } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { HeroBackdrop } from '@/components/marketing/HeroBackdrop';
import { FinalCta } from '@/components/marketing/FinalCta';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { getGuide } from '@/data/resources';

function ArticleMissing() {
  return (
    <section className="page-section relative overflow-hidden pb-24 pt-32 md:pt-40">
      <HeroBackdrop />
      <div className="shell relative">
        <div className="mx-auto max-w-lg text-center">
          <span className="eyebrow">404 · Resource</span>
          <h1 className="mt-6 text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.05]">
            That guide has moved.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[#aab8cc]">
            The resource you followed no longer exists. Everything current is on the resources
            index.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/resources" iconRight={<ArrowUpRight className="size-4" />}>
              Back to resources
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ResourceArticle() {
  const { slug } = useParams();
  const guide = getGuide(slug);

  if (!guide) return <ArticleMissing />;

  const related = guide.slug;

  return (
    <>
      <article>
        {/* HERO */}
        <section className="page-section relative overflow-hidden pb-10 pt-24 md:pt-32">
          <HeroBackdrop />
          <div className="shell relative">
            <div className="mx-auto max-w-2xl">
              <Reveal>
                <Link
                  to="/resources"
                  className="inline-flex items-center gap-2 text-[12px] font-medium text-[#8d9bb1] transition-colors hover:text-white"
                >
                  <ArrowLeft className="size-3.5" />
                  All resources
                </Link>
              </Reveal>

              <Reveal delay={60}>
                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#9cc0ff]">
                    {guide.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#8d9bb1]">
                    <Clock className="size-3" />
                    {guide.readTime}
                  </span>
                </div>
              </Reveal>

              <Reveal delay={110}>
                <h1 className="mt-5 text-[clamp(2rem,4.6vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
                  {guide.title}
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mt-5 text-[16px] leading-relaxed text-[#aab8cc]">{guide.summary}</p>
              </Reveal>

              <Reveal delay={210}>
                <div className="mt-8 h-px bg-gradient-to-r from-[#4d8dff]/60 via-[#8b5cf6]/35 to-transparent" />
              </Reveal>
            </div>
          </div>
        </section>

        {/* BODY */}
        <section className="page-section relative pb-16 pt-4 md:pb-20">
          <div className="shell">
            <div className="mx-auto max-w-2xl">
              <Reveal>
                <p className="text-[17px] leading-[1.75] text-[#dbe4f2]">{guide.intro}</p>
              </Reveal>

              {guide.sections.map((section, index) => (
                <Reveal key={section.heading} delay={index * 40}>
                  <div className="mt-12">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7aa8ff]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2 className="text-[clamp(1.3rem,2.2vw,1.7rem)] font-semibold leading-snug">
                        {section.heading}
                      </h2>
                    </div>

                    {section.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className="mt-4 text-[15.5px] leading-[1.75] text-[#aab8cc]"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.bullets && (
                      <ul className="mt-5 space-y-2.5">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-[15px] leading-relaxed text-[#aab8cc]">
                            <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#4d8dff]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.quote && (
                      <blockquote className="mt-6 flex gap-3 rounded-r-[14px] border-l-2 border-[#4d8dff]/70 bg-white/[0.04] py-4 pl-5 pr-4">
                        <Quote className="mt-0.5 size-4 shrink-0 text-[#7aa8ff]" aria-hidden="true" />
                        <p className="text-[15px] italic leading-relaxed text-[#d8e1ee]">
                          {section.quote}
                        </p>
                      </blockquote>
                    )}

                    {section.example && (
                      <div className="glass mt-6 overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                          <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#8d9bb1]">
                            {section.example.title}
                          </span>
                          <span className="size-1.5 rounded-full bg-[#4d8dff] shadow-[0_0_10px_2px_rgba(77,141,255,0.5)]" />
                        </div>
                        <pre className="overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-[1.7] text-[#ced8e6]">
                          {section.example.lines.join('\n')}
                        </pre>
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}

              {/* TAKEAWAYS */}
              <Reveal>
                <div className="glass-strong mt-14 p-6">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9cc0ff]">
                    What to take away
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {guide.takeaways.map((takeaway) => (
                      <li key={takeaway} className="flex gap-3 text-[14.5px] leading-relaxed text-[#dbe4f2]">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#4d8dff]/15">
                          <Check className="size-3 text-[#7aa8ff]" />
                        </span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal>
                <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
                  <p className="text-[13px] text-[#8d9bb1]">
                    Read next:{' '}
                    <Link
                      to={`/resources/${related === 'first-week-checklist' ? 'writing-a-brief' : 'first-week-checklist'}`}
                      className="font-medium text-[#9cc0ff] underline-offset-4 hover:underline"
                    >
                      {related === 'first-week-checklist'
                        ? 'How to write a brief an AI can execute'
                        : 'The first-week onboarding checklist'}
                    </Link>
                  </p>
                  <Link
                    to="/resources"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white transition-colors hover:text-[#9cc0ff]"
                  >
                    All resources
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </article>

      <FinalCta />
    </>
  );
}
