import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Star } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  aside,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-white/8 bg-[#0b0c0d] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_75%)]" />
        <div className="pointer-events-none absolute -left-32 top-1/4 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(245,245,243,0.08),transparent_65%)]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 size-[620px] rounded-full opacity-50 blur-[40px] [background:conic-gradient(from_200deg_at_50%_50%,transparent_0deg,rgba(245,245,243,0.16)_70deg,transparent_150deg,rgba(200,240,96,0.16)_230deg,transparent_320deg)]" />
        <div className="noise absolute inset-0" />
        <div className="pointer-events-none absolute -bottom-40 right-0 size-[480px] rounded-full bg-[radial-gradient(circle,rgba(200,240,96,0.08),transparent_65%)]" />

        <div className="relative">
          <Logo />
          <Link
            to="/"
            className="mt-10 inline-flex items-center gap-1.5 text-[12px] text-[#9d9e9a] transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" /> Back to nexora.ai
          </Link>
        </div>

        <div className="relative my-10 max-w-md">
          <div className="mb-6 flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((star) => (
              <Star key={star} className="size-3.5 fill-[#d3d5cd] text-[#d3d5cd]" />
            ))}
            <span className="ml-2 text-[12px] text-[#a0a19d]">4.9 from 2,400+ teams</span>
          </div>
          <h2 className="font-display text-[clamp(1.9rem,3vw,2.6rem)] font-semibold leading-[1.1]">
            {aside ?? (
              <>
                Your backlog is not
                <br />
                going to clear itself.
              </>
            )}
          </h2>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-[#a0a19d]">
            Join teams who replaced busywork with AI employees that ship real output — sales
            sequences, resolved tickets, clean data, and finished campaigns.
          </p>

          <div className="mt-8 space-y-2.5">
            {[
              'Hire and onboard in four minutes',
              'Keep every deliverable, even if you cancel',
              'No credit card for the 14-day trial',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-[12.5px] text-[#c3c4c0]">
                <span className="grid size-5 place-items-center rounded-full bg-mint/12 ring-1 ring-inset ring-mint/25">
                  <Check className="size-3 text-mint" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative panel max-w-md p-4">
          <p className="text-[12.5px] leading-relaxed text-[#cecfcb]">
            “We replaced a $7k/month agency retainer with two Nexora employees. Faster, more
            consistent, and I can see exactly what is being done.”
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar name="Daniel Okonkwo" src="/team/atlas.jpg" initials="DO" accent="sky" size="sm" />
            <div>
              <p className="text-[11.5px] font-medium text-white">Daniel Okonkwo</p>
              <p className="text-[10.5px] text-[#8e8f8b]">CEO · Northwind Pay</p>
            </div>
          </div>
        </div>
      </aside>

      {/* form panel */}
      <main className="relative flex min-h-screen flex-col justify-center bg-[#08090a] px-5 py-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(200,240,96,0.14),transparent_65%)] lg:hidden" />
        <div className="relative mx-auto w-full max-w-[400px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <Link to="/" className="text-[12px] text-[#9d9e9a] hover:text-white">
              Back home
            </Link>
          </div>

          <h1 className="font-display text-[clamp(1.7rem,4vw,2.1rem)] font-semibold leading-tight">{title}</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#a0a19d]">{subtitle}</p>

          <div className="mt-7">{children}</div>
          <div className="mt-6 text-center text-[12.5px] text-[#a0a19d]">{footer}</div>
        </div>
      </main>
    </div>
  );
}
