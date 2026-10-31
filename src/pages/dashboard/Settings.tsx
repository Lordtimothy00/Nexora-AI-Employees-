import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, KeyRound, LogOut, RotateCcw, ShieldCheck, SlidersHorizontal, Trash2, User } from 'lucide-react';
import { PageHeader, Panel, Toast } from '@/components/dashboard/ui';
import { Button } from '@/components/ui/Button';
import { Field, PasswordField } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { normalisePrefs, prefsEqual, type NotificationPrefs } from '@/lib/prefs';
import { backendConfigured } from '@/lib/supabase';
import { cn, initialsOf } from '@/lib/utils';

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

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
        <p className="mt-0.5 max-w-md text-[10.5px] leading-relaxed text-[#9aaab3]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'border-[#0bd39a]/50 bg-[#0bd39a]' : 'border-white/12 bg-white/10',
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
  const { user, updateProfile, logout, setPassword } = useAuth();
  const {
    hires,
    tasks,
    messages,
    workspaces,
    activeWorkspace,
    switching,
    renameActiveWorkspace,
    deleteActiveWorkspace,
  } = useWorkspace();
  const navigate = useNavigate();
  // Local demo accounts have no workspaces table behind them, so the rename and delete controls
  // stay hidden rather than pretending to work.
  const remote = backendConfigured && !!user && !user.id.startsWith('usr_');
  const workspaceName = activeWorkspace?.name ?? user?.company ?? 'Workspace';
  const memberCount = activeWorkspace?.members ?? 1;
  const teammates = Math.max(memberCount - 1, 0);
  const [wsName, setWsName] = useState(workspaceName);
  const [savingName, setSavingName] = useState(false);
  const [nameDirty, setNameDirty] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [role, setRole] = useState(user?.role ?? '');
  const [toast, setToast] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  // Preferences live on the profile now, so the saved value is the source of truth and the panel
  // is only "dirty" when it differs from it.
  const storedPrefs = useMemo(() => normalisePrefs(user?.prefs), [user?.prefs]);
  const [prefs, setPrefs] = useState<NotificationPrefs>(storedPrefs);
  const prefDirty = !prefsEqual(prefs, storedPrefs);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3800);
  };

  // The active workspace arrives after the first render; follow it until the field is edited.
  useEffect(() => {
    if (!nameDirty) setWsName(workspaceName);
  }, [workspaceName, nameDirty]);

  // Same as the workspace name: follow the profile until the person edits something.
  useEffect(() => {
    if (!prefDirty) setPrefs(storedPrefs);
  }, [storedPrefs, prefDirty]);

  const savePrefs = () => {
    setSavingPrefs(true);
    try {
      const next = normalisePrefs(prefs);
      updateProfile({ prefs: next });
      setPrefs(next);
      showToast('Preferences saved to your profile.');
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Could not save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    updateProfile({ name: name.trim(), email: email.trim(), company: company.trim(), role: role.trim() });
    showToast('Profile updated.');
  };

  // A real password change goes through Supabase auth, so the demo workspace (no account behind
  // it) keeps the form disabled rather than accepting a value it would silently drop.
  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 8) {
      setPasswordError('Use at least 8 characters for your password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Both passwords must match.');
      return;
    }

    setSavingPassword(true);
    try {
      await setPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      showToast('Password updated.');
    } catch (caught) {
      setPasswordError(caught instanceof Error ? caught.message : 'Could not update the password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const saveWorkspaceName = (event: FormEvent) => {
    event.preventDefault();
    const next = wsName.trim();
    if (!next) {
      setRenameError('Give the workspace a name.');
      return;
    }
    setRenameError(null);
    setSavingName(true);
    void renameActiveWorkspace(next)
      .then(() => {
        setWsName(next);
        setNameDirty(false);
        showToast(`Workspace renamed to “${next}”.`);
      })
      .catch((error: Error) => setRenameError(error.message))
      .finally(() => setSavingName(false));
  };

  const deleteWorkspace = () => {
    setDeleteError(null);
    setDeleting(true);
    void deleteActiveWorkspace()
      .then(() => {
        setConfirming(false);
        setConfirmName('');
        showToast('Workspace deleted. You are now in another of your workspaces.');
      })
      .catch((error: Error) => setDeleteError(error.message))
      .finally(() => setDeleting(false));
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
                  <p className="text-[10.5px] text-[#9aaab3]">{email}</p>
                  <p className="mt-0.5 text-[9.5px] text-[#8d9ea7]">Avatar initials update automatically</p>
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
            <div className="flex flex-col gap-2 border-t border-white/12 px-4 py-3 md:px-5">
              <Button
                size="sm"
                variant="secondary"
                onClick={savePrefs}
                loading={savingPrefs}
                disabled={!prefDirty}
                iconLeft={<SlidersHorizontal className="size-3.5" />}
              >
                {prefDirty ? 'Save preferences' : 'Saved'}
              </Button>
              <p className="text-[10px] leading-relaxed text-[#8d9ea7]">
                Stored on your profile. Digest emails and Slack pings begin once those integrations
                are connected — nothing is delivered yet.
              </p>
            </div>
          </Panel>

          <Panel title="Security" subtitle="Protect your workspace">
            <form onSubmit={updatePassword} className="space-y-3" noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <PasswordField
                  label="New password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  icon={<KeyRound className="size-4" />}
                  value={newPassword}
                  disabled={!remote}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setPasswordError(null);
                    setPasswordSaved(false);
                  }}
                  required
                />
                <PasswordField
                  label="Confirm password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  disabled={!remote}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setPasswordError(null);
                    setPasswordSaved(false);
                  }}
                  required
                />
              </div>

              {passwordError && (
                <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-[#e8a1a1]">
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                  {passwordError}
                </p>
              )}
              {passwordSaved && (
                <p className="flex items-center gap-1.5 text-[10.5px] text-[#9df7c2]">
                  <Check className="size-3" /> Password updated — use it the next time you sign in.
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] text-[#8d9ea7]">
                  {remote
                    ? 'Takes effect immediately. Other devices keep their session until it refreshes.'
                    : 'The local demo has no account, so there is no password to change.'}
                </p>
                <Button type="submit" size="sm" variant="secondary" disabled={!remote} loading={savingPassword}>
                  Update password
                </Button>
              </div>
            </form>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/12 bg-white/[0.045] backdrop-blur-xl p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#9df7c2]" />
              <div>
                <p className="text-[11.5px] font-medium text-white">Two-factor authentication</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#9aaab3]">
                  Required on Scale workspaces. Enrolment is not switched on in this build yet — the
                  password above and your Supabase account are what protect this workspace today.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Workspace" subtitle={remote ? 'Rename the one you are in' : 'Local demo workspace'}>
            <div className="space-y-3">
              {remote && (
                <div>
                  <form onSubmit={saveWorkspaceName} className="flex items-start gap-2">
                    <label className="sr-only" htmlFor="workspace-name">
                      Workspace name
                    </label>
                    <input
                      id="workspace-name"
                      value={wsName}
                      maxLength={60}
                      disabled={!activeWorkspace}
                      onChange={(event) => {
                        setWsName(event.target.value);
                        setNameDirty(true);
                        setRenameError(null);
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-2 text-[12px] text-white placeholder:text-[#7d909a] focus:border-[#0bd39a]/50 focus:outline-none disabled:opacity-60"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!activeWorkspace || switching || savingName || !nameDirty || !wsName.trim()}
                    >
                      {savingName ? 'Saving…' : 'Rename'}
                    </Button>
                  </form>
                  {renameError && <p className="mt-1.5 text-[10px] text-[#e8a1a1]">{renameError}</p>}
                  <p className="mt-1.5 text-[10px] text-[#8d9ea7]">
                    Shown in the sidebar and to everyone you invite. Owners and admins can change it.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {[
                  { label: 'Your role', value: activeWorkspace ? activeWorkspace.role : '—' },
                  { label: 'Members', value: remote ? `${memberCount}` : '1' },
                  { label: 'AI employees', value: `${hires.length}` },
                  { label: 'Member since', value: user ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-white/5 pb-2.5 capitalize last:border-0 last:pb-0">
                    <span className="text-[11px] text-[#9aaab3]">{row.label}</span>
                    <span className="text-[11px] font-medium text-[#d8e4e4]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Session">
            <p className="text-[11px] leading-relaxed text-[#aabbc2]">
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

          <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/[0.04] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-[#deeaea]" />
              <p className="text-[12px] font-medium text-white">Danger zone</p>
            </div>

            {remote ? (
              <>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#b9c9cf]">
                  Deleting <span className="text-white">{workspaceName}</span> permanently removes{' '}
                  {count(hires.length, 'hired employee')}, {count(tasks.length, 'task')},{' '}
                  {count(messages.length, 'message')} and the activity history
                  {teammates > 0
                    ? `, and takes access away from ${count(teammates, 'teammate')}`
                    : ''}
                  . AI employees cannot be restored afterwards.
                </p>

                {workspaces.length <= 1 ? (
                  <p className="mt-2 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-2 text-[10px] leading-relaxed text-[#b9c9cf]">
                    This is your only workspace. Create another one from the workspace menu first.
                  </p>
                ) : activeWorkspace && activeWorkspace.role !== 'owner' ? (
                  <p className="mt-2 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-2 text-[10px] leading-relaxed text-[#b9c9cf]">
                    Only the workspace owner can delete it.
                  </p>
                ) : confirming ? (
                  <div className="mt-2.5">
                    <label
                      htmlFor="confirm-workspace-name"
                      className="block text-[10px] leading-relaxed text-[#d8e4e8]"
                    >
                      Type <span className="font-medium text-white">{workspaceName}</span> to confirm.
                    </label>
                    <input
                      id="confirm-workspace-name"
                      value={confirmName}
                      autoFocus
                      onChange={(event) => {
                        setConfirmName(event.target.value);
                        setDeleteError(null);
                      }}
                      className="mt-1.5 w-full rounded-lg border border-rose-400/25 bg-white/[0.04] px-2.5 py-2 text-[11.5px] text-white focus:border-rose-400/60 focus:outline-none"
                    />
                    {deleteError && <p className="mt-1.5 text-[10px] text-[#e8a1a1]">{deleteError}</p>}
                    <div className="mt-1.5 flex gap-1.5">
                      <button
                        type="button"
                        disabled={deleting || confirmName.trim() !== workspaceName}
                        onClick={deleteWorkspace}
                        className="flex-1 rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deleting ? 'Deleting…' : 'Delete permanently'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirming(false);
                          setConfirmName('');
                          setDeleteError(null);
                        }}
                        className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] text-[#b9c9cf] transition hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full border border-rose-400/20 text-[#deeaea] hover:bg-rose-500/10 hover:text-white"
                    onClick={() => {
                      setConfirming(true);
                      setConfirmName('');
                    }}
                    iconLeft={<Trash2 className="size-3.5" />}
                  >
                    Delete workspace
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#b9c9cf]">
                  Reset the demo workspace to its original hires, tasks, and conversations. This clears
                  local data for this browser only.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full border border-rose-400/20 text-[#deeaea] hover:bg-rose-500/10 hover:text-white"
                  onClick={resetDemo}
                  iconLeft={<RotateCcw className="size-3.5" />}
                >
                  Reset demo workspace
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
