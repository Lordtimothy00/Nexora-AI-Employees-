import { cn } from '@/lib/utils';

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      {/* electric blue halo */}
      <div className="absolute left-1/2 top-[-460px] h-[980px] w-[1280px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(77,141,255,0.28),rgba(46,104,255,0.1)_46%,transparent_72%)] blur-[18px]" />

      {/* violet counter-glow */}
      <div className="absolute right-[-240px] top-[40px] size-[620px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.24),transparent_68%)] blur-[20px]" />
      <div className="absolute left-[-260px] top-[260px] size-[560px] rounded-full bg-[radial-gradient(circle,rgba(77,141,255,0.18),transparent_68%)] blur-[20px]" />

      {/* cinematic conic ring — blue into violet */}
      <div className="absolute left-1/2 top-[140px] size-[1080px] -translate-x-1/2 rounded-full opacity-45 blur-[64px] [background:conic-gradient(from_150deg_at_50%_50%,transparent_0deg,rgba(77,141,255,0.4)_55deg,transparent_120deg,rgba(139,92,246,0.3)_205deg,transparent_255deg,rgba(122,168,255,0.26)_315deg,transparent_360deg)]" />

      <div className="absolute inset-x-0 top-0 h-[820px] bg-grid mask-fade-b opacity-[0.45]" />

      {/* horizon glow */}
      <div className="absolute inset-x-0 top-[660px] h-px bg-gradient-to-r from-transparent via-[#4d8dff]/40 to-transparent" />

      <div className="noise absolute inset-0" />
    </div>
  );
}

export function SectionGlow({ tone = 'ember' }: { tone?: 'ember' | 'olive' | 'clay' }) {
  const tones = {
    ember: 'bg-[radial-gradient(circle,rgba(77,141,255,0.16),transparent_65%)]',
    olive: 'bg-[radial-gradient(circle,rgba(139,92,246,0.16),transparent_65%)]',
    clay: 'bg-[radial-gradient(circle,rgba(122,168,255,0.12),transparent_65%)]',
  };
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute size-[760px] rounded-full blur-[2px]', tones[tone])}
    />
  );
}
