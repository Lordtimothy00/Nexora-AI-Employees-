import { Link } from 'react-router-dom';
import { ArrowUpRight, Star } from 'lucide-react';
import { accentClasses, type Employee } from '@/data/employees';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export function EmployeeCard({
  employee,
  className,
  index = 0,
}: {
  employee: Employee;
  className?: string;
  index?: number;
}) {
  const tone = accentClasses[employee.accent];

  return (
    <Link
      to={`/employees/${employee.slug}`}
      className={cn(
        'panel panel-hover card-sheen group relative flex h-full flex-col overflow-hidden p-5',
        className,
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-16 -top-20 size-44 rounded-full bg-gradient-to-br opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-50',
          tone.glow,
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <Avatar
              name={employee.name}
              src={employee.avatar}
              initials={employee.initials}
              accent={employee.accent}
              size="lg"
              status="online"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-[17px] font-semibold text-white">{employee.name}</h3>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#aabbc2]">
                AI
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-[#b2c2c8]">{employee.role}</p>
          </div>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-[#8d9ea7] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
      </div>

      <p className="mt-4 text-[13.5px] leading-relaxed text-[#c4d3d8]">{employee.tagline}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.08em] ring-1 ring-inset',
            tone.bg,
            tone.text,
            tone.ring,
          )}
        >
          {employee.department}
        </span>
        {employee.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/12 bg-white/[0.045] backdrop-blur-xl px-2.5 py-1 text-[10.5px] text-[#aabbc2]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/12 pt-4">
        <div className="flex items-center gap-3 text-[11.5px] text-[#a7b7be]">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 fill-[#dbe7e8] text-[#dbe7e8]" />
            {employee.rating.toFixed(1)}
          </span>
          <span className="size-1 rounded-full bg-[#14282d]" />
          <span>{employee.deployments.toLocaleString()} teams</span>
        </div>
        <span className="text-[12.5px] font-medium text-white">${employee.priceMonthly}/mo</span>
      </div>
    </Link>
  );
}
