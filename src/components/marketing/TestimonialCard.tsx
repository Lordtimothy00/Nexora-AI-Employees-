import { accentClasses } from '@/data/employees';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  accent: keyof typeof accentClasses;
  metric: string;
}

export function TestimonialCard({ testimonial, className }: { testimonial: Testimonial; className?: string }) {
  const tone = accentClasses[testimonial.accent];
  return (
    <figure className={cn('panel panel-hover flex h-full flex-col p-5 md:p-6', className)}>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'rounded-full px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em] ring-1 ring-inset',
            tone.bg,
            tone.text,
            tone.ring,
          )}
        >
          {testimonial.metric}
        </span>
        <svg viewBox="0 0 24 24" className="size-5 text-white/15" fill="currentColor" aria-hidden="true">
          <path d="M6.5 5C4 6.6 2.5 9.3 2.5 12.4c0 3.9 2.2 6.6 5.3 6.6 2.4 0 4.2-1.7 4.2-4 0-2.2-1.5-3.8-3.6-3.8-.4 0-.8 0-1.1.2.4-1.6 1.9-3.2 3.6-4.3L6.5 5Zm10.4 0c-2.5 1.6-4 4.3-4 7.4 0 3.9 2.2 6.6 5.3 6.6 2.4 0 4.2-1.7 4.2-4 0-2.2-1.5-3.8-3.6-3.8-.4 0-.8 0-1.1.2.4-1.6 1.9-3.2 3.6-4.3L16.9 5Z" />
        </svg>
      </div>

      <blockquote className="mt-4 flex-1 text-[14.5px] leading-relaxed text-[#d6d9db]">
        “{testimonial.quote}”
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-3 border-t border-white/12 pt-4">
        <Avatar
          name={testimonial.name}
          initials={testimonial.initials}
          accent={testimonial.accent}
          size="sm"
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-white">{testimonial.name}</p>
          <p className="truncate text-[11.5px] text-[#a9b0b9]">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
