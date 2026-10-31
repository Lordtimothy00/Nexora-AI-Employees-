import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { fetchProfile, updateProfile as updateRemoteProfile } from '@/lib/backend';
import { backendConfigured, getSupabase } from '@/lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  plan: 'launch' | 'growth' | 'scale';
  createdAt: string;
}

export interface SignupInput {
  name: string;
  email: string;
  company: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (input: SignupInput) => Promise<User>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'email' | 'company' | 'role'>>) => void;
  /** Emails a recovery link that lands on /reset-password. */
  requestPasswordReset: (email: string) => Promise<void>;
  /** Sets a new password for the signed-in (or recovered) session. */
  setPassword: (password: string) => Promise<void>;
}

const STORAGE_KEY = 'nexora.auth.v1';
const AuthContext = createContext<AuthContextValue | null>(null);

/** Shown wherever a password action is attempted against the browser-only demo workspace. */
export const DEMO_RESET_COPY =
  'Passwords live in Supabase, not in this browser — the demo workspace has no password to reset. Sign in with the demo account or create a real workspace.';

// The demo workspace is meant to look established: three months of history so the
// billing and analytics screens have something real to show. Fresh signups start at
// today and correctly see empty states instead.
const demoCreatedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 92).toISOString();

const demoUser: User = {
  id: 'usr_demo',
  name: 'Alex Morgan',
  email: 'demo@nexora.ai',
  company: 'Northwind Labs',
  role: 'Founder & CEO',
  plan: 'growth',
  createdAt: demoCreatedAt,
};

const readStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user?: User };
    return parsed.user ?? null;
  } catch {
    return null;
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Supabase errors are accurate but blunt; these are the ones a person will actually hit. */
function friendlyAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match.';
  if (/already registered|already exists/i.test(message)) {
    return 'That email already has a workspace. Try signing in instead.';
  }
  if (/email not confirmed/i.test(message)) return 'Confirm your email first — we sent you a link.';
  if (/password should be at least/i.test(message)) {
    return 'Use at least 8 characters for your password.';
  }
  // Recovery links and password changes both hit this when the session has gone stale.
  if (/auth session missing|session.*expired|invalid.*(token|jwt)|token.*expired/i.test(message)) {
    return 'This reset link has expired. Request a new one.';
  }
  // Supabase throttles recovery emails per address and hides the real reason behind timing advice.
  if (/for security purposes|rate limit|too many requests/i.test(message)) {
    return 'Too many attempts — wait a minute and try again.';
  }
  if (/should be different from the old password/i.test(message)) {
    return 'Choose a password you have not used here before.';
  }
  if (/weak|pwned|breach/i.test(message)) return 'That password is too easy to guess. Try another.';
  return message;
}

