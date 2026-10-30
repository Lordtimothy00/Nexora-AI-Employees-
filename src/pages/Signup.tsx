import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, AtSign, Building2, Check, Lock, User } from 'lucide-react';
import { AuthShell } from '@/components/marketing/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field, PasswordField } from '@/components/ui/Field';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { consumePendingHire } from '@/lib/hireIntent';
import { plans } from '@/data/site';
import { cn } from '@/lib/utils';

const strengthLabels = ['Too short', 'Weak', 'Getting there', 'Strong', 'Excellent'];

export function Signup() {
  const { signup, user, isReady } = useAuth();
  const { hire } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  const plan = plans.find((entry) => entry.id === planId) ?? plans[1];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && user) navigate('/dashboard', { replace: true });
  }, [isReady, user, navigate]);

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
  }, [password]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError('Tell us your name so your employees know who they work for.');
    if (!email.includes('@')) return setError('Enter a valid work email address.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (!agreed) return setError('Please accept the terms to continue.');

    setLoading(true);
    try {
      await signup({ name, email, company, password });
      consumePendingHire(hire);
      navigate('/dashboard', { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create your workspace. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Build your team."
      subtitle={
        <>
          Create a workspace, hire your first AI employee, and get 14 days of Growth — no card
          required. Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#e2fa9e] hover:text-white">
            Sign in
          </Link>
          .
        </>
      }
      footer={
        <span className="text-[#9ba2ab]">
          By signing up you agree to our{' '}
          <Link to="/how-it-works#security" className="underline decoration-white/20 hover:text-white">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/how-it-works#security" className="underline decoration-white/20 hover:text-white">
            Privacy Policy
          </Link>
          .
        </span>
      }
    >
      <div className="mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#9ba2ab]">Selected plan</p>
          <p className="mt-0.5 text-[13px] font-medium text-white">
            {plan.name} · 14-day free trial
          </p>
        </div>
        <Link to="/pricing" className="text-[11.5px] text-[#e2fa9e] hover:text-white">
          Change
        </Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          label="Full name"
          autoComplete="name"
          placeholder="Alex Morgan"
          icon={<User className="size-4" />}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Field
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          icon={<AtSign className="size-4" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Field
          label="Company"
          autoComplete="organization"
          placeholder="Northwind Labs"
          icon={<Building2 className="size-4" />}
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          hint="Optional"
        />
        <div>
          <PasswordField
            label="Create password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            icon={<Lock className="size-4" />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      index < strength
                        ? strength >= 3
                          ? 'bg-mint'
                          : 'bg-[#d8dfe7]'
                        : 'bg-white/10',
                    )}
                  />
                ))}
              </div>
              <span className="w-20 text-right text-[10px] text-[#a9b0b9]">{strengthLabels[strength]}</span>
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-[11.5px] leading-relaxed text-[#acb3bc]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 size-3.5 rounded border-white/20 bg-white/5 accent-[#c8f060]"
          />
          <span>
            I agree to the Terms of Service and Privacy Policy, and to let Nexora employees act on my
            behalf within the permissions I set.
          </span>
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/[0.07] px-3 py-2.5">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-300" />
            <p className="text-[12px] leading-relaxed text-rose-200">{error}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading} iconRight={!loading ? <ArrowRight className="size-4" /> : undefined}>
          Create workspace
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-[10.5px] text-[#9ba2ab]">
          {['No credit card', 'Cancel anytime', 'Keep your deliverables'].map((item) => (
            <span key={item} className="inline-flex items-center gap-1">
              <Check className="size-3 text-mint" /> {item}
            </span>
          ))}
        </div>

        <p className="text-center text-[11px] leading-relaxed text-[#8a919a]">
          This is a product preview — accounts are stored locally in your browser, never on a server.
        </p>
      </form>
    </AuthShell>
  );
}
