import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  LogOut,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { EmptyState, PageHeader, Panel, StatCard, Toast } from '@/components/dashboard/ui';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeById } from '@/data/employees';
import {
  createInvite,
  fetchInvites,
  fetchMembers,
  removeMember,
  revokeInvite,
  setMemberRole,
  type WorkspaceInvite,
  type WorkspaceMember,
} from '@/lib/backend';
import { backendConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const inviteUrl = (token: string) => `${window.location.origin}/invite/${token}`;

export function Team() {
  const {
    hires,
    togglePause,
    release,
    utilization,
    hoursSaved,
    monthlySpend,
    activeWorkspace,
    workspaces,
    leaveActiveWorkspace,
  } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [toast, setToast] = useState<string | null>(() => null);

  const remote = backendConfigured && !!user && !user.id.startsWith('usr_');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadPeople = useCallback(async () => {
    if (!remote) return;
    try {
      const [nextMembers, nextInvites] = await Promise.all([fetchMembers(), fetchInvites()]);
      setMembers(nextMembers);
      setInvites(nextInvites);
    } catch {
      /* leave the panel as it is rather than blocking the page */
    }
  }, [remote]);

  useEffect(() => {
    void loadPeople();
  }, [loadPeople]);

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard?.writeText(inviteUrl(token));
      setCopied(token);
      setTimeout(() => setCopied(null), 2200);
    } catch {
      /* clipboard can be blocked; the link is still visible in the field */
    }
  };

  const sendInvite = async (event: FormEvent) => {
    event.preventDefault();
    const address = inviteEmail.trim();
    if (!address) return;

    setInviting(true);
    try {
      const token = await createInvite(address, inviteRole);
      await copyLink(token);
      await loadPeople();
      setInviteEmail('');
      showToast(`Invite for ${address} created as ${inviteRole} — the link is on your clipboard.`);
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Could not create that invite.');
    } finally {
      setInviting(false);
    }
  };

  const removeInvite = async (id: string) => {
    try {
      await revokeInvite(id);
      await loadPeople();
    } catch {
      showToast('Could not revoke that invite.');
    }
  };

  const removePerson = async (member: WorkspaceMember) => {
    setBusyMember(member.userId);
    try {
      await removeMember(member.userId);
      setConfirmRemove(null);
      await loadPeople();
      showToast(`${member.name} no longer has access to this workspace.`);
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Could not remove that person.');
    } finally {
      setBusyMember(null);
    }
  };

  const changeRole = async (member: WorkspaceMember, role: 'admin' | 'member') => {
    setBusyMember(member.userId);
    try {
      await setMemberRole(member.userId, role);
      await loadPeople();
      showToast(`${member.name} is now ${role === 'admin' ? 'an admin' : 'a member'}.`);
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Could not change that role.');
    } finally {
      setBusyMember(null);
    }
  };

  const leave = async () => {
    setLeaving(true);
    try {
      await leaveActiveWorkspace();
      showToast('You left the workspace.');
      navigate('/dashboard');
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Could not leave the workspace.');
    } finally {
      setLeaving(false);
      setConfirmLeave(false);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const myRole = activeWorkspace?.role;
  const canManagePeople = myRole === 'owner' || myRole === 'admin';
  const active = hires.filter((hire) => hire.status === 'active').length;
  const totalTasks = hires.reduce((sum, hire) => sum + hire.tasksCompleted, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People"
        title="My team"
        description="Every AI employee in your workspace, with utilisation, output, and controls."
        actions={
          <ButtonLink to="/employees" size="sm" iconLeft={<Plus className="size-3.5" />}>
            Hire employee
          </ButtonLink>
        }
      />

      {hires.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="No employees hired yet"
          description="Your workspace is empty. Browse the roster and hire a specialist for the work that keeps slipping."
          action={
            <ButtonLink to="/employees" iconRight={<ArrowRight className="size-4" />}>
              Browse employees
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Team size" value={`${hires.length}`} hint="of 5 seats" icon={<Users className="size-4" />} />
            <StatCard label="Active now" value={`${active}`} hint="online" tone="mint" icon={<Sparkles className="size-4" />} />
            <StatCard label="Tasks delivered" value={totalTasks.toLocaleString()} hint="lifetime" tone="sky" icon={<Clock className="size-4" />} />
            <StatCard label="Avg utilisation" value={`${utilization}%`} hint="this week" tone="amber" />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {hires.map((hire) => {
              const person = getEmployeeById(hire.employeeId);
              if (!person) return null;
              const isPaused = hire.status === 'paused';
              return (
                <div
                  key={hire.employeeId}
                  className={cn(
                    'relative overflow-hidden rounded-[22px] border border-white/12 bg-[linear-gradient(160deg,rgba(186,255,228,0.04),rgba(186,255,228,0.01))] transition-colors hover:border-white/16',
                    isPaused && 'opacity-80',
                  )}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={person.name}
                        src={person.avatar}
                        initials={person.initials}
                        accent={person.accent}
                        size="lg"
                        status={isPaused ? 'paused' : 'online'}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-display text-[15px] font-semibold text-white">{person.name}</h2>
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider ring-1 ring-inset',
                              isPaused
                                ? 'bg-amber/10 text-[#e6efec] ring-amber/20'
                                : 'bg-mint/10 text-[#9df7c2] ring-mint/20',
                            )}
                          >
                            {hire.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#aabbc2]">{person.role}</p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8d9ea7]">
                          {person.department}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/employees/${person.slug}`}
                      aria-label={`View ${person.name}'s profile`}
                      className="grid size-7 place-items-center rounded-lg text-[#8d9ea7] transition hover:bg-white/8 hover:text-white"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-white/6 border-b border-white/10">
                    {[
                      { label: 'Tasks', value: hire.tasksCompleted.toLocaleString() },
                      { label: 'Hours/wk', value: `${person.hoursSavedPerWeek}` },
                      { label: 'Util.', value: `${hire.utilization}%` },
                    ].map((stat) => (
                      <div key={stat.label} className="px-3 py-2.5 text-center">
                        <p className="font-display text-[14px] font-semibold text-white">{stat.value}</p>
                        <p className="text-[9px] uppercase tracking-[0.08em] text-[#8d9ea7]">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-[10px] text-[#9aaab3]">
                      <span>Utilisation this week</span>
                      <span>{hire.utilization}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          isPaused
                            ? 'bg-amber/60'
                            : 'bg-[linear-gradient(90deg,#2fe3b0,#078a63)]',
                        )}
                        style={{ width: `${hire.utilization}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      <Link
                        to="/dashboard/conversations"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-[11px] text-[#cedbdc] transition hover:border-white/20 hover:text-white"
                      >
                        <MessageSquare className="size-3" /> Message
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          togglePause(person.id);
                          showToast(
                            isPaused
                              ? `${person.name} is back online and picking up the queue.`
                              : `${person.name} is paused. Queued work will hold until resumed.`,
                          );
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-[#cedbdc] transition hover:border-white/20 hover:text-white"
                      >
                        {isPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                    </div>

                    {confirming === person.id ? (
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-rose-400/25 bg-rose-500/[0.06] px-2.5 py-1.5">
                        <p className="text-[10px] text-rose-200">Remove {person.name}?</p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              release(person.id);
                              setConfirming(null);
                              showToast(`${person.name} removed from your workspace.`);
                            }}
                            className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100 hover:bg-rose-500/30"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            className="rounded-md px-2 py-0.5 text-[10px] text-[#b9c9cf] hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(person.id)}
                        className="mt-2 w-full text-center text-[9.5px] text-[#8d9ea7] transition hover:text-rose-300"
                      >
                        Remove from team
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <Link
              to="/employees"
              className="group flex min-h-[220px] flex-col items-center justify-center rounded-[22px] border border-dashed border-white/12 bg-white/[0.015] p-6 text-center transition-colors hover:border-[#0bd39a]/40 hover:bg-[#0bd39a]/[0.04]"
            >
              <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#2fe3b0] transition group-hover:border-[#0bd39a]/40">
                <Plus className="size-4" />
              </span>
              <p className="mt-3 text-[12.5px] font-medium text-white">Add another employee</p>
              <p className="mt-1 max-w-[180px] text-[10.5px] leading-relaxed text-[#9aaab3]">
                {5 - hires.length} seats remaining on Growth
              </p>
            </Link>
          </div>

          <Panel title="Team economics" subtitle="What this team would cost as headcount">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Human equivalent', value: `$${(hires.length * 6200).toLocaleString()}/mo`, hint: 'avg. loaded salary' },
                { label: 'Your Nexora cost', value: `$${monthlySpend}/mo`, hint: 'billed monthly' },
                {
                  label: 'Monthly saving',
                  value: `$${(hires.length * 6200 - monthlySpend).toLocaleString()}`,
                  hint: `${hoursSaved}h of work returned`,
                },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-white/12 bg-white/[0.045] backdrop-blur-xl p-3.5">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[#9aaab3]">{row.label}</p>
                  <p className="mt-1 font-display text-[17px] font-semibold text-white">{row.value}</p>
                  <p className="mt-0.5 text-[10px] text-[#8d9ea7]">{row.hint}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="People with access"
            subtitle={remote ? 'Humans who share this workspace' : 'This browser only'}
          >
            {!remote ? (
              <p className="max-w-xl text-[12.5px] leading-relaxed text-[#aabbc2]">
                The demo workspace lives in this browser, so there is nobody else to invite. Create a real
                account and this panel lists everyone who shares the workspace, with roles and invite links.
              </p>
            ) : (
              <div className="space-y-4">
                <ul className="space-y-2">
                  {members.map((member) => {
                    const isMe = member.userId === user?.id;
                    const isOwnerRow = member.role === 'owner';
                    const canChangeRole = myRole === 'owner' && !isMe && !isOwnerRow;
                    const canRemove = canManagePeople && !isMe && !isOwnerRow;
                    const busy = busyMember === member.userId;

                    return (
                      <li
                        key={member.userId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0bd39a]/12 text-[11px] font-semibold text-[#9df7c2]">
                            {initials(member.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-medium text-white">
                              {member.name}
                              {isMe && <span className="ml-1.5 text-[10px] text-[#8d9ea7]">you</span>}
                            </p>
                            <p className="truncate text-[10.5px] text-[#8d9ea7]">
                              {member.company || 'Workspace member'}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {canChangeRole ? (
                            <select
                              value={member.role}
                              disabled={busy}
                              aria-label={`Role for ${member.name}`}
                              onChange={(event) =>
                                void changeRole(member, event.target.value as 'admin' | 'member')
                              }
                              className="rounded-lg border border-white/12 bg-[#0a1e21] px-1.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#b2c2c8] focus:border-[#0bd39a]/50 focus:outline-none disabled:opacity-50"
                            >
                              <option value="member">member</option>
                              <option value="admin">admin</option>
                            </select>
                          ) : (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#b2c2c8]">
                              {member.role}
                            </span>
                          )}

                          {canRemove &&
                            (confirmRemove === member.userId ? (
                              <span className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void removePerson(member)}
                                  className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100 transition hover:bg-rose-500/30 disabled:opacity-50"
                                >
                                  {busy ? 'Removing…' : 'Remove'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRemove(null)}
                                  className="rounded-md px-1.5 py-0.5 text-[10px] text-[#b9c9cf] transition hover:text-white"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                aria-label={`Remove ${member.name}`}
                                onClick={() => setConfirmRemove(member.userId)}
                                className="grid size-6 place-items-center rounded-lg text-[#8d9ea7] transition hover:bg-white/10 hover:text-white"
                              >
                                <X className="size-3" />
                              </button>
                            ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                  {members.length <= 1 ? (
                    <p className="text-[10.5px] leading-relaxed text-[#8d9ea7]">
                      You are the only member of this workspace. To get rid of it, delete it from
                      Settings → Danger zone instead of leaving it.
                    </p>
                  ) : confirmLeave ? (
                    <div>
                      <p className="text-[11px] leading-relaxed text-[#d8e4e4]">
                        Leave <span className="text-white">{activeWorkspace?.name}</span>? You lose access to
                        its AI employees, tasks and conversations.
                        {myRole === 'owner' &&
                          ' You own this workspace, so ownership passes to the oldest admin, or the oldest member.'}
                        {workspaces.length <= 1 &&
                          ' You have no other workspace, so a fresh empty one is created for you.'}
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          type="button"
                          disabled={leaving}
                          onClick={() => void leave()}
                          className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-rose-500/25 disabled:opacity-50"
                        >
                          {leaving ? 'Leaving…' : 'Leave workspace'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmLeave(false)}
                          className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] text-[#b9c9cf] transition hover:text-white"
                        >
                          Stay
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10.5px] leading-relaxed text-[#8d9ea7]">
                        You were invited to this workspace and can leave whenever you like.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-[#a7b7be] hover:text-white"
                        onClick={() => setConfirmLeave(true)}
                        iconLeft={<LogOut className="size-3.5" />}
                      >
                        Leave
                      </Button>
                    </div>
                  )}
                </div>

                {invites.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#9aaab3]">
                      Pending invites
                    </p>
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-white/12 bg-white/[0.015] px-3 py-2"
                      >
                        <p className="min-w-0 truncate text-[12px] text-[#cfdcde]">{invite.email}</p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyLink(invite.token)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-[#cfdcde] transition hover:border-[#0bd39a]/40 hover:text-white"
                          >
                            {copied === invite.token ? 'Copied' : 'Copy link'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeInvite(invite.id)}
                            aria-label={`Revoke invite for ${invite.email}`}
                            className="grid size-6 place-items-center rounded-lg text-[#8d9ea7] transition hover:bg-white/10 hover:text-white"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {canManagePeople ? (
                  <form onSubmit={sendInvite} className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="teammate@company.com"
                      aria-label="Teammate email address"
                      className="h-9 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[12.5px] text-white placeholder:text-[#7d8f96] focus:border-[#0bd39a]/50 focus:outline-none"
                    />
                    <select
                      value={inviteRole}
                      onChange={(event) => setInviteRole(event.target.value as 'member' | 'admin')}
                      aria-label="Invite role"
                      className="h-9 rounded-xl border border-white/10 bg-[#0a1e21] px-2 text-[11px] text-[#cfdcde] focus:border-[#0bd39a]/50 focus:outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button type="submit" size="sm" loading={inviting} iconLeft={<UserPlus className="size-3.5" />}>
                      Create invite
                    </Button>
                  </form>
                ) : (
                  <p className="text-[10.5px] leading-relaxed text-[#8d9ea7]">
                    Only owners and admins can invite people or change the roster.
                  </p>
                )}

                <p className="text-[10.5px] leading-relaxed text-[#8d9ea7]">
                  Invites are links you copy and send yourself — no email is sent. The person must sign in
                  with that exact address to join.
                </p>
              </div>
            )}
          </Panel>
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
