import { cn } from '@/lib/utils';

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[#0b0402]" />

      {/* ember halo */}
      <div className="absolute left-1/2 top-[-460px] h-[980px] w-[1280px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,138,61,0.24),rgba(192,44,10,0.13)_44%,transparent_72%)] blur-[16px]" />

      {/* cinematic conic ring */}
      <div className="absolute left-1/2 top-[180px] size-[1080px] -translate-x-1/2 rounded-full opacity-45 blur-[54px] [background:conic-gradient(from_150deg_at_50%_50%,transparent_0deg,rgba(255,138,61,0.4)_60deg,transparent_130deg,rgba(181,181,111,0.28)_200deg,transparent_250deg,rgba(224,138,72,0.3)_310deg,transparent_360deg)]" />

      {/* olive + clay secondaries */}
      <div className="absolute right-[-180px] top-[70px] size-[520px] rounded-full bg-[radial-gradient(circle,rgba(181,181,111,0.14),transparent_66%)]" />
      <div className="absolute left-[-200px] top-[220px] size-[560px] rounded-full bg-[radial-gradient(circle,rgba(224,138,72,0.14),transparent_66%)]" />

      <div className="absolute inset-x-0 top-0 h-[780px] bg-grid mask-fade-b opacity-[0.5]" />

      {/* horizon glow */}
      <div className="absolute inset-x-0 top-[620px] h-px bg-gradient-to-r from-transparent via-[#ff8a3d]/35 to-transparent" />

      <div className="noise absolute inset-0" />

      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#0b0402] via-[#0b0402]/70 to-transparent" />
    </div>
  );
}

export function SectionGlow({ tone = 'ember' }: { tone?: 'ember' | 'olive' | 'clay' }) {
  const tones = {
    ember: 'bg-[radial-gradient(circle,rgba(221,104,22,0.18),transparent_65%)]',
    olive: 'bg-[radial-gradient(circle,rgba(181,181,111,0.14),transparent_65%)]',
    clay: 'bg-[radial-gradient(circle,rgba(224,138,72,0.14),transparent_65%)]',
  };
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute size-[760px] rounded-full blur-[2px]', tones[tone])}
    />
  );
}
