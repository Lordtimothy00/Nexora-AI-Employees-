import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LogoMark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'relative grid place-items-center border border-white/15 bg-[linear-gradient(150deg,#151921,#0e1118)] shadow-[inset_0_1px_0_rgba(226,236,247,0.16)]',
        size === 'sm' ? 'size-8 rounded-[9px]' : 'size-9 rounded-[11px]',
        className,
      )}
    >
      <span
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(200,240,96,0.22),transparent_65%)]',
          size === 'sm' ? 'rounded-[9px]' : 'rounded-[11px]',
        )}
      />
      <svg viewBox="0 0 64 64" className="relative size-[62%]" aria-hidden="true">
        <defs>
          <linearGradient id="nexora-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fdffff" />
            <stop offset="0.55" stopColor="#dbe2ea" />
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
  size = 'md',
}: {
  className?: string;
  markClassName?: string;
  to?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="Nexora home"
    >
      <LogoMark className={markClassName} size={size} />
      {showWordmark && (
        <span className="flex items-start gap-1">
          <span
            className={cn(
              'font-display font-semibold tracking-[0.16em] text-white',
              size === 'sm' ? 'text-[14.5px]' : 'text-[17px]',
            )}
          >
            NEXORA
          </span>
          <span
            className={cn(
              'size-1 rounded-full bg-[#c8f060] shadow-[0_0_8px_1px_rgba(200,240,96,0.7)]',
              size === 'sm' ? 'mt-0.5' : 'mt-1',
            )}
          />
        </span>
      )}
    </Link>
  );
}
