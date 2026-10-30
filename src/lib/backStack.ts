import { employees } from '@/data/employees';

export type PageEntry = {
  path: string;
  label: string;
};

const STORAGE_KEY = 'nexora.back-stack.v1';
const MAX_ENTRIES = 25;

const staticLabels: { match: RegExp; label: string }[] = [
  { match: /^\/$/, label: 'Home' },
  { match: /^\/employees\/?$/, label: 'AI Employees' },
  { match: /^\/how-it-works$/, label: 'How it works' },
  { match: /^\/pricing$/, label: 'Pricing' },
  { match: /^\/login$/, label: 'Sign in' },
  { match: /^\/signup$/, label: 'Sign up' },
  { match: /^\/dashboard\/?$/, label: 'Dashboard' },
  { match: /^\/dashboard\/team$/, label: 'My team' },
  { match: /^\/dashboard\/tasks$/, label: 'Tasks' },
  { match: /^\/dashboard\/conversations$/, label: 'Conversations' },
  { match: /^\/dashboard\/analytics$/, label: 'Analytics' },
  { match: /^\/dashboard\/billing$/, label: 'Billing' },
  { match: /^\/dashboard\/settings$/, label: 'Settings' },
];

/** Human name for a route, used by the global back button. */
export function pageLabel(pathname: string): string {
  const employee = employees.find((person) => pathname === `/employees/${person.slug}`);
  if (employee) return employee.name;
  return staticLabels.find((item) => item.match.test(pathname))?.label ?? 'previous page';
}

function readStack(): PageEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is PageEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as PageEntry).path === 'string' &&
        typeof (entry as PageEntry).label === 'string',
    );
  } catch {
    return [];
  }
}

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  } catch {
    /* storage can be unavailable — the in-memory stack still works */
  }
}

let stack: PageEntry[] = readStack();

/**
 * Keep a small, session-scoped trail of visited pages.
 *
 * `POP` means the browser (or our own back button) moved through history, so we rewind the
 * trail instead of appending — this keeps "back to the last page" accurate in both directions.
 */
export function recordPage(entry: PageEntry, navigationType: 'PUSH' | 'REPLACE' | 'POP') {
  const last = stack[stack.length - 1];

  if (navigationType === 'POP') {
    const index = stack.map((item) => item.path).lastIndexOf(entry.path);
    stack = index >= 0 ? stack.slice(0, index + 1) : [...stack, entry];
  } else if (navigationType === 'REPLACE' || last?.path === entry.path) {
    stack = stack.length > 0 ? [...stack.slice(0, -1), entry] : [entry];
  } else {
    stack = [...stack, entry];
  }

  if (stack.length > MAX_ENTRIES) stack = stack.slice(-MAX_ENTRIES);
  persist();
}

/** The page the visitor was on before the current one, if known. */
export function previousPage(): PageEntry | null {
  return stack.length > 1 ? stack[stack.length - 2] : null;
}

/** Test helper — clears the in-memory + persisted trail. */
export function resetBackStack() {
  stack = [];
  persist();
}
