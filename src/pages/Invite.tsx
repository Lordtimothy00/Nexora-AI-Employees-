import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { acceptInvite } from '@/lib/backend';
import { backendConfigured } from '@/lib/supabase';

/**
 * Landing page for an invite link. The invite is accepted server-side (the email on the
 * session must match the one that was invited), then the app reloads into the workspace
 * so every provider re-reads its data.
 */
export function Invite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<'joining' | 'joined' | 'error'>('joining');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!backendConfigured) {
      setState('error');
      setMessage('Invites need a configured Supabase project — this build is running the local demo.');
      return;
    }

    if (!token) {
      setState('error');
      setMessage('This invite link is missing its token.');
      return;
    }

    void (async () => {
      try {
        await acceptInvite(token);
        if (cancelled) return;
        setState('joined');
        window.setTimeout(() => window.location.assign('/dashboard/team'), 900);
      } catch (caught) {
        if (cancelled) return;
        setState('error');
        setMessage(caught instanceof Error ? caught.message : 'Could not accept this invite.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="relative grid min-h-screen place-items-center px-5 py-16">
      <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur-2xl">
        <LogoMark className="mx-auto" />

        {state === 'joining' && (
          <>
            <p className="mt-5 font-display text-[17px] font-semibold text-white">Joining the workspace…</p>
            <p className="mt-1.5 text-[12.5px] text-[#aabbc2]">Checking the invite and your account.</p>
          </>
        )}

        {state === 'joined' && (
          <>
            <span className="mx-auto mt-5 grid size-10 place-items-center rounded-full bg-[#0bd39a]/15 text-[#9df7c2]">
              <CheckCircle2 className="size-5" />
            </span>
            <p className="mt-3 font-display text-[17px] font-semibold text-white">You are in</p>
            <p className="mt-1.5 text-[12.5px] text-[#aabbc2]">Opening the shared workspace…</p>
          </>
        )}

        {state === 'error' && (
          <>
            <span className="mx-auto mt-5 grid size-10 place-items-center rounded-full bg-rose-500/12 text-rose-300">
              <AlertCircle className="size-5" />
            </span>
            <p className="mt-3 font-display text-[17px] font-semibold text-white">This invite did not work</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#aabbc2]">{message}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
              <ButtonLink to="/" size="sm">
                Back home
              </ButtonLink>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#8d9ea7]">
              <Mail className="size-3" /> Ask an admin to send a fresh link.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
