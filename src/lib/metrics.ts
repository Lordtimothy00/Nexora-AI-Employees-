import type { Activity } from '@/context/WorkspaceContext';

const DAY = 86_400_000;

export type SeriesRange = 7 | 30;

export interface ActivitySeries {
  /** Oldest bucket first, newest last. */
  data: number[];
  labels: string[];
  total: number;
  /** Same-length window immediately before this one. */
  previous: number;
  /** Percent change vs the previous window, or null when there is nothing to compare. */
  changePct: number | null;
}

const COMPLETION_KINDS: Activity['kind'][] = ['delivery', 'approval'];

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

/**
 * Buckets workspace activity into a chart-ready series. Everything in the dashboard
 * charts comes through here, so the numbers on screen are the numbers in the workspace
 * rather than a hard-coded trend.
 */
export function activitySeries(
  activities: Activity[],
  days: SeriesRange,
  options: { completionsOnly?: boolean; now?: Date } = {},
): ActivitySeries {
  const { completionsOnly = false, now = new Date() } = options;
  const buckets = days === 7 ? 7 : 15;
  const span = days / buckets;
  const end = startOfDay(now) + DAY;

  const data = new Array<number>(buckets).fill(0);
  const previousBuckets = new Array<number>(buckets).fill(0);

  for (const activity of activities) {
    if (completionsOnly && !COMPLETION_KINDS.includes(activity.kind)) continue;
    const at = new Date(activity.at).getTime();
    if (Number.isNaN(at) || at >= end) continue;

    const index = Math.floor((end - at) / (span * DAY));
    if (index < 0) continue;
    if (index < buckets) data[buckets - 1 - index] += 1;
    else if (index < buckets * 2) previousBuckets[buckets - 1 - (index - buckets)] += 1;
  }

  const labels = data.map((_, index) => {
    const bucketStart = new Date(end - (buckets - index) * span * DAY);
    return days === 7
      ? bucketStart.toLocaleDateString('en-US', { weekday: 'short' })
      : `${bucketStart.getDate()} ${bucketStart.toLocaleDateString('en-US', { month: 'short' })}`;
  });

  const total = data.reduce((sum, value) => sum + value, 0);
  const previous = previousBuckets.reduce((sum, value) => sum + value, 0);
  const changePct = previous > 0 ? Math.round(((total - previous) / previous) * 100) : null;

  return { data, labels, total, previous, changePct };
}
