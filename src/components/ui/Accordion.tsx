import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  q: string;
  a: string;
}

export function Accordion({
  items,
  className,
  defaultOpen = 0,
}: {
  items: AccordionItem[];
  className?: string;
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();

  return (
    <div className={cn('divide-y divide-white/8 overflow-hidden', className)}>
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q} className="group">
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={`${baseId}-panel-${index}`}
                id={`${baseId}-button-${index}`}
                className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-white"
              >
                <span
                  className={cn(
                    'font-display text-[15px] font-medium transition-colors md:text-base',
                    isOpen ? 'text-white' : 'text-[#e9d8ce]',
                  )}
                >
                  {item.q}
                </span>
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-300',
                    isOpen
                      ? 'border-[#dd6816]/40 bg-[#dd6816]/15 text-[#ffc08e] rotate-180'
                      : 'border-white/10 bg-white/[0.03] text-[#a28c80]',
                  )}
                >
                  {isOpen ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                </span>
              </button>
            </h3>
            <div
              id={`${baseId}-panel-${index}`}
              role="region"
              aria-labelledby={`${baseId}-button-${index}`}
              className={cn(
                'grid transition-all duration-300 ease-out',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-6 pr-12 text-[14.5px] leading-relaxed text-[#a28c80]">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
