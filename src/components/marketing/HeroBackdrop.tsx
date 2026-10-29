import { cn } from '@/lib/utils';

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[#05060a]" />
      <div className="absolute inset-x-0 top-0 h-[760px] bg-grid mask-fade-b opacity-[0.55]" />
      <div className="absolute left-1/2 top-[-320px] size-[880px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.26),rgba(76,51,212,0.09)_42%,transparent_68%)] blur-[10px]" />
      <div className="absolute right-[-180px] top-[80px] size-[520px] rounded-full bg-[radial-gradient(circle,rgba(79,227,193,0.12),transparent_66%)]" />
      <div className="absolute left-[-200px] top-[220px] size-[560px] rounded-full bg-[radial-gradient(circle,rgba(90,169,255,0.12),transparent_66%)]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#05060a] via-[#05060a]/60 to-transparent" />
    </div>
  );
}

export function SectionGlow({ tone = 'violet' }: { tone?: 'violet' | 'mint' | 'sky' }) {
  const tones = {
    violet: 'bg-[radial-gradient(circle,rgba(124,92,255,0.16),transparent_65%)]',
    mint: 'bg-[radial-gradient(circle,rgba(79,227,193,0.12),transparent_65%)]',
    sky: 'bg-[radial-gradient(circle,rgba(90,169,255,0.12),transparent_65%)]',
  };
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute size-[760px] rounded-full blur-[2px]', tones[tone])}
    />
  );
}
