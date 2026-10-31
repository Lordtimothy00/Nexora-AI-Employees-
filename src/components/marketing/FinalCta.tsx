import { ArrowRight, Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { useAuth } from '@/context/AuthContext';

export function FinalCta() {
  const { user } = useAuth();

  return (
    <section className="page-section relative overflow-hidden py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <div className="noise glass-strong relative overflow-hidden rounded-[28px] px-6 py-14 text-center md:px-16 md:py-20">
            <div className="pointer-events-none absolute inset-x-24 -top-px h-px bg-gradient-to-r from-transparent via-[#2fe3b0] to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2fe3b0]/10" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2fe3b0]/10" />
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
            <div className="pointer-events-none absolute -top-40 left-1/2 size-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(11,211,154,0.14),transparent_62%)]" />
            <div className="pointer-events-none absolute -bottom-48 right-0 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(186,255,228,0.07),transparent_65%)]" />

            <div className="relative mx-auto max-w-2xl">
              <div className="mb-5 flex justify-center">
                <span className="eyebrow">
                  <span className="size-1.5 rounded-full bg-mint shadow-[0_0_10px_2px_rgba(11,211,154,0.6)]" />
                  Taking applications now
                </span>
              </div>
              <h2 className="text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.05]">
                Your backlog called.
                <br />
                <span className="text-gradient">It would like a team.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[#b8c8cd] md:text-base">
                Hire your first AI employee in four minutes. Delegate the work you keep postponing.
                See finished output before you decide to pay.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink
                  to={user ? '/dashboard' : '/signup'}
                  size="lg"
                  iconRight={<ArrowRight className="size-4" />}
                >
                  {user ? 'Open your workspace' : 'Start your 3-day free trial'}
                </ButtonLink>
                <ButtonLink to="/employees" variant="secondary" size="lg">
                  Meet the team
                </ButtonLink>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[#a7b7be]">
                {['Card required, charged after 3 days', 'Cancel in one click', 'Keep every deliverable'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check className="size-3 text-mint" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
