import { useId } from 'react';
import { cn } from '@/lib/utils';

export function TaskChart({
  data,
  labels,
  height = 180,
  className,
}: {
  data: number[];
  labels: string[];
  height?: number;
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, '');
  const width = 600;
  const padding = 6;
  const max = Math.max(...data) * 1.15;
  const min = Math.min(...data) * 0.7;
  const range = max - min || 1;
  const step = (width - padding * 2) / (data.length - 1);

  const points = data.map((value, index) => ({
    x: padding + index * step,
    y: height - padding - ((value - min) / range) * (height - padding * 2),
  }));

  const line = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const prev = points[index - 1];
      const cx = (prev.x + point.x) / 2;
      return `C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(' ');

  const last = points[points.length - 1];

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Tasks completed over time"
      >
        <defs>
          <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8f060" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#c8f060" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`line-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d7f68c" />
            <stop offset="100%" stopColor="#c8f060" />
          </linearGradient>
        </defs>
        {[0.2, 0.5, 0.8].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={height * ratio}
            y2={height * ratio}
            stroke="rgba(226,236,247,0.05)"
            strokeDasharray="4 8"
          />
        ))}
        <path d={`${line} L ${last.x} ${height} L ${padding} ${height} Z`} fill={`url(#area-${gradientId})`} />
        <path d={line} fill="none" stroke={`url(#line-${gradientId})`} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx={last.x} cy={last.y} r="4.5" fill="#0f1219" stroke="#c8f060" strokeWidth="2.5" />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-[#8a919a]">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`} className={index === labels.length - 1 ? 'text-[#d7f68c]' : undefined}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative size-[140px] shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(226,236,247,0.06)" strokeWidth="13" />
          {segments.map((segment) => {
            const length = (segment.value / total) * circumference;
            const dash = `${Math.max(length - 4, 0)} ${circumference - Math.max(length - 4, 0)}`;
            const element = (
              <circle
                key={segment.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return element;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-[22px] font-semibold leading-none text-white">{centerValue}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#9ba2ab]">{centerLabel}</p>
          </div>
        </div>
      </div>
      <div className="w-full space-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2 text-[11.5px]">
            <span className="size-2 rounded-full" style={{ background: segment.color }} />
            <span className="flex-1 text-[#bbc2cb]">{segment.label}</span>
            <span className="font-medium text-white">{segment.value}</span>
            <span className="w-9 text-right text-[10px] text-[#9ba2ab]">
              {Math.round((segment.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
