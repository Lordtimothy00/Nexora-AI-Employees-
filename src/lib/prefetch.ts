/**
 * Route prefetching. Every non-Home route is a separate chunk, so a cold click on
 * "Pricing" from a phone shows a skeleton for one fetch. Hovering or focusing a link
 * starts that fetch early; a failed prefetch is harmless because the route retries.
 */

type Loader = () => Promise<unknown>;

const loaders: Record<string, Loader> = {
  '/employees': () => import('@/pages/Employees'),
  '/how-it-works': () => import('@/pages/HowItWorks'),
  '/pricing': () => import('@/pages/Pricing'),
  '/resources': () => import('@/pages/Resources'),
  '/login': () => import('@/pages/Login'),
  '/signup': () => import('@/pages/Signup'),
  '/dashboard': () => import('@/pages/dashboard/Overview'),
  '/dashboard/team': () => import('@/pages/dashboard/Team'),
  '/dashboard/tasks': () => import('@/pages/dashboard/Tasks'),
  '/dashboard/conversations': () => import('@/pages/dashboard/Conversations'),
  '/dashboard/analytics': () => import('@/pages/dashboard/Analytics'),
  '/dashboard/billing': () => import('@/pages/dashboard/Billing'),
  '/dashboard/settings': () => import('@/pages/dashboard/Settings'),
};

const started = new Set<string>();

function normalise(to: string) {
  return to.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
}

/** Warm the chunk for a route the visitor is about to open. */
export function prefetchRoute(to: string) {
  const path = normalise(to);
  const loader = loaders[path];
  if (!loader || started.has(path)) return;

  started.add(path);
  void loader().catch(() => {
    // Let the real navigation surface the error and retry.
    started.delete(path);
  });
}

/** Warm the pages people most often open next, once the browser is idle. */
export function prefetchLikelyRoutes() {
  if (typeof window === 'undefined') return;

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return;

  const run = () => {
    for (const path of ['/employees', '/pricing', '/how-it-works']) prefetchRoute(path);
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(run, { timeout: 3000 });
  } else {
    setTimeout(run, 2000);
  }
}
