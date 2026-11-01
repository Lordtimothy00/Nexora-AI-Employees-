-- Audit hardening: a usage ledger the client cannot trim, and least privilege on the tables.
--
-- Applied to the project on 2026-11-01 (recorded in supabase_migrations.schema_migrations as
-- `audit_hardening_usage_ledger_and_grants`). Kept here so a fresh project can be brought to the
-- same state, and so the intent survives in the repository.

-- 1. Usage ledger -------------------------------------------------------------------------------
-- The hourly ceilings were counted from rows the workspace owns (activities, messages,
-- workspace_invites), so deleting those rows reset the budget — and the model spend with it.
create table if not exists public.usage_events (
  id bigserial primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid,
  kind text not null check (kind in ('run', 'reply', 'invite')),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_window
  on public.usage_events (workspace_id, kind, created_at desc);

alter table public.usage_events enable row level security;

-- No policies on purpose: only the service role (the edge functions) reads or writes this. A
-- client that could delete a row could delete its own ceiling.
revoke all on public.usage_events from anon, authenticated;
revoke all on sequence public.usage_events_id_seq from anon, authenticated;

-- 2. Least privilege ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- TRUNCATE is not covered by row level security, and no client needs these two privileges.
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- 3. The delivery log is evidence ---------------------------------------------------------------
drop policy if exists "members delete activities" on public.activities;
drop policy if exists "admins delete activities" on public.activities;
create policy "admins delete activities" on public.activities
  for delete using (public.is_workspace_admin(workspace_id));

-- 4. The roster moves through its functions -----------------------------------------------------
-- `set_member_role`, `remove_member`, `accept_invite` and `leave_workspace` are security definer
-- and keep their owner-only rules. Direct table writes let an admin rewrite `user_id` (adding a
-- stranger without an invite) or `role` (making themselves owner) and skip those rules.
revoke insert, update on public.workspace_members from authenticated;

-- 5. A plan is not something a profile can claim -------------------------------------------------
revoke update (plan) on public.profiles from authenticated;
revoke insert (plan) on public.profiles from anon, authenticated;

-- 6. Billing columns are set by the billing webhook, never by a browser --------------------------
create or replace function public.guard_workspace_billing()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  -- Service role (the Stripe webhook), the definer functions above, and direct admin SQL are the
  -- trusted callers. A browser request always runs as `authenticated`.
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if new.plan is not null
     or new.subscription_status is not null
     or new.stripe_customer_id is not null
     or new.stripe_subscription_id is not null
     or new.current_period_end is not null
     or new.billing_interval is not null
     or coalesce(new.cancel_at_period_end, false) then
    raise exception 'billing fields are written by the billing service'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists workspaces_billing_guard on public.workspaces;
create trigger workspaces_billing_guard
  before insert or update on public.workspaces
  for each row execute function public.guard_workspace_billing();
