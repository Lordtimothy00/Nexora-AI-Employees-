import { useState } from 'react';
import { accentClasses, type Accent } from '@/data/employees';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string;
  initials: string;
  accent?: Accent;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  status?: 'online' | 'paused' | 'offline';
  glow?: boolean;
}

const sizes = {
  xxs: 'size-4 rounded-full text-[8px]',
  xs: 'size-7 rounded-[9px] text-[10px]',
  sm: 'size-9 rounded-[11px] text-[11px]',
  md: 'size-12 rounded-[14px] text-[13px]',
  lg: 'size-16 rounded-[18px] text-base',
  xl: 'size-24 rounded-[26px] text-xl',
  hero: 'size-32 rounded-[32px] text-2xl',
};

const statusColors = {
  online: 'bg-mint',
  paused: 'bg-amber',
  offline: 'bg-zinc-500',
};

export function Avatar({
  name,
  src,
  initials,
  accent = 'violet',
  size = 'md',
  className,
  status,
  glow = false,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const tone = accentClasses[accent];
  const showImage = src && !failed;

  // The wrapper carries the same footprint as the box it holds. Without this a caller's
  // `size-*` in className would shrink the wrapper while the preset size stayed on the box,
  // and the image would spill over whatever sits next to it instead of being clipped.
  const [footprint] = sizes[size].split(' ');

  return (
    <div className={cn('relative shrink-0', footprint, className)}>
      {glow && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute -inset-2 rounded-[inherit] bg-gradient-to-br opacity-40 blur-xl',
            tone.gradient,
          )}
        />
      )}
      <div
        className={cn(
          'relative grid place-items-center overflow-hidden border border-white/12 shadow-[inset_0_1px_0_rgba(186,255,228,0.12),0_10px_30px_-14px_rgba(0,0,0,0.8)]',
          'bg-[linear-gradient(160deg,rgba(186,255,228,0.09),rgba(186,255,228,0.02))]',
          sizes[size],
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            onError={() => setFailed(true)}
            className="size-full object-cover object-[50%_28%]"
          />
        ) : (
          <span className={cn('font-display font-semibold tracking-wide', tone.text)}>{initials}</span>
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/8"
        />
      </div>
      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#092024]',
            statusColors[status],
          )}
          aria-label={status}
        />
      )}
    </div>
  );
}
