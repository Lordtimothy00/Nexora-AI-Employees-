import type { ReactNode } from 'react';
import { ArrowUpRight, CheckCircle2, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9aa7bd]">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 font-display text-[clamp(1.5rem,2.6vw,1.9rem)] font-semibold leading-tight text-white">
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-xl text-[13px] text-[#aab8cc]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
  tone = 'violet',
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'violet' | 'mint' | 'sky' | 'amber';
  spark?: number[];
}) {
  const tones = {
    violet: 'from-[#4d8dff]/25 to-transparent text-[#9cc0ff]',
    mint: 'from-[#4d8dff]/20 to-transparent text-[#9cc0ff]',
    sky: 'from-[#b8c4d4]/20 to-transparent text-[#dae3f0]',
    amber: 'from-[#dbe4f2]/20 to-transparent text-[#e6ecf6]',
  };
  const stroke = {
    violet: '#7aa8ff',
    mint: '#4d8dff',
    sky: '#b8c4d4',
    amber: '#dbe4f2',
  }[tone];

  return (
    <div className="relative overflow-hidden glass relative overflow-hidden rounded-[22px] p-4">
      <div className={cn('pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-gradient-to-br blur-2xl', tones[tone])} />
      <div className="relative flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#a7b4c8]">{label}</p>
        {icon && <span className={cn('opacity-80', tones[tone].split(' ').pop())}>{icon}</span>}
      </div>
      <p className="relative mt-2 font-display text-[26px] font-semibold leading-none text-white">{value}</p>
      <div className="relative mt-2.5 flex items-end justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10.5px]">
          {delta && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-mint/10 px-1.5 py-0.5 text-[#9cc0ff]">
              <TrendingUp className="size-2.5" /> {delta}
            </span>
          )}
          {hint && <span className="text-[#9aa7bd]">{hint}</span>}
        </div>
        {spark && <Sparkline data={spark} color={stroke} />}
      </div>
    </div>
  );
}

export function Sparkline({ data, color = '#7aa8ff' }: { data: number[]; color?: string }) {
  const width = 64;
  const height = 22;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-5 w-16 shrink-0" aria-hidden="true">
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

export function Panel({
  children,
  className,
  title,
  subtitle,
  action,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className={cn('glass rounded-[22px]', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3.5 md:px-5">
          <div>
            {title && <h2 className="font-display text-[13.5px] font-medium text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11px] text-[#9aa7bd]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(padded && 'p-4 md:p-5')}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[22px] border border-dashed border-white/12 bg-white/[0.015] px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-[22px] border border-white/10 bg-white/[0.04] text-[#7aa8ff]">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-[15px] font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-[#aab8cc]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Toast({
  message,
  onClose,
  tone = 'success',
}: {
  message: string;
  onClose: () => void;
  tone?: 'success' | 'info';
}) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-rise lg:left-auto lg:right-6 lg:translate-x-0">
      <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-[#22222c]/95 px-4 py-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,1)] backdrop-blur-xl">
        <CheckCircle2 className={cn('size-4 shrink-0', tone === 'success' ? 'text-mint' : 'text-[#dae3f0]')} />
        <p className="flex-1 text-[12.5px] text-[#d8e1ee]">{message}</p>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="grid size-5 place-items-center rounded-full text-[#9aa7bd] hover:bg-white/10 hover:text-white">
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}

export function MiniBar({
  label,
  value,
  max,
  color = '#7aa8ff',
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="text-[#b9c6d9]">{label}</span>
        <span className="font-medium text-white">
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, Math.round((value / max) * 100))}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function InlineLink({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11.5px] text-[#9cc0ff] transition-colors hover:text-white"
    >
      {children}
      <ArrowUpRight className="size-3" />
    </button>
  );
}

export const statusStyles: Record<string, string> = {
  active: 'bg-mint/12 text-[#9cc0ff] ring-mint/25',
  paused: 'bg-amber/12 text-[#e6ecf6] ring-amber/25',
  backlog: 'bg-white/[0.04] text-[#b9c6d9] ring-white/10',
  in_progress: 'bg-[#b8c4d4]/12 text-[#dae3f0] ring-[#b8c4d4]/25',
  review: 'bg-[#dbe4f2]/12 text-[#e6ecf6] ring-[#dbe4f2]/25',
  done: 'bg-mint/12 text-[#9cc0ff] ring-mint/25',
};
