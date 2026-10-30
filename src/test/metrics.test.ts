import { describe, expect, it } from 'vitest';
import { activitySeries, changeDirection, changeLabel } from '@/lib/metrics';
import type { Activity } from '@/context/WorkspaceContext';

const NOW = new Date('2026-10-30T12:00:00Z');

const make = (daysAgo: number, kind: Activity['kind'] = 'delivery'): Activity => {
  const at = new Date(NOW.getTime() - daysAgo * 86_400_000);
  return { id: at.toISOString(), employeeId: 'emp_ava', text: 'Worked', at: at.toISOString(), kind };
};

describe('activitySeries', () => {
  it('buckets the last seven days with the newest bucket last', () => {
    const series = activitySeries([make(0), make(1), make(1), make(6)], 7, { now: NOW });

    expect(series.data).toHaveLength(7);
    expect(series.data[6]).toBe(1);
    expect(series.data[5]).toBe(2);
    expect(series.data[0]).toBe(1);
    expect(series.total).toBe(4);
  });

  it('uses fifteen two-day buckets over thirty days', () => {
    const series = activitySeries([make(0), make(29)], 30, { now: NOW });

    expect(series.data).toHaveLength(15);
    expect(series.labels).toHaveLength(15);
    expect(series.total).toBe(2);
  });

  it('compares against the immediately preceding window', () => {
    const steady = activitySeries([make(1), make(8)], 7, { now: NOW });

    expect(steady.total).toBe(1);
    expect(steady.previous).toBe(1);
    expect(steady.changePct).toBe(0);

    const growing = activitySeries([make(0), make(2), make(3), make(9)], 7, { now: NOW });
    expect(growing.total).toBe(3);
    expect(growing.previous).toBe(1);
    expect(growing.changePct).toBe(200);
  });

  it('returns a null change when there is no earlier window to compare', () => {
    const series = activitySeries([make(2)], 7, { now: NOW });

    expect(series.previous).toBe(0);
    expect(series.changePct).toBeNull();
  });

  it('can count only delivered and approved work', () => {
    const mixed = [make(1, 'delivery'), make(1, 'approval'), make(1, 'alert'), make(1, 'hire')];

    expect(activitySeries(mixed, 7, { now: NOW }).total).toBe(4);
    expect(activitySeries(mixed, 7, { now: NOW, completionsOnly: true }).total).toBe(2);
  });

  it('ignores future timestamps instead of plotting them', () => {
    const future: Activity = {
      id: 'future',
      employeeId: 'emp_ava',
      text: 'Not yet',
      at: new Date(NOW.getTime() + 86_400_000).toISOString(),
      kind: 'delivery',
    };

    expect(activitySeries([future], 7, { now: NOW }).total).toBe(0);
  });
});

describe('change labels', () => {
  it('signs a change and rounds it', () => {
    expect(changeLabel(18.4)).toBe('+18%');
    expect(changeLabel(-6.2)).toBe('-6%');
    expect(changeLabel(0.4)).toBe('No change');
  });

  it('reports nothing when the prior window was empty', () => {
    expect(changeLabel(null)).toBeNull();
    expect(changeDirection(null)).toBeNull();
  });

  it('separates a decline from a rise', () => {
    expect(changeDirection(12)).toBe('up');
    expect(changeDirection(-3)).toBe('down');
    expect(changeDirection(0)).toBe('flat');
  });
});
