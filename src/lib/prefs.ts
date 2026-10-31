/**
 * Notification preferences.
 *
 * These used to be component state with a toast that said "saved for this preview session" — the
 * toggles forgot themselves on reload. They now live in `profiles.prefs` (jsonb), so they survive
 * a refresh and follow the person across devices. Nothing is delivered yet: the copy in Settings
 * says so rather than implying a digest arrives.
 */

export interface NotificationPrefs {
  digest: boolean;
  approvals: boolean;
  autoAssign: boolean;
  weeklyReport: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  digest: true,
  approvals: true,
  autoAssign: false,
  weeklyReport: true,
};

/** `prefs` is jsonb, so it can come back as anything — keep the shape and fall back per key. */
export function normalisePrefs(value: unknown): NotificationPrefs {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_PREFS };

  const raw = value as Record<string, unknown>;
  const pick = (key: keyof NotificationPrefs) =>
    typeof raw[key] === 'boolean' ? (raw[key] as boolean) : DEFAULT_PREFS[key];

  return {
    digest: pick('digest'),
    approvals: pick('approvals'),
    autoAssign: pick('autoAssign'),
    weeklyReport: pick('weeklyReport'),
  };
}

/** True when the two sets agree — used to keep the save button honest about having work to do. */
export function prefsEqual(a: NotificationPrefs, b: NotificationPrefs) {
  return (
    a.digest === b.digest &&
    a.approvals === b.approvals &&
    a.autoAssign === b.autoAssign &&
    a.weeklyReport === b.weeklyReport
  );
}
