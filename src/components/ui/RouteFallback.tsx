import { cn } from '@/lib/utils';

/**
 * Shown while a lazily-loaded route streams in. Kept deliberately quiet — the shell,
 * navbar and back control stay interactive around it.
 */
export function RouteFallback({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('mx-auto w-full max-w-[1200px] px-4 py-24 md:px-6 md:py-32', className)}
    >
      <span className="sr-only">Loading page…</span>
      <div className="animate-pulse" aria-hidden="true">
        <div className="mx-auto h-3 w-28 rounded-full bg-white/[0.07]" />
        <div className="mx-auto mt-6 h-10 w-[min(26rem,90%)] rounded-xl bg-white/[0.06]" />
        <div className="mx-auto mt-3 h-10 w-[min(18rem,70%)] rounded-xl bg-white/[0.05]" />
        <div className="mx-auto mt-8 h-4 w-[min(32rem,92%)] rounded-full bg-white/[0.04]" />
      </div>
    </div>
  );
}

/** Same idea, tuned for the dashboard content area below a persistent shell. */
export function PanelFallback() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading workspace…</span>
      <div className="animate-pulse space-y-4" aria-hidden="true">
        <div className="h-7 w-44 rounded-lg bg-white/[0.07]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-28 rounded-[22px] bg-white/[0.05]" />
          ))}
        </div>
        <div className="h-72 rounded-[22px] bg-white/[0.05]" />
      </div>
    </div>
  );
}
