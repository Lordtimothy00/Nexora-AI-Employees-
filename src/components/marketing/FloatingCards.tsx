import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FloatingMetric {
  label: string;
  value: string;
}

/**
 * A floating glass employee card used around the hero — the "AI OS" product moment.
 * Presentational only; the surrounding hero copy carries the accessible information.
 */
export function FloatingEmployeeCard({
  role,
  metrics,
  className,
  delay = 0,
  tint = 'blue',
}: {
  role: string;
  metrics: FloatingMetric[];
  className?: string;
  delay?: number;
  tint?: 'blue' | 'violet';
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'glass-strong relative w-full overflow-hidden rounded-[24px] p-4',
        'shadow-[0_40px_120px_-50px_rgba(0,0,0,0.95),0_0_60px_-24px_rgba(11,211,154,0.5),inset_0_1px_0_rgba(255,255,255,0.42),inset_0_0_0_1px_rgba(5,9,18,0.2),inset_0_28px_56px_-32px_rgba(0,0,0,0.55),inset_0_0_88px_-18px_rgba(0,0,0,0.36)]',
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-12 size-32 rounded-full blur-2xl',
          tint === 'violet'
            ? 'bg-[radial-gradient(circle,rgba(18,227,192,0.5),transparent_68%)]'
            : 'bg-[radial-gradient(circle,rgba(11,211,154,0.55),transparent_68%)]',
        )}
      />
      <div className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.03)_22%,transparent_46%,transparent_74%,rgba(18,227,192,0.1)_100%)] opacity-80" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#b9c9cf]">
          <span className="text-[#9df7c2]">✦</span> Nexora AI
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0bd39a]/30 bg-[#0bd39a]/10 px-1.5 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.12em] text-[#9df7c2]">
          <span className="status-dot size-1" />
          Online
        </span>
      </div>

      <p className="relative mt-3 font-display text-[15px] font-semibold text-white">{role}</p>

      <div className="relative mt-3 space-y-1.5 border-t border-white/12 pt-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-baseline justify-between gap-3">
            <span className="text-[9.5px] leading-snug text-[#9aaab3]">{metric.label}</span>
            <span className="font-mono text-[10px] font-medium text-[#deeaea]">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniStatusCard({
  label,
  value,
  icon,
  className,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'glass-strong flex items-center gap-2.5 rounded-[20px] px-3 py-2.5',
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[linear-gradient(140deg,rgba(11,211,154,0.35),rgba(18,227,192,0.3))] text-white ring-1 ring-inset ring-white/25">
        {icon}
      </span>
      <div>
        <p className="text-[10px] font-medium text-white">{label}</p>
        <p className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#8d9ea7]">{value}</p>
      </div>
    </div>
  );
}
