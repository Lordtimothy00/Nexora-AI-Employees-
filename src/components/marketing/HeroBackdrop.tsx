import { cn } from '@/lib/utils';

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn('hero-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      {/* electric blue halo */}
      <div className="hero-halo" />

      {/* violet counter-glow */}
      <div className="hero-glow hero-glow--violet" />
      <div className="hero-glow hero-glow--blue" />

      {/* cinematic conic ring — blue into violet */}
      <div className="hero-ring" />

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
