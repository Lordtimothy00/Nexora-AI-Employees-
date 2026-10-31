import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, AtSign, Lock, Sparkles } from 'lucide-react';
import { AuthShell } from '@/components/marketing/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field, PasswordField } from '@/components/ui/Field';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { consumePendingHire } from '@/lib/hireIntent';

export function Login() {
  const { login, user, isReady } = useAuth();
  const { hire } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && user) navigate(from, { replace: true });
  }, [isReady, user, from, navigate]);

  const complete = async (nextEmail: string, nextPassword: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(nextEmail, nextPassword);
      consumePendingHire(hire);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void complete(email, password);
  };

  const useDemo = () => {
    setEmail('demo@nexora.ai');
    setPassword('demo1234');
    void complete('demo@nexora.ai', 'demo1234');
  };

  return (
    <AuthShell
      title="Welcome back."
      subtitle={
        <>
          Sign in to your workspace. New here?{' '}
          <Link to="/signup" className="font-medium text-[#9df7c2] hover:text-white">
            Hire your first AI employee
          </Link>
          .
        </>
      }
      footer={
        <span className="text-[#9aaab3]">
          Protected by SOC 2 Type II controls ·{' '}
          <Link to="/how-it-works#security" className="hover:text-white">
            Security
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock className="size-4" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <div className="flex items-center justify-end pt-0.5">
          <Link
            to="/forgot-password"
            className="text-[12px] text-[#aabbc2] transition-colors hover:text-white"
          >
            Forgot your password?
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/[0.07] px-3 py-2.5">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-300" />
            <p className="text-[12px] leading-relaxed text-rose-200">{error}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading} iconRight={!loading ? <ArrowRight className="size-4" /> : undefined}>
          Sign in
        </Button>

        <div className="relative py-1 text-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/8" />
          <span className="relative bg-[#051718] px-3 text-[10.5px] uppercase tracking-[0.14em] text-[#8d9ea7]">
            or
          </span>
        </div>

        <Button type="button" variant="secondary" size="lg" className="w-full" onClick={useDemo}>
          <Sparkles className="size-4 text-[#9df7c2]" /> Continue with the demo workspace
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-[#8d9ea7]">
          Demo credentials: demo@nexora.ai · demo1234. This preview stores everything locally in
          your browser.
        </p>
      </form>
    </AuthShell>
  );
}
