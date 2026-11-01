import type { BriefCheck, ModelVerdict, TaskVerification } from '@/context/WorkspaceContext';

const STATUSES = ['passes', 'needs_review', 'unverified'] as const;

const readChecks = (value: unknown): BriefCheck[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const check = entry as Record<string, unknown>;
      return {
        id: String(check.id ?? ''),
        label: String(check.label ?? ''),
        pass: Boolean(check.pass),
        note: typeof check.note === 'string' ? check.note : undefined,
      };
    })
    .filter((check) => check.id !== '');
};

const readModel = (value: unknown): ModelVerdict | null => {
  if (!value || typeof value !== 'object') return null;
  const model = value as Record<string, unknown>;
  if (typeof model.addressesTask !== 'boolean') return null;
  return {
    addressesTask: model.addressesTask,
    missing: Array.isArray(model.missing)
      ? model.missing.filter((entry): entry is string => typeof entry === 'string')
      : [],
    reason: String(model.reason ?? ''),
  };
};

/**
 * Reads a brief-check verdict out of whatever the database or the function returned. Anything that
 * does not look like a verdict is dropped rather than filled in: the UI must never show a check it
 * cannot point at a row for.
 */
export function readVerification(value: unknown, statusHint?: string | null): TaskVerification | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;

  const status = STATUSES.find((entry) => entry === (candidate.status ?? statusHint));
  if (!status) return null;

  const checks = readChecks(candidate.checks);
  if (checks.length === 0) return null;

  return {
    status,
    checks,
    model: readModel(candidate.model),
    attempts: typeof candidate.attempts === 'number' ? candidate.attempts : 1,
    repaired: Boolean(candidate.repaired),
    checkedAt: String(candidate.checkedAt ?? ''),
  };
}