function mapRemoteUser(authUser: SupabaseUser, profile: Awaited<ReturnType<typeof fetchProfile>>): User {
  const meta = (authUser.user_metadata ?? {}) as { name?: string; company?: string };

  return {
    id: authUser.id,
    name: profile?.name || meta.name || nameFromEmail(authUser.email ?? ''),
    email: authUser.email ?? '',
    company: profile?.company || meta.company || 'New workspace',
    role: profile?.role || 'Workspace owner',
    plan: profile?.plan ?? 'growth',
    createdAt: profile?.created_at ?? authUser.created_at ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const pending = getSupabase();

    if (!pending) {
      setUser(readStoredUser());
      setIsReady(true);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    void (async () => {
      const db = await pending;
      const { data } = await db.auth.getSession();
      const sessionUser = data.session?.user;

      if (!sessionUser) {
        if (!cancelled) {
          setUser(readStoredUser());
          setIsReady(true);
        }
      } else {
        const profile = await fetchProfile().catch(() => null);
        if (!cancelled) {
          setUser(mapRemoteUser(sessionUser, profile));
          setIsReady(true);
        }
      }

      if (cancelled) return;

      const { data: subscription } = db.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) return;
        void fetchProfile()
          .catch(() => null)
          .then((profile) => setUser(mapRemoteUser(session.user, profile)));
      });

      unsubscribe = () => subscription.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: next }));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const db = backendConfigured ? await getSupabase() : null;

      if (db && email.toLowerCase() !== demoUser.email) {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw new Error(friendlyAuthError(error.message));

        const profile = await fetchProfile().catch(() => null);
        const next = mapRemoteUser(data.user, profile);
        // Remote sessions live in Supabase's own storage; only the demo account is mirrored here.
        setUser(next);
        return next;
      }

      await wait(520);
      if (!email.includes('@')) throw new Error('Enter a valid email address.');
      if (password.length < 6) throw new Error('Password must be at least 6 characters.');
      const existing = readStoredUser();
      const isDemo = email.toLowerCase() === demoUser.email;
      const next: User =
        existing && existing.email.toLowerCase() === email.toLowerCase()
          ? existing
          : {
              ...(isDemo ? demoUser : demoUser),
              id: isDemo ? demoUser.id : `usr_${Math.random().toString(36).slice(2, 9)}`,
              name: isDemo ? demoUser.name : nameFromEmail(email),
              email,
              company: isDemo ? demoUser.company : 'New workspace',
              plan: isDemo ? demoUser.plan : 'growth',
              createdAt: isDemo ? demoUser.createdAt : new Date().toISOString(),
            };
      persist(next);
      return next;
    },
    [persist],
  );

  const signup = useCallback(
    async ({ name, email, company, password }: SignupInput) => {
      const db = backendConfigured ? await getSupabase() : null;

      if (db) {
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim(), company: company.trim() || 'New workspace' } },
        });
        if (error) throw new Error(friendlyAuthError(error.message));
        if (!data.session || !data.user) {
          throw new Error('Check your inbox to confirm your email, then sign in.');
        }

        const profile = await fetchProfile().catch(() => null);
        const next = mapRemoteUser(data.user, profile);
        setUser(next);
        return next;
      }

      await wait(720);
      if (!email.includes('@')) throw new Error('Enter a valid email address.');
      if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
      const next: User = {
        id: `usr_${Math.random().toString(36).slice(2, 9)}`,
        name: name.trim() || nameFromEmail(email),
        email,
        company: company.trim() || 'New workspace',
        role: 'Workspace owner',
        plan: 'growth',
        createdAt: new Date().toISOString(),
      };
      persist(next);
      return next;
    },
    [persist],
  );

  const logout = useCallback(() => {
    const pending = getSupabase();
    if (pending && user && !user.id.startsWith('usr_')) {
      void pending.then((db) => db.auth.signOut()).catch(() => null);
    }
    persist(null);
  }, [persist, user]);

  const updateProfile = useCallback(
    (patch: Partial<Pick<User, 'name' | 'email' | 'company' | 'role'>>) => {
      setUser((current) => {
        if (!current) return current;
        if (backendConfigured && !current.id.startsWith('usr_')) {
          void updateRemoteProfile(patch).catch(() => null);
        }
        const next = { ...current, ...patch };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: next }));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  /**
   * Recovery is the one flow the local demo cannot fake: there is no account behind it, so the
   * link would go nowhere. Say that plainly instead of showing a "check your inbox" that lies.
   */
  const requestPasswordReset = useCallback(async (address: string) => {
    const email = address.trim();
    if (!email.includes('@')) throw new Error('Enter a valid email address.');

    const db = backendConfigured ? await getSupabase() : null;
    if (!db) {
      throw new Error(DEMO_RESET_COPY);
    }

    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
  }, []);

  const setPassword = useCallback(async (password: string) => {
    if (password.length < 8) throw new Error('Use at least 8 characters for your password.');

    const db = backendConfigured ? await getSupabase() : null;
    if (!db) {
      throw new Error(DEMO_RESET_COPY);
    }

    const { error } = await db.auth.updateUser({ password });
    if (error) throw new Error(friendlyAuthError(error.message));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      login,
      signup,
      logout,
      updateProfile,
      requestPasswordReset,
      setPassword,
    }),
    [user, isReady, login, signup, logout, updateProfile, requestPasswordReset, setPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function nameFromEmail(email: string) {
  const handle = email.split('@')[0] ?? 'there';
  return handle
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
