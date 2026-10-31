import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { AuthShell } from '@/components/marketing/AuthShell';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/Field';
import { DEMO_RESET_COPY, useAuth } from '@/context/AuthContext';
import { backendConfigured } from '@/lib/supabase';

/**
 * Step two: the page the recovery email points at.
 *
 * Supabase puts a recovery token in the URL and the client trades it for a session, so "arrived
 * from a valid link" is the same thing as "there is a session". No session means the link was
 * already used, expired, or was typed by hand — each of which wants the same sentence and the
 * same next step.
 */
export function ResetPassword() {
  const { user, isReady, setPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // Supabase parses the recovery token out of the URL while the client initialises, so the
  // session can land a beat after first paint. Waiting briefly avoids flashing "link expired"
  // at someone whose link is perfectly good.
  const [graceOver, setGraceOver] = useState(false);

  useEffect(() => {
    if (!backendConfigured) return;
    const timer = setTimeout(() => setGraceOver(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirm) {
      setError('Both passwords must match.');
      return;
    }

    setLoading(true);
    try {
      await setPassword(password);
      setDone(true);
      setPasswordValue('');
      setConfirm('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update the password.');
    } finally {
      setLoading(false);
    }
  };

  if (!backendConfigured) {
    return (
      <AuthShell
        title="Choose a new password."
        subtitle="This page finishes a password reset that started in your inbox."
        footer={
          <Link to="/login" className="font-medium text-[#9df7c2] hover:text-white">
            Back to sign in
          </Link>
        }
      >
        <Notice icon={<ShieldAlert className="size-4 text-[#e8c98a]" />}>{DEMO_RESET_COPY}</Notice>
      </AuthShell>
    );
  }

  if (!isReady || (!user && !graceOver)) {
    return (
      <AuthShell
        title="Choose a new password."
        subtitle="This page finishes a password reset that started in your inbox."
        footer={<span className="text-[#9aaab3]">One moment…</span>}
      >
        <p role="status" className="text-[12.5px] text-[#aabbc2]">
          Checking your reset link…
        </p>
      </AuthShell>
    );
  }

  if (!user) {
    return (
      <AuthShell
        title="This link no longer works."
        subtitle="Reset links expire after an hour and can only be used once."
        footer={
          <Link to="/login" className="font-medium text-[#9df7c2] hover:text-white">
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-4">
          <Notice icon={<AlertCircle className="size-4 text-[#e8c98a]" />}>
            Request a fresh link and open it in this browser — the old one has already been spent.
          </Notice>
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => navigate('/forgot-password')}
            iconRight={<ArrowRight className="size-4" />}
          >
            Send me a new link
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell
        title="Password updated."
        subtitle={`You’re signed in as ${user.email}. Every other device stays signed in until it next refreshes.`}
        footer={
          <Link to="/login" className="font-medium text-[#9df7c2] hover:text-white">
            Sign in again later
          </Link>
        }
      >
        <div className="space-y-4">
          <Notice icon={<CheckCircle2 className="size-4 text-[#9df7c2]" />}>
            Use the new password from now on. Nothing else about your workspace changed.
          </Notice>
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => navigate('/dashboard', { replace: true })}
            iconRight={<ArrowRight className="size-4" />}
          >
            Continue to your workspace
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password."
      subtitle={`Signing in as ${user.email}. Pick something you have not used here before.`}
      footer={
        <Link to="/login" className="font-medium text-[#9df7c2] hover:text-white">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <PasswordField
          label="New password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={<KeyRound className="size-4" />}
          value={password}
          onChange={(event) => setPasswordValue(event.target.value)}
          required
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/[0.07] px-3 py-2.5">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-300" />
            <p className="text-[12px] leading-relaxed text-rose-200">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          iconRight={!loading ? <ArrowRight className="size-4" /> : undefined}
        >
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}

function Notice({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="text-[12.5px] leading-relaxed text-[#c4d3d8]">{children}</p>
    </div>
  );
}
