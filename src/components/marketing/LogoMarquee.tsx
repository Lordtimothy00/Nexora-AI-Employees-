import { logos } from '@/data/site';

export function LogoMarquee() {
  const row = [...logos, ...logos];
  return (
    <div className="relative">
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-14 pr-14">
          {row.map((logo, index) => (
            <div key={`${logo}-${index}`} className="flex items-center gap-2.5">
              <span className="size-1.5 rotate-45 bg-[#33363a]" />
              <span className="font-display text-[15px] font-medium tracking-[-0.01em] text-[#979894] transition-colors hover:text-[#c3c4c0]">
                {logo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
