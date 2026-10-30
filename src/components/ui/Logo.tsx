import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative grid size-9 place-items-center rounded-[11px] border border-white/15 bg-[linear-gradient(150deg,#121314,#101112)] shadow-[inset_0_1px_0_rgba(245,245,243,0.14)]',
        className,
      )}
    >
      <span className="absolute inset-0 rounded-[11px] bg-[radial-gradient(circle_at_30%_20%,rgba(200,240,96,0.22),transparent_65%)]" />
      <svg viewBox="0 0 64 64" className="relative size-[62%]" aria-hidden="true">
        <defs>
          <linearGradient id="nexora-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#d7d8d4" />
            <stop offset="1" stopColor="#c8f060" />
          </linearGradient>
        </defs>
        <path
          d="M16 48V16l32 32V16"
          fill="none"
          stroke="url(#nexora-mark)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  markClassName,
  to = '/',
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  to?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="Nexora home"
    >
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span className="flex items-start gap-1">
          <span className="font-display text-[17px] font-semibold tracking-[0.16em] text-white">
            NEXORA
          </span>
          <span className="mt-1 size-1 rounded-full bg-[#c8f060] shadow-[0_0_8px_1px_rgba(200,240,96,0.7)]" />
        </span>
      )}
    </Link>
  );
}
