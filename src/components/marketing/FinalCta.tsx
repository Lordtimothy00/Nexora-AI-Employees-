import { ArrowRight, Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { useAuth } from '@/context/AuthContext';

export function FinalCta() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <div className="noise relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,#1b1d1f_0%,#121314_52%,#0d0e0f_100%)] px-6 py-14 text-center md:px-16 md:py-20">
            <div className="pointer-events-none absolute inset-x-24 -top-px h-px bg-gradient-to-r from-transparent via-[#d7f68c] to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d7f68c]/10" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d7f68c]/10" />
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
            <div className="pointer-events-none absolute -top-40 left-1/2 size-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,240,96,0.14),transparent_62%)]" />
            <div className="pointer-events-none absolute -bottom-48 right-0 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(245,245,243,0.07),transparent_65%)]" />

            <div className="relative mx-auto max-w-2xl">
              <div className="mb-5 flex justify-center">
                <span className="eyebrow">
                  <span className="size-1.5 rounded-full bg-mint shadow-[0_0_10px_2px_rgba(200,240,96,0.6)]" />
                  Taking applications now
                </span>
              </div>
              <h2 className="text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.05]">
                Your backlog called.
                <br />
                <span className="text-gradient">It would like a team.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[#adaeaa] md:text-base">
                Hire your first AI employee in four minutes. Delegate the work you keep postponing.
                See finished output before you decide to pay.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink
                  to={user ? '/dashboard' : '/signup'}
                  size="lg"
                  iconRight={<ArrowRight className="size-4" />}
                >
                  {user ? 'Open your workspace' : 'Start your 14-day trial'}
                </ButtonLink>
                <ButtonLink to="/employees" variant="secondary" size="lg">
                  Meet the team
                </ButtonLink>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[#9d9e9a]">
                {['No credit card', 'Cancel in one click', 'Keep every deliverable'].map((item) => (
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
