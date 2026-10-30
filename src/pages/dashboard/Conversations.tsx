import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, MessageSquare, Send, Sparkles, Users } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/dashboard/ui';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { useWorkspace, replyFor } from '@/context/WorkspaceContext';
import { getEmployeeById } from '@/data/employees';
import { cn } from '@/lib/utils';

const suggestions = [
  'Send me a status update',
  'What needs my approval?',
  "What's next in the queue?",
];

export function Conversations() {
  const { hires, messages, appendMessage } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(hires[0]?.employeeId ?? null);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!selectedId && hires[0]) setSelectedId(hires[0].employeeId);
    if (selectedId && !hires.some((hire) => hire.employeeId === selectedId)) {
      setSelectedId(hires[0]?.employeeId ?? null);
    }
  }, [hires, selectedId]);

  const person = selectedId ? getEmployeeById(selectedId) : null;

  const thread = useMemo(
    () => messages.filter((message) => message.employeeId === selectedId),
    [messages, selectedId],
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [thread.length, typing]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const send = (text: string) => {
    const content = text.trim();
    if (!content || !selectedId) return;
    appendMessage(selectedId, content);
    setDraft('');
    setTyping(true);
    const delay = 1100 + Math.random() * 900;
    const timer = window.setTimeout(() => {
      appendMessage(selectedId, replyFor(selectedId, content), 'employee');
      setTyping(false);
    }, delay);
    timers.current.push(timer);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Team chat"
        title="Conversations"
        description="Message your employees like colleagues. They reply with decisions, drafts, and finished work."
        actions={
          <ButtonLink to="/dashboard/tasks" variant="secondary" size="sm">
            Open task board
          </ButtonLink>
        }
      />

      {hires.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="No conversations yet"
          description="Hire an employee and your shared channel appears here automatically."
          action={<ButtonLink to="/employees">Browse employees</ButtonLink>}
        />
      ) : (
        <div className="grid h-[calc(100vh-240px)] min-h-[520px] overflow-hidden rounded-2xl border border-white/8 bg-[#0b0c0d] lg:grid-cols-[280px_1fr]">
          {/* list */}
          <aside className={cn('flex-col border-r border-white/8', mobileChat ? 'hidden lg:flex' : 'flex')}>
            <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-3">
              <p className="text-[12px] font-medium text-white">Team</p>
              <span className="font-mono text-[9px] text-[#7c7d79]">{hires.length} channels</span>
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto">
              {hires.map((hire) => {
                const employee = getEmployeeById(hire.employeeId);
                if (!employee) return null;
                const last = [...messages].reverse().find((message) => message.employeeId === hire.employeeId);
                const active = selectedId === hire.employeeId;
                return (
                  <button
                    key={hire.employeeId}
                    type="button"
                    onClick={() => {
                      setSelectedId(hire.employeeId);
                      setMobileChat(true);
                      setTyping(false);
                    }}
                    className={cn(
                      'flex w-full items-start gap-2.5 border-b border-white/5 px-3.5 py-3 text-left transition',
                      active ? 'bg-white/[0.055]' : 'hover:bg-white/[0.03]',
                    )}
                  >
                    <Avatar
                      name={employee.name}
                      src={employee.avatar}
                      initials={employee.initials}
                      accent={employee.accent}
                      size="sm"
                      status={hire.status === 'active' ? 'online' : 'paused'}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12px] font-medium text-white">{employee.name}</p>
                        {last && (
                          <span className="shrink-0 font-mono text-[8.5px] text-[#5e5f5c]">
                            {formatTime(last.at)}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[9.5px] text-[#7c7d79]">{employee.role}</p>
                      <p className="mt-1 truncate text-[10px] text-[#9d9e9a]">
                        {last ? last.text : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-white/8 p-3">
              <Link
                to="/employees"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/12 py-2 text-[10.5px] text-[#a0a19d] transition hover:border-[#c8f060]/40 hover:text-white"
              >
                <Sparkles className="size-3" /> Hire another employee
              </Link>
            </div>
          </aside>

          {/* chat */}
          <section className={cn('flex min-w-0 flex-col', mobileChat ? 'flex' : 'hidden lg:flex')}>
            {person ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMobileChat(false)}
                      aria-label="Back to team list"
                      className="grid size-7 place-items-center rounded-lg text-[#9d9e9a] hover:bg-white/8 hover:text-white lg:hidden"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <Avatar
                      name={person.name}
                      src={person.avatar}
                      initials={person.initials}
                      accent={person.accent}
                      size="sm"
                      status="online"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-white">
                        {person.name}
                        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#7c7d79]">
                          AI employee
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-[10px] text-[#8e8f8b]">
                        <span className="size-1.5 rounded-full bg-mint" />
                        Active · replies {person.responseTime.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/employees/${person.slug}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/8 px-2.5 py-1.5 text-[10.5px] text-[#b2b3af] transition hover:border-white/20 hover:text-white"
                  >
                    Profile <ArrowUpRight className="size-3" />
                  </Link>
                </div>

                <div ref={scrollRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto bg-[#0d0e0f] px-4 py-4">
                  <div className="mx-auto mb-4 flex max-w-sm flex-col items-center rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 text-center">
                    <Avatar
                      name={person.name}
                      src={person.avatar}
                      initials={person.initials}
                      accent={person.accent}
                      size="md"
                      className="mb-2"
                    />
                    <p className="text-[11.5px] font-medium text-white">
                      This is the start of your channel with {person.name}.
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-[#8e8f8b]">
                      {person.name} has access to {person.tools.slice(0, 3).join(', ')} and follows your
                      approval policy.
                    </p>
                  </div>

                  {thread.length === 0 && (
                    <p className="text-center text-[10.5px] text-[#5e5f5c]">
                      Send a brief to get started. Try one of the prompts below.
                    </p>
                  )}

                  {thread.map((message) => {
                    const mine = message.from === 'human';
                    return (
                      <div key={message.id} className={cn('flex gap-2', mine ? 'justify-end' : 'justify-start')}>
                        {!mine && (
                          <Avatar
                            name={person.name}
                            src={person.avatar}
                            initials={person.initials}
                            accent={person.accent}
                            size="xs"
                            className="mt-auto"
                          />
                        )}
                        <div
                          className={cn(
                            'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed',
                            mine
                              ? 'rounded-br-md bg-[#c8f060]/20 text-[#e7e8e4]'
                              : 'rounded-bl-md border border-white/8 bg-white/[0.04] text-[#d2d3cf]',
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.text}</p>
                          <p
                            className={cn(
                              'mt-1 font-mono text-[8px]',
                              mine ? 'text-[#d6d7d3]' : 'text-[#7c7d79]',
                            )}
                          >
                            {formatTime(message.at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {typing && (
                    <div className="flex items-end gap-2">
                      <Avatar
                        name={person.name}
                        src={person.avatar}
                        initials={person.initials}
                        accent={person.accent}
                        size="xs"
                      />
                      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.04] px-3 py-2.5">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className="size-1.5 animate-bounce rounded-full bg-[#d7f68c]"
                            style={{ animationDelay: `${dot * 130}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/8 bg-[#0b0c0d] p-3">
                  {thread.length < 4 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => send(suggestion)}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-[#b2b3af] transition hover:border-white/20 hover:text-white"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 focus-within:border-[#c8f060]/50">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          send(draft);
                        }
                      }}
                      rows={1}
                      placeholder={`Message ${person.name}…`}
                      aria-label={`Message ${person.name}`}
                      className="scroll-thin max-h-24 min-h-[34px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[12px] text-white placeholder:text-[#7c7d79] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => send(draft)}
                      disabled={!draft.trim()}
                      aria-label="Send message"
                      className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#c8f060] text-[#0a0b0c] transition hover:brightness-110 disabled:opacity-40"
                    >
                      <Send className="size-3.5" />
                    </button>
                  </div>
                  <p className="mt-1.5 px-1 text-[9px] text-[#5e5f5c]">
                    Enter to send · Shift + Enter for a new line · All actions logged
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="size-6 text-[#5e5f5c]" />
                <p className="mt-3 text-[12px] text-[#8e8f8b]">Select a teammate to start a conversation.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
