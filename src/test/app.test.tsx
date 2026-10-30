import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { employees } from '@/data/employees';
import { resetBackStack } from '@/lib/backStack';

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

    expect(await screen.findByRole('heading', { name: /Hire a department/i })).toBeInTheDocument();
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

const seedEmptyWorkspace = () => {
  localStorage.setItem(
    'nexora.workspace.v2',
    JSON.stringify({ hires: [], tasks: [], messages: [], activities: [] }),
  );
};

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

  it('shows no receipts for a brand-new account', async () => {
    renderAt('/dashboard/billing');
    expect(await screen.findByText(/No invoices yet/i)).toBeInTheDocument();
    expect(screen.queryByText('INV-2041')).not.toBeInTheDocument();
  });

  it('shows receipts once the account has billing history', async () => {
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
    // Receipts are derived from the account age, one per month on the current plan.
    const receipts = await screen.findAllByText(/INV-\d{6}/);
    expect(receipts.length).toBeGreaterThan(0);
    expect(screen.queryByText(/No invoices yet/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Stripe is not connected/i)).toBeInTheDocument();
  });

  it('renders billing and settings with no employees and no errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const billing = renderAt('/dashboard/billing');
    expect(await screen.findByRole('heading', { name: /^Billing/i })).toBeInTheDocument();
    billing.unmount();

    const settings = renderAt('/dashboard/settings');
    expect(await screen.findByRole('heading', { name: /^Settings/i })).toBeInTheDocument();
    settings.unmount();

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
