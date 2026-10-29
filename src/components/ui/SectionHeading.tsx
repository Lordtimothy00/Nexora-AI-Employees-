import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'md:flex-col md:items-center md:text-center',
        className,
      )}
    >
      <Reveal className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
        {eyebrow && (
          <div className={cn('mb-4 flex', align === 'center' && 'justify-center')}>
            <span className="eyebrow">
              <span className="size-1.5 rounded-full bg-[#ffa15c] shadow-[0_0_10px_2px_rgba(255,161,92,0.6)]" />
              {eyebrow}
            </span>
          </div>
        )}
        <h2 className="text-[clamp(1.85rem,3.6vw,2.9rem)] font-semibold leading-[1.08]">{title}</h2>
        {description && (
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#a28c80] md:text-base">
            {description}
          </p>
        )}
      </Reveal>
      {action && <Reveal delay={80} className="shrink-0">{action}</Reveal>}
    </div>
  );
}
