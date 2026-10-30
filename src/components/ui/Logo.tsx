import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LogoMark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'relative grid place-items-center border border-white/15 bg-[linear-gradient(150deg,#13161e,#13161e)] shadow-[inset_0_1px_0_rgba(190,215,255,0.16)]',
        size === 'sm' ? 'size-8 rounded-[9px]' : 'size-9 rounded-[11px]',
        className,
      )}
    >
      <span
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(77,141,255,0.45),transparent_68%)]',
          size === 'sm' ? 'rounded-[9px]' : 'rounded-[11px]',
        )}
      />
      <svg viewBox="0 0 64 64" className="relative size-[62%]" aria-hidden="true">
        <defs>
          <linearGradient id="nexora-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#9cc0ff" />
            <stop offset="1" stopColor="#8b5cf6" />
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
            <span className="ml-1 font-mono text-[0.72em] font-medium tracking-[0.18em] text-[#9cc0ff]">
              AI
            </span>
          </span>
          <span
            className={cn(
              'size-1 rounded-full bg-[#4d8dff] shadow-[0_0_8px_1px_rgba(77,141,255,0.7)]',
              size === 'sm' ? 'mt-0.5' : 'mt-1',
            )}
          />
        </span>
      )}
    </Link>
  );
}
