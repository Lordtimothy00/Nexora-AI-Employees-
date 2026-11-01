import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { employees } from '@/data/employees';
import { resetBackStack } from '@/lib/backStack';
import { explainBillingError, LOCKED_STATUSES, lockExplanation, TRIAL_DAYS } from '@/lib/billing';
import { faqs } from '@/data/site';
import { describeInviteOutcome, explainInviteFailure } from '@/lib/invites';
import { explainRunFailure, scriptedDeliverable } from '@/lib/tasks';
import { DEFAULT_PREFS, normalisePrefs, prefsEqual } from '@/lib/prefs';
import { explainReplyFailure } from '@/lib/replies';
import { ogImageFor, publicRoutes, routeFor, routeMeta } from '@/data/routes.ts';

// Every card on disk, resolved by Vite rather than by reading the file system — the app tsconfig
// deliberately has no Node types, and this still fails if a file is missing.
const cardFiles = Object.keys(
  import.meta.glob('/public/og/*.png', { eager: true, query: '?url', import: 'default' }),
).map((entry) => entry.replace('/public', ''));

beforeEach(() => {
  resetBackStack();
  localStorage.removeItem('nexora.workspace.v2');
});

const renderAt = (path: string) => {
  window.history.pushState({}, '', path);
  return render(<App />);
};

const seedSession = () => {
  localStorage.setItem(
    'nexora.auth.v1',
    JSON.stringify({
      user: {
        id: 'usr_test',
        name: 'Alex Morgan',
        email: 'demo@nexora.ai',
        company: 'Northwind Labs',
        role: 'Founder & CEO',
        plan: 'growth',
        createdAt: new Date().toISOString(),
      },
    }),
  );
};

describe('marketing pages', () => {
  it('renders the home hero and featured employees', async () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Your AI Employees/i);
    expect(screen.getByRole('link', { name: /Browse all/i })).toBeInTheDocument();
    expect(screen.getAllByText('Ava').length).toBeGreaterThan(0);
  });

  it('renders the resources library and its guides', async () => {
    renderAt('/resources');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/run an AI team/i);
    expect(
      await screen.findByText(/The first-week onboarding checklist/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Documentation/i })).toBeInTheDocument();
  });

  it('opens a resource article from the index', async () => {
    renderAt('/resources/writing-a-brief');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/write a brief/i);
    expect(screen.getByRole('heading', { name: /Four lines every brief needs/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /All resources/i }).length).toBeGreaterThan(0);
  });

  it('lists every AI employee and filters by department', async () => {
    const user = userEvent.setup();
    renderAt('/employees');

    expect(await screen.findByText(`${employees.length} employees`)).toBeInTheDocument();
    for (const person of employees) {
      expect(screen.getAllByText(person.name).length).toBeGreaterThan(0);
    }

    await user.click(screen.getByRole('button', { name: /^Support/ }));

    expect(screen.queryByRole('heading', { name: 'Ava' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kai' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Support/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('returns to the last page from the back button', async () => {
    const user = userEvent.setup();
    renderAt('/');

    const nav = screen.getByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'Pricing' }));

    // Pricing is a lazy route: give the chunk room to arrive before asserting on it.
    expect(
      await screen.findByRole('heading', { name: /Hire a department/i }, { timeout: 4000 }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Back to Home/i }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Your AI Employees/i),
    );
  });

  it('renders pricing tiers and toggles annual billing', async () => {
    const user = userEvent.setup();
    renderAt('/pricing');

    expect(await screen.findByRole('heading', { name: /Hire a department/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Growth' })).toBeInTheDocument();
    expect(screen.getByText('$55')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Annual/i }));
    expect(screen.getAllByText('$44').length).toBeGreaterThan(0);
  });

  it('shows a 404 page for unknown routes', async () => {
    renderAt('/does-not-exist');
    expect(
      await screen.findByRole('heading', { name: /never got hired/i }),
    ).toBeInTheDocument();
  });
});

