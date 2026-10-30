import { cn } from '@/lib/utils';

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[#08090a]" />

      {/* soft silver halo */}
      <div className="absolute left-1/2 top-[-470px] h-[980px] w-[1280px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(245,245,243,0.15),rgba(245,245,243,0.05)_46%,transparent_72%)] blur-[16px]" />

      {/* cinematic conic ring — silver with one lime arc */}
      <div className="absolute left-1/2 top-[180px] size-[1080px] -translate-x-1/2 rounded-full opacity-40 blur-[58px] [background:conic-gradient(from_150deg_at_50%_50%,transparent_0deg,rgba(245,245,243,0.3)_60deg,transparent_130deg,rgba(245,245,243,0.16)_200deg,transparent_250deg,rgba(200,240,96,0.24)_312deg,transparent_360deg)]" />

      {/* restrained accent kicker + neutral fill */}
      <div className="absolute right-[-170px] top-[60px] size-[520px] rounded-full bg-[radial-gradient(circle,rgba(200,240,96,0.1),transparent_66%)]" />
      <div className="absolute left-[-200px] top-[220px] size-[560px] rounded-full bg-[radial-gradient(circle,rgba(245,245,243,0.06),transparent_66%)]" />

      <div className="absolute inset-x-0 top-0 h-[780px] bg-grid mask-fade-b opacity-[0.5]" />

      {/* horizon glow */}
      <div className="absolute inset-x-0 top-[620px] h-px bg-gradient-to-r from-transparent via-[#c8f060]/30 to-transparent" />

      <div className="noise absolute inset-0" />

      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#08090a] via-[#08090a]/70 to-transparent" />
    </div>
  );
}

export function SectionGlow({ tone = 'ember' }: { tone?: 'ember' | 'olive' | 'clay' }) {
  const tones = {
    ember: 'bg-[radial-gradient(circle,rgba(245,245,243,0.09),transparent_65%)]',
    olive: 'bg-[radial-gradient(circle,rgba(200,240,96,0.09),transparent_65%)]',
    clay: 'bg-[radial-gradient(circle,rgba(245,245,243,0.06),transparent_65%)]',
  };
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute size-[760px] rounded-full blur-[2px]', tones[tone])}
    />
  );
}
