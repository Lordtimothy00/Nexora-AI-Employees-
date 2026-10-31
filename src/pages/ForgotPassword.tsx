import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, AtSign, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/marketing/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { useAuth } from '@/context/AuthContext';
import { backendConfigured } from '@/lib/supabase';

/**
 * Step one of recovery: ask Supabase to email a link. The confirmation never says whether the
 * address exists — that would turn the form into a membership oracle — so the copy stays neutral.
 */
export function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send the reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password."
      subtitle="Enter the email you signed up with and we’ll send a single-use link to choose a new one."
      footer={
        <span className="text-[#9aaab3]">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-[#9df7c2] hover:text-white">
            Sign in
          </Link>
        </span>
      }
    >
      {sentTo ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-[#0bd39a]/25 bg-[#0bd39a]/[0.08] px-3.5 py-3">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-[#9df7c2]" />
            <div className="text-[12.5px] leading-relaxed text-[#e6efec]">
              <p className="font-medium">Check your inbox.</p>
              <p className="mt-1 text-[#c4d3d8]">
                If nexora.ai has a workspace for <span className="text-white">{sentTo}</span>, the
                link is on its way. It works once and expires in an hour.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => {
              setSentTo(null);
              setEmail('');
            }}
          >
            Use a different email
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-[#8d9ea7]">
            Nothing arrived? Check spam, then try again in a minute — we throttle repeat requests.
          </p>
        </div>
      ) : (
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

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/[0.07] px-3 py-2.5">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-300" />
              <p className="text-[12px] leading-relaxed text-rose-200">{error}</p>
            </div>
          )}

          {!backendConfigured && !error && (
            <div className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#aabbc2]">
              This build has no backend connected, so no email can be sent. Sign in with the demo
              account instead.
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            iconRight={!loading ? <ArrowRight className="size-4" /> : undefined}
          >
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
