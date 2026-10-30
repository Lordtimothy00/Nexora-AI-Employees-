import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { EmployeeCard } from '@/components/marketing/EmployeeCard';
import { FinalCta } from '@/components/marketing/FinalCta';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { HeroBackdrop } from '@/components/marketing/HeroBackdrop';
import { departments, employees, type Department } from '@/data/employees';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

type Sort = 'popular' | 'rating' | 'price';

const sortOptions: { value: Sort; label: string }[] = [
  { value: 'popular', label: 'Most hired' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price', label: 'Lowest price' },
];

const departmentsWithAll = [{ name: 'All' as const, blurb: 'Every role, every department.' }, ...departments];

export function Employees() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDepartment = searchParams.get('department');
  const [department, setDepartment] = useState<Department | 'All'>(
    (departmentsWithAll.find((item) => item.name === initialDepartment)?.name as Department | 'All') ?? 'All',
  );
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('popular');
  const { hires } = useWorkspace();
  const { user } = useAuth();

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (department === 'All') next.delete('department');
    else next.set('department', department);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = employees.filter((employee) => {
      const matchesDepartment = department === 'All' || employee.department === department;
      const haystack = [
        employee.name,
        employee.role,
        employee.department,
        employee.tagline,
        ...employee.skills,
        ...employee.tags,
      ]
        .join(' ')
        .toLowerCase();
      return matchesDepartment && (!q || haystack.includes(q));
    });

    return list.sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price') return a.priceMonthly - b.priceMonthly;
      return b.deployments - a.deployments;
    });
  }, [department, query, sort]);

  const activeBlurb = departmentsWithAll.find((item) => item.name === department)?.blurb;

  return (
    <>
      <section className="page-section relative overflow-hidden pb-12 pt-24 md:pt-32">
        <HeroBackdrop />
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="eyebrow">
                <Sparkles className="size-3 text-[#7aa8ff]" />
                The roster · {employees.length} employees
              </span>
            </Reveal>
            <Reveal delay={70}>
              <h1 className="mt-6 text-[clamp(2.3rem,5.4vw,3.9rem)] font-semibold leading-[1.02]">
                Find the teammate
                <br />
                <span className="text-gradient">your work needs.</span>
              </h1>
            </Reveal>
            <Reveal delay={130}>
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[#b8c5d7] md:text-base">
                Every Nexora employee is a specialist with a defined playbook, tool access, and
                deliverable. Filter by department, compare roles, and hire in minutes.
              </p>
            </Reveal>
          </div>

          {/* controls */}
          <Reveal delay={180}>
            <div className="mx-auto mt-10 max-w-4xl">
              <div className="panel flex flex-col gap-3 p-2.5 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8d9bb1]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by role, skill, or department…"
                    aria-label="Search AI employees"
                    className="h-11 w-full rounded-xl border border-transparent bg-transparent pl-10 pr-10 text-[14px] text-white placeholder:text-[#8d9bb1] focus:border-white/10 focus:bg-white/[0.03] focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-[#a7b4c8] hover:bg-white/10 hover:text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-white/12 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                  <SlidersHorizontal className="size-3.5 text-[#8d9bb1]" />
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value as Sort)}
                      aria-label="Sort employees"
                      className="h-9 appearance-none rounded-lg border border-white/10 bg-[#0d1422] pl-3 pr-8 text-[12.5px] text-[#ced8e6] focus:border-[#4d8dff]/60 focus:outline-none"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8d9bb1]">
                      ▾
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {departmentsWithAll.map((item) => {
                  const isActive = department === item.name;
                  const count =
                    item.name === 'All'
                      ? employees.length
                      : employees.filter((employee) => employee.department === item.name).length;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setDepartment(item.name)}
                      aria-pressed={isActive}
                      className={cn(
                        'group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-all duration-200',
                        isActive
                          ? 'border-[#4d8dff]/45 bg-[#4d8dff]/15 text-white shadow-[0_0_24px_-10px_rgba(77,141,255,0.9)]'
                          : 'border-white/12 bg-white/[0.045] backdrop-blur-xl text-[#b2bfd2] hover:border-white/16 hover:text-white',
                      )}
                    >
                      {item.name}
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 font-mono text-[9.5px]',
                          isActive ? 'bg-white/15 text-white' : 'bg-white/[0.05] text-[#9aa7bd]',
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="page-section relative pb-16">
        <div className="shell">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/12 pb-4">
            <div>
              <p className="text-[13.5px] font-medium text-white">
                {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}
                {department !== 'All' && <span className="text-[#a7b4c8]"> in {department}</span>}
              </p>
              <p className="mt-0.5 text-[12px] text-[#a7b4c8]">{activeBlurb}</p>
            </div>
            {user && hires.length > 0 && (
              <p className="text-[12px] text-[#a7b4c8]">
                {hires.length} already on your team ·{' '}
                <ButtonLink to="/dashboard/team" variant="ghost" size="sm" className="h-auto px-1 py-0 text-[12px] text-[#9cc0ff]">
                  View team
                </ButtonLink>
              </p>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((employee, index) => (
                <Reveal key={employee.id} delay={Math.min(index, 5) * 50}>
                  <div className="relative h-full">
                    {user && hires.some((hire) => hire.employeeId === employee.id) && (
                      <span className="absolute -top-2 right-4 z-10 rounded-full border border-mint/30 bg-[#0a101d] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#9cc0ff]">
                        On your team
                      </span>
                    )}
                    <EmployeeCard employee={employee} index={index} />
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="panel flex flex-col items-center px-6 py-16 text-center">
              <div className="grid size-12 place-items-center rounded-[22px] border border-white/10 bg-white/[0.03]">
                <Search className="size-5 text-[#a7b4c8]" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">No employees match that search</h3>
              <p className="mt-2 max-w-sm text-[13.5px] text-[#aab8cc]">
                Try a broader term, or clear the filters to see the full roster of {employees.length} specialists.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDepartment('All');
                }}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[13px] text-white transition hover:bg-white/[0.08]"
              >
                Reset filters <ArrowRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      <FinalCta />
    </>
  );
}
