import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ButtonLink } from '@/components/ui/Button';
import { HeroBackdrop } from '@/components/marketing/HeroBackdrop';

export function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <HeroBackdrop />
      <div className="shell flex flex-1 flex-col">
        <div className="flex h-20 items-center">
          <Logo />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="eyebrow">Error 404</span>
          <p className="mt-8 font-display text-[clamp(4rem,14vw,9rem)] font-semibold leading-none text-gradient">
            404
          </p>
          <h1 className="mt-4 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-semibold">
            This page never got hired.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[#aab8cc]">
            The link may be out of date, or the page moved. Your team is still working — head back to
            the workspace or meet the roster.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/" iconLeft={<ArrowLeft className="size-4" />}>
              Back home
            </ButtonLink>
            <ButtonLink to="/employees" variant="secondary" iconRight={<ArrowRight className="size-4" />}>
              Meet the team
            </ButtonLink>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[#9aa7bd]">
            <Link to="/how-it-works" className="hover:text-white">
              How it works
            </Link>
            <span className="size-1 rounded-full bg-[#222d41]" />
            <Link to="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <span className="size-1 rounded-full bg-[#222d41]" />
            <Link to="/login" className="hover:text-white">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
