import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative grid size-9 place-items-center rounded-[11px] border border-white/15 bg-[linear-gradient(150deg,#151222,#0a0b12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]',
        className,
      )}
    >
      <span className="absolute inset-0 rounded-[11px] bg-[radial-gradient(circle_at_30%_20%,rgba(124,92,255,0.35),transparent_65%)]" />
      <svg viewBox="0 0 64 64" className="relative size-[62%]" aria-hidden="true">
        <defs>
          <linearGradient id="nexora-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c4b5fd" />
            <stop offset="0.55" stopColor="#8b6dff" />
            <stop offset="1" stopColor="#4fe3c1" />
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
        <span className="font-display text-[17px] font-semibold tracking-[0.16em] text-white">
          NEXORA
        </span>
      )}
    </Link>
  );
}