describe('employee detail and hiring', () => {
  it('sends guests to signup when they try to hire', async () => {
    const user = userEvent.setup();
    renderAt('/employees/ava-sales-development');

    expect(await screen.findByRole('heading', { name: 'Ava' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Start free and hire/i }));

    expect(
      await screen.findByRole('heading', { name: /Build your team/i }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('hires an employee into the workspace when signed in', async () => {
    const user = userEvent.setup();
    seedSession();
    renderAt('/employees/nova-growth-strategist');

    expect(await screen.findByRole('heading', { name: 'Nova' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Hire Nova$/i }));

    expect(await screen.findByText(/Nova is on your team/i, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open your workspace/i })).toBeInTheDocument();
  });
});

describe('route health', () => {
  it('renders every route without React warnings', async () => {
    seedSession();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const routes = [
      '/',
      '/employees',
      '/employees/atlas-data-analyst',
      '/how-it-works',
      '/pricing',
      '/dashboard',
      '/dashboard/team',
      '/dashboard/tasks',
      '/dashboard/conversations',
      '/dashboard/analytics',
      '/dashboard/billing',
      '/dashboard/settings',
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/missing-page',
    ];

    for (const route of routes) {
      const view = renderAt(route);
      await waitFor(() => expect(document.body.textContent?.length ?? 0).toBeGreaterThan(200));
      view.unmount();
    }

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('authentication and dashboard', () => {
  it('keeps roster controls out of the local demo', async () => {
    seedSession();
    renderAt('/dashboard/team');

    // Membership lives in Postgres; with no backend there is nobody to invite, promote or leave.
    expect(await screen.findByText(/This browser only/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Leave/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Invite role/i)).not.toBeInTheDocument();
  });

  it('protects dashboard routes from guests', async () => {
    renderAt('/dashboard/team');
    expect(
      await screen.findByRole('heading', { name: /Welcome back/i }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('signs in with the demo workspace and shows the dashboard', async () => {
    const user = userEvent.setup();
    renderAt('/login');

    await screen.findByRole('heading', { name: /Welcome back/i });
    await user.click(screen.getByRole('button', { name: /Continue with the demo workspace/i }));

    expect(
      await screen.findByText('Active employees', {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Tasks this month')).toBeInTheDocument();
  });

  it('validates the signup form before creating a workspace', async () => {
    const user = userEvent.setup();
    renderAt('/signup');

    await user.click(await screen.findByRole('button', { name: /Create workspace/i }));
    expect(screen.getByText(/Tell us your name/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Full name'), 'Jamie Rivers');
    await user.type(screen.getByLabelText('Work email'), 'jamie@acme.co');
    await user.type(screen.getByLabelText('Create password'), 'supersecret1');
    await user.click(screen.getByRole('button', { name: /Create workspace/i }));
    expect(screen.getByText(/Please accept the terms/i)).toBeInTheDocument();
  });
});

describe('password recovery', () => {
  it('offers the real recovery route from the sign-in form', async () => {
    renderAt('/login');
    await screen.findByRole('heading', { name: /Welcome back/i });

    const link = screen.getByRole('link', { name: /Forgot your password/i });
    expect(link).toHaveAttribute('href', '/forgot-password');
    // The old build had a button that only apologised; there is nothing left to click that lies.
    expect(screen.queryByRole('button', { name: /^Reset password$/i })).not.toBeInTheDocument();
  });

  it('will not promise an email the local demo cannot send', async () => {
    const user = userEvent.setup();
    renderAt('/forgot-password');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/reset your password/i);
    await user.type(screen.getByLabelText(/work email/i), 'someone@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(
      await screen.findByText(/demo workspace has no password to reset/i),
    ).toBeInTheDocument();
    // No false "check your inbox" while nothing was sent.
    expect(screen.queryByText(/check your inbox/i)).not.toBeInTheDocument();
  });

  it('explains a reset page opened without a live link', async () => {
    renderAt('/reset-password');

    expect(
      await screen.findByText(/demo workspace has no password to reset/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to sign in/i })).toHaveAttribute('href', '/login');
  });

  it('keeps the settings password form read-only in the local demo', async () => {
    seedSession();
    renderAt('/dashboard/settings');

    expect(
      await screen.findByText(/no account, so there is no password to change/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update password/i })).toBeDisabled();
  });
});

const seedEmptyWorkspace = () => {
  localStorage.setItem(
    'nexora.workspace.v2',
    JSON.stringify({ hires: [], tasks: [], messages: [], activities: [] }),
  );
};

describe('invite copy', () => {
  it('names the reason an invite was refused', () => {
    expect(explainInviteFailure(403, 'not_admin')).toMatch(/only owners and admins/i);
    expect(explainInviteFailure(429, 'invite_rate_limited')).toMatch(/last hour/i);
    expect(explainInviteFailure(501, 'not_configured')).toMatch(/not configured/i);
    expect(explainInviteFailure(503, 'membership_check_failed')).toMatch(/try again/i);
    // An unrecognised body falls back to the status, then to a plain apology.
    expect(explainInviteFailure(403, 'who_knows')).toMatch(/only owners and admins/i);
    expect(explainInviteFailure(undefined, 'who_knows')).toMatch(/could not create/i);
  });

  it('never claims an email went out when it did not', () => {
    expect(describeInviteOutcome('ada@acme.co', { emailed: true, link: 'https://x/invite/1' })).toMatch(
      /emailed to ada@acme\.co/i,
    );
    expect(
      describeInviteOutcome('ada@acme.co', { emailed: false, link: 'https://x/invite/1', reason: 'has_account' }),
    ).toMatch(/already has a Nexora account/i);
    expect(
      describeInviteOutcome('ada@acme.co', { emailed: false, link: 'https://x/invite/1', reason: 'send_failed' }),
    ).toMatch(/did not send/i);
    // Both no-email cases promise the link is on the clipboard, because that is the only way in.
    expect(
      describeInviteOutcome('ada@acme.co', { emailed: false, link: 'https://x/invite/1', reason: 'send_failed' }),
    ).toMatch(/clipboard/i);
  });
});

describe('notification preferences', () => {
  it('keeps the shape whatever the profile returns', () => {
    expect(normalisePrefs(undefined)).toEqual(DEFAULT_PREFS);
    expect(normalisePrefs('nonsense')).toEqual(DEFAULT_PREFS);
    expect(normalisePrefs([true, false])).toEqual(DEFAULT_PREFS);
    // A partial row keeps the stored keys and fills the rest from the defaults.
    expect(normalisePrefs({ digest: false, approvals: 'yes' })).toEqual({
      ...DEFAULT_PREFS,
      digest: false,
    });
    expect(prefsEqual(DEFAULT_PREFS, normalisePrefs({ ...DEFAULT_PREFS }))).toBe(true);
  });

  it('persists a toggle instead of forgetting it on reload', async () => {
    const user = userEvent.setup();
    seedSession();
    renderAt('/dashboard/settings');

    const digest = await screen.findByRole('switch', { name: 'Morning digest' });
    expect(digest).toHaveAttribute('aria-checked', 'true');
    // Nothing to save until something changes.
    expect(screen.getByRole('button', { name: /^Saved$/ })).toBeDisabled();

    await user.click(digest);
    expect(digest).toHaveAttribute('aria-checked', 'false');

    await user.click(screen.getByRole('button', { name: /Save preferences/ }));

    // Written through the profile, which the demo keeps in localStorage.
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('nexora.auth.v1') ?? '{}');
      expect(stored.user?.prefs?.digest).toBe(false);
    });
    expect(screen.getByRole('button', { name: /^Saved$/ })).toBeDisabled();
  });
});

describe('running a task', () => {
  it('delivers a template in the demo and labels it as one', async () => {
    const user = userEvent.setup();
    seedSession();
    renderAt('/dashboard/tasks');

    const runButtons = await screen.findAllByRole('button', { name: /^Run /i });
    await user.click(runButtons[0]);

    // The panel opens on the deliverable, and nothing pretends a model wrote it.
    expect(await screen.findByText(/Scripted deliverable for/i)).toBeInTheDocument();
    expect(screen.getByText('Scripted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run again/i })).toBeInTheDocument();
    // It lands in the conversation, and the panel says the demo stops there — the live path is the
    // one that also writes the activity feed, so this copy must not promise a feed entry.
    expect(screen.getByText(/Posted to the conversation in this demo build only/i)).toBeInTheDocument();
    expect(screen.queryByText(/activity feed/i)).not.toBeInTheDocument();
  });

  it('names the reason a run produced nothing', () => {
    expect(explainRunFailure('rate_limited')).toMatch(/hourly run limit/i);
    expect(explainRunFailure('not_member')).toMatch(/members of this workspace/i);
    expect(explainRunFailure('task_not_found')).toMatch(/no longer exists/i);
    expect(explainRunFailure('not_configured')).toMatch(/no model key/i);
    expect(explainRunFailure('provider_error')).toMatch(/nothing was written/i);
    expect(explainRunFailure('provider_error', 'insufficient_quota')).toMatch(/out of credits/i);
  });

  it('builds the scripted deliverable from the brief, not invented results', () => {
    const draft = scriptedDeliverable(
      { id: 't1', title: 'Draft the launch email', detail: 'One email, two paragraphs.', priority: 'High', due: 'Fri' },
      { name: 'Ava', role: 'Sales Development Rep' },
    );

    expect(draft).toMatch(/Ava/);
    expect(draft).toMatch(/Draft the launch email/);
    expect(draft).toContain('One email, two paragraphs.');
    expect(draft).toMatch(/no model was called/i);
  });
});

describe('task detail sheet', () => {
  // The sheet used to grow past the viewport with no scroll container anywhere, so on a short
  // screen the footer buttons sat off-screen and nothing could bring them back. jsdom cannot
  // measure heights, so this pins the structure that makes it impossible: one capped column, one
  // scrolling middle, footer outside that scroller.
  it('is height-capped with a single scroll region and a pinned footer', async () => {
    const user = userEvent.setup();
    seedSession();
    renderAt('/dashboard/tasks');

    // Anchored at the start so it picks the card, not the "Run <title>" button beside it.
    const [card] = await screen.findAllByRole('button', { name: /^Clear northeast carrier delay tickets/i });
    await user.click(card);

    const dialog = await screen.findByRole('dialog');
    expect(dialog.className).toMatch(/max-h-\[92dvh\]/);
    expect(dialog.className).toMatch(/sm:max-h-\[calc\(100dvh-3rem\)\]/);
    expect(dialog.className).toMatch(/flex-col/);
    expect(dialog.className).not.toMatch(/(^|\s)(h|min-h)-/);

    const scrollers = [...dialog.querySelectorAll('.overflow-y-auto')];
    expect(scrollers).toHaveLength(1);
    expect(scrollers[0].className).toMatch(/min-h-0/);
    expect(scrollers[0].className).toMatch(/flex-1/);

    // Actions stay reachable: they are siblings of the scroller, not something inside it.
    const run = within(dialog).getByRole('button', { name: 'Run task' });
    expect(scrollers[0].contains(run)).toBe(false);
    expect(dialog.contains(run)).toBe(true);
  });

  it('closes on Escape without leaving the page locked', async () => {
    const user = userEvent.setup();
    seedSession();
    const { unmount } = renderAt('/dashboard/tasks');

    const [card] = await screen.findAllByRole('button', { name: /^Revenue churn readout for October/i });
    await user.click(card);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');

    unmount();
  });
});

describe('empty workspace', () => {
  beforeEach(() => {
    seedSession();
    seedEmptyWorkspace();
  });

  it('offers a first hire on every dashboard surface instead of blank panels', async () => {
    const surfaces: { path: string; copy: RegExp }[] = [
      { path: '/dashboard', copy: /Your first employee is waiting/i },
      { path: '/dashboard/team', copy: /No employees hired yet/i },
      { path: '/dashboard/tasks', copy: /No one to delegate to yet/i },
      { path: '/dashboard/conversations', copy: /No conversations yet/i },
      { path: '/dashboard/analytics', copy: /No data to analyse yet/i },
    ];

    for (const surface of surfaces) {
      const view = renderAt(surface.path);
      expect(await screen.findByText(surface.copy)).toBeInTheDocument();
      view.unmount();
    }
  });

  it('says the reply is scripted instead of passing it off as the model', async () => {
    const user = userEvent.setup();
    seedSession();
    renderAt('/employees/ava-sales-development');

    await user.click(await screen.findByRole('button', { name: /^Hire Ava$/i }));
    await user.click(await screen.findByRole('link', { name: /Open your workspace/i }));

    const nav = await screen.findAllByRole('link', { name: /Conversations/i });
    await user.click(nav[0]);

    const box = await screen.findByLabelText(/Message Ava/i);
    await user.type(box, 'what needs my approval?');
    await user.click(screen.getByRole('button', { name: /Send message/i }));

    expect(
      await screen.findByText(/no backend configured/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Scripted')).toBeInTheDocument();
  });

  it('keeps the workspace label static in the local demo', async () => {
    seedSession();
    renderAt('/dashboard');

    // No backend, so there are no memberships to list or create: a plain label, no menu.
    expect((await screen.findAllByText('Northwind Labs')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /switch workspace/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows no receipts and no card for the demo workspace', async () => {
    renderAt('/dashboard/billing');
    expect(await screen.findByText(/No invoices yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/INV-\d{6}/)).not.toBeInTheDocument();
    expect(screen.getByText(/Stripe is not connected/i)).toBeInTheDocument();
    // The old page printed a fake Visa ending 4242 and claimed an Active plan.
    expect(screen.queryByText(/4242/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Active$/)).not.toBeInTheDocument();
    expect(screen.getByText(/No plan yet/i)).toBeInTheDocument();
  });

  it('does not invent receipts for an old account either', async () => {
    localStorage.setItem(
      'nexora.auth.v1',
      JSON.stringify({
        user: {
          id: 'usr_old',
          name: 'Alex Morgan',
          email: 'demo@nexora.ai',
          company: 'Northwind Labs',
          role: 'Founder & CEO',
          plan: 'growth',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 92).toISOString(),
        },
      }),
    );

    renderAt('/dashboard/billing');
    // Age once implied a paid invoice every month. Nothing was ever charged, so nothing is listed.
    expect(await screen.findByText(/No invoices yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/INV-\d{6}/)).not.toBeInTheDocument();
    expect(screen.getByText(/Stripe is not connected/i)).toBeInTheDocument();
  });

  it('renders billing and settings with no employees and no errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const billing = renderAt('/dashboard/billing');
    expect(await screen.findByRole('heading', { name: /^Billing/i })).toBeInTheDocument();
    billing.unmount();

    const settings = renderAt('/dashboard/settings');
    expect(await screen.findByRole('heading', { name: /^Settings/i })).toBeInTheDocument();
    // The sidebar used to promise a Growth plan that nobody had paid for; no screen claims a tier now.
    expect(screen.queryByText(/Growth · monthly/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Plan$/i)).not.toBeInTheDocument();
    // Renaming and deleting a workspace need the workspaces table, so the local demo only offers a reset.
    expect(screen.getByRole('button', { name: /Reset demo workspace/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete workspace/i })).not.toBeInTheDocument();
    settings.unmount();

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('billing failure copy', () => {
  it('names the missing secret instead of a generic failure', () => {
    expect(explainBillingError({ code: 'not_configured', missing: ['STRIPE_SECRET_KEY'] })).toMatch(/STRIPE_SECRET_KEY/);
    expect(explainBillingError({ code: 'price_not_configured', missing: ['STRIPE_PRICE_SCALE_YEAR'] })).toMatch(
      /STRIPE_PRICE_SCALE_YEAR/,
    );
    expect(explainBillingError({ code: 'already_subscribed' })).toMatch(/already has a subscription/i);
    expect(explainBillingError({ code: 'stripe_error' })).toMatch(/nothing was charged/i);
  });
});

describe('reply failure messages', () => {
  it('names an out-of-credits provider instead of leaking a raw 429', () => {
    expect(
      explainReplyFailure('provider_error', 'openai 429: {"error":{"type":"insufficient_quota"}}'),
    ).toMatch(/run out of credits/i);
    expect(explainReplyFailure('provider_error', 'openai 401: bad key')).toMatch(/502/);
    expect(explainReplyFailure('not_configured')).toMatch(/no model key is set/i);
    expect(explainReplyFailure('no_workspace')).toMatch(/does not belong to a workspace/i);
    expect(explainReplyFailure('rate_limited')).toMatch(/hourly reply limit/i);
  });
});

describe('free trial', () => {
  it('offers three days and asks for a card wherever it mentions a trial', async () => {
    renderAt('/pricing');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/department/i);
    const intro = screen.getByText(/Start with 3 days free/i);
    expect(intro).toHaveTextContent(/once per account/i);
    expect(intro).toHaveTextContent(/card is required/i);
    expect(intro).toHaveTextContent(/charged\s*when the trial ends/i);
    // Nothing anywhere on the page may still promise the old two-week trial.
    expect(screen.queryByText(/14 days/i)).not.toBeInTheDocument();
  });

  it('keeps the trial at three days, expressed once and reused', () => {
    expect(TRIAL_DAYS).toBe(3);

    const trial = faqs.find((entry) => /trial/i.test(entry.q));
    expect(trial?.a).toMatch(/3 days/);
    expect(trial?.a).toMatch(/card is required/i);
    // The trial is per account, so the answer must not read like a per-workspace gift.
    expect(trial?.a).toMatch(/new account/i);
    expect(trial?.a).toMatch(/second workspace does not start another trial/i);
    expect(trial?.a).not.toMatch(/14 days|no card required|new workspace gets/i);
  });
});

describe('paused when payment fails', () => {
  it('pauses the team for every state Stripe uses for an unpaid plan', () => {
    // The same list the workspace_ai_locked() SQL function enforces, so the copy and the database
    // cannot drift apart.
    expect([...LOCKED_STATUSES]).toEqual([
      'past_due',
      'unpaid',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'paused',
    ]);
    expect(LOCKED_STATUSES).not.toContain('active');
    expect(LOCKED_STATUSES).not.toContain('trialing');
  });

  it('says what happened, what to do, and that nothing was deleted', () => {
    const failed = lockExplanation('past_due');
    expect(failed.title).toMatch(/paused/i);
    expect(failed.title).toMatch(/payment failed/i);
    expect(failed.body).toMatch(/update the payment method/i);
    expect(failed.body).toMatch(/all delivered work stays/i);

    const cancelled = lockExplanation('canceled');
    expect(cancelled.title).toMatch(/cancelled/i);
    expect(cancelled.body).toMatch(/still here/i);
    expect(cancelled.body).not.toMatch(/deleted/i);

    // An unknown status still pauses rather than silently letting work through.
    expect(lockExplanation(null).title).toMatch(/paused/i);
  });

  it('refuses work instead of faking it', () => {
    expect(explainRunFailure('payment_required')).toMatch(/paused/i);
    expect(explainRunFailure('payment_required')).toMatch(/billing/i);
    expect(explainReplyFailure('payment_required')).toMatch(/paused/i);
    // A paused workspace must never claim a scripted answer came from the employee.
    expect(explainReplyFailure('payment_required')).not.toMatch(/scripted/i);
  });

  it('tells visitors what a failed payment means before they sign up', () => {
    const answer = faqs.find((entry) => /payment fails/i.test(entry.q));
    expect(answer?.a).toMatch(/pause/i);
    expect(answer?.a).toMatch(/nothing is deleted/i);
  });
});

describe('per-route metadata and cards', () => {
  it('has a committed social card for every public route', () => {
    // The cards are generated by `npm run og` and committed, so this fails if a route is added
    // without regenerating — a broken og:image is invisible until someone shares the link.
    for (const route of publicRoutes) {
      expect(cardFiles, `${route.path} points at missing ${route.image}`).toContain(route.image);
    }
  });

  it('keeps everything behind the gate out of the sitemap', () => {
    const paths = publicRoutes.map((route) => route.path);
    expect(paths.some((entry) => entry.startsWith('/dashboard'))).toBe(false);
    expect(paths.some((entry) => /forgot-password|reset-password|invite/.test(entry))).toBe(false);
  });

  it('gives every employee and guide its own title and card', () => {
    const employeeRoutes = routeMeta.filter((route) => route.card === 'employee');
    expect(employeeRoutes).toHaveLength(8);
    expect(new Set(employeeRoutes.map((route) => route.image)).size).toBe(8);
    expect(routeFor('/employees/kai-customer-support').title).toMatch(/Kai/);
    expect(routeFor('/resources/writing-a-brief').card).toBe('guide');
  });

  it('falls back to a card that exists, and never indexes a miss', () => {
    expect(routeFor('/employees/not-a-real-person').image).toBe(ogImageFor('/employees'));
    expect(routeFor('/not-a-page').private).toBe(true);
    expect(routeFor('/pricing/').path).toBe('/pricing');
    expect(routeFor('/dashboard/tasks').private).toBe(true);
  });
});
