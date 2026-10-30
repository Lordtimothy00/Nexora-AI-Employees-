import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
}

const STORAGE_KEY = 'nexora.auth.v1';
const AuthContext = createContext<AuthContextValue | null>(null);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(readStoredUser());
    setIsReady(true);
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

  const logout = useCallback(() => persist(null), [persist]);

  const updateProfile = useCallback(
    (patch: Partial<Pick<User, 'name' | 'email' | 'company' | 'role'>>) => {
      setUser((current) => {
        if (!current) return current;
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

  const value = useMemo(
    () => ({ user, isReady, login, signup, logout, updateProfile }),
    [user, isReady, login, signup, logout, updateProfile],
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
