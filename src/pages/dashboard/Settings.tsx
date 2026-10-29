import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, KeyRound, LogOut, RotateCcw, ShieldCheck, SlidersHorizontal, User } from 'lucide-react';
import { PageHeader, Panel, Toast } from '@/components/dashboard/ui';
import { Button } from '@/components/ui/Button';
import { Field, PasswordField } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { cn, initialsOf } from '@/lib/utils';

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div>
        <p className="text-[12px] font-medium text-white">{label}</p>
        <p className="mt-0.5 max-w-md text-[10.5px] leading-relaxed text-[#998173]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'border-[#dd6816]/50 bg-[#dd6816]' : 'border-white/12 bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-3.5 rounded-full bg-white transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}

export function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { hires } = useWorkspace();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [role, setRole] = useState(user?.role ?? '');
  const [toast, setToast] = useState<string | null>(null);
  const [prefs, setPrefs] = useState({
    digest: true,
    approvals: true,
    autoAssign: false,
    weeklyReport: true,
  });

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3800);
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    updateProfile({ name: name.trim(), email: email.trim(), company: company.trim(), role: role.trim() });
    showToast('Profile updated.');
  };

  const updatePassword = (event: FormEvent) => {
    event.preventDefault();
    showToast('Password updated (preview only — no credentials are stored).');
    (event.target as HTMLFormElement).reset();
  };

  const resetDemo = () => {
    try {
      localStorage.removeItem('nexora.workspace.v2');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Your profile, workspace preferences, and security controls."
      />

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <Panel title="Profile" subtitle="Shown to your team and on invoices">
            <form onSubmit={saveProfile} className="space-y-3.5">
              <div className="flex items-center gap-3">
                <Avatar name={name || 'You'} initials={initialsOf(name || 'You')} accent="violet" size="lg" status="online" />
                <div>
                  <p className="text-[12px] font-medium text-white">{name || 'Your name'}</p>
                  <p className="text-[10.5px] text-[#998173]">{email}</p>
                  <p className="mt-0.5 text-[9.5px] text-[#6f5548]">Avatar initials update automatically</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" value={name} onChange={(event) => setName(event.target.value)} icon={<User className="size-4" />} />
                <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Company" value={company} onChange={(event) => setCompany(event.target.value)} />
                <Field label="Role" value={role} onChange={(event) => setRole(event.target.value)} />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" iconLeft={<Check className="size-3.5" />}>
                  Save changes
                </Button>
              </div>
            </form>
          </Panel>

          <Panel title="Workspace preferences" subtitle="How your employees operate by default" padded={false}>
            <div className="divide-y divide-white/5 px-4 md:px-5">
              <Toggle
                checked={prefs.digest}
                onChange={(value) => setPrefs({ ...prefs, digest: value })}
                label="Morning digest"
                description="A single summary of overnight work, warm replies, and decisions at 7:00am."
              />
              <Toggle
                checked={prefs.approvals}
                onChange={(value) => setPrefs({ ...prefs, approvals: value })}
                label="Approval notifications"
                description="Ping me in Slack whenever an employee needs a decision or hits a policy gate."
              />
              <Toggle
                checked={prefs.autoAssign}
                onChange={(value) => setPrefs({ ...prefs, autoAssign: value })}
                label="Auto-assign by department"
                description="Route new tasks to the best-fit employee automatically when a brief matches their role."
              />
              <Toggle
                checked={prefs.weeklyReport}
                onChange={(value) => setPrefs({ ...prefs, weeklyReport: value })}
                label="Weekly performance report"
                description="Friday summary of tasks delivered, hours saved, and utilisation per employee."
              />
            </div>
            <div className="border-t border-white/8 px-4 py-3 md:px-5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => showToast('Preferences saved for this preview session.')}
                iconLeft={<SlidersHorizontal className="size-3.5" />}
              >
                Save preferences
              </Button>
            </div>
          </Panel>

          <Panel title="Security" subtitle="Protect your workspace">
            <form onSubmit={updatePassword} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <PasswordField label="New password" placeholder="At least 8 characters" icon={<KeyRound className="size-4" />} required />
                <PasswordField label="Confirm password" placeholder="Repeat password" required />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-[#8a7365]">Demo preview — passwords are never stored.</p>
                <Button type="submit" size="sm" variant="secondary">
                  Update password
                </Button>
              </div>
            </form>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#d9d9a0]" />
              <div>
                <p className="text-[11.5px] font-medium text-white">Two-factor authentication</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#998173]">
                  Required on Scale workspaces. Available now for your team and enforced at org level.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Workspace">
            <div className="space-y-3">
              {[
                { label: 'Workspace', value: company || '—' },
                { label: 'Plan', value: 'Growth · monthly' },
                { label: 'AI employees', value: `${hires.length} of 5` },
                { label: 'Member since', value: user ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-[11px] text-[#998173]">{row.label}</span>
                  <span className="text-[11px] font-medium text-[#e9d8ce]">{row.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Session">
            <p className="text-[11px] leading-relaxed text-[#a28c80]">
              You are signed in as <span className="text-white">{user?.email}</span>. Sessions are stored
              locally in this preview build.
            </p>
            <div className="mt-3 space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                iconLeft={<LogOut className="size-3.5" />}
              >
                Sign out
              </Button>
            </div>
          </Panel>

          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.04] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-[#f2a48d]" />
              <p className="text-[12px] font-medium text-white">Danger zone</p>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#c58f80]">
              Reset the demo workspace to its original hires, tasks, and conversations. This clears
              local data for this browser only.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full border border-rose-400/20 text-[#f2a48d] hover:bg-rose-500/10 hover:text-white"
              onClick={resetDemo}
              iconLeft={<RotateCcw className="size-3.5" />}
            >
              Reset demo workspace
            </Button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
