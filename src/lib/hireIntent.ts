const KEY = 'nexora.pendingHire';

export function setPendingHire(employeeId: string) {
  try {
    sessionStorage.setItem(KEY, employeeId);
  } catch {
    /* ignore */
  }
}

export function consumePendingHire(onHire: (employeeId: string) => void) {
  try {
    const employeeId = sessionStorage.getItem(KEY);
    if (!employeeId) return;
    onHire(employeeId);
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
