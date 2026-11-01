-- Seat limits per plan, and the columns that carry a brief check.
--
-- 1. A plan buys a number of AI employees: Launch one, Growth five, Scale unlimited. The cap is
--    enforced here because `hires` is inserted straight from the browser — a check in the UI is a
--    suggestion, and a suggestion is what an audit breaks in ten seconds.
--
--    INSERT only, deliberately. Nobody loses a seat they already hold, so a downgrade from Growth
--    to Launch leaves the extra employees in place (paused, or in place until released) instead of
--    deleting work people are relying on. The cap stops growth; it does not confiscate.
--
-- 2. A workspace with no plan yet — signed up, never checked out — has no tier to enforce, so it
--    keeps hiring freely; the hourly run ceiling is what bounds its spend. The moment a plan
--    lands, the cap applies. An unrecognised plan string fails closed at the cheapest tier rather
--    than falling through to "unlimited": a typo in a webhook must not hand out the top tier.
--
-- 3. `tasks.verification` records what run-task checked about a deliverable before it was accepted
--    as `review`. Members read it; only the service role writes it, so a browser cannot mark its
--    own work as passing.

-- ── Seat limits ────────────────────────────────────────────────────────────────────────────────

create or replace function public.plan_seat_limit(p_plan text)
returns integer
language sql
immutable
set search_path to 'public'
as $$
  select case
           -- No plan yet: signed up, never checked out. There is no tier to enforce, and the run
           -- ceiling still bounds the cost of the work. Tighten this to 1 when checkout is live.
           when p_plan is null or btrim(p_plan) = '' then null
           when lower(btrim(p_plan)) = 'scale' then null            -- unlimited
           when lower(btrim(p_plan)) = 'growth' then 5
           when lower(btrim(p_plan)) = 'launch' then 1
           -- Anything we do not recognise fails closed at the cheapest paid tier rather than
           -- falling through to unlimited: a typo in a webhook must not hand out Scale.
           else 1
         end::integer;
$$;

-- The mapping is public pricing information, but only server-side code needs to call it.
revoke all on function public.plan_seat_limit(text) from public, anon, authenticated;
grant execute on function public.plan_seat_limit(text) to service_role;

create or replace function public.enforce_seat_limit()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_limit integer;
  v_used integer;
begin
  select public.plan_seat_limit(w.plan) into v_limit
    from public.workspaces w
   where w.id = new.workspace_id;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_used
    from public.hires h
   where h.workspace_id = new.workspace_id;

  if v_used >= v_limit then
    raise exception using
      errcode = '42501',
      message = format('seat_limit_reached: this plan includes %s AI employee(s)', v_limit),
      hint = 'Release an employee, or upgrade the plan in Billing.';
  end if;

  return new;
end;
$$;

drop trigger if exists hires_seat_limit on public.hires;
create trigger hires_seat_limit
  before insert on public.hires
  for each row execute function public.enforce_seat_limit();

-- ── Brief verification ────────────────────────────────────────────────────────────────────────

alter table public.tasks
  add column if not exists verification jsonb,
  add column if not exists verification_status text,
  add column if not exists verified_at timestamp with time zone;

alter table public.tasks drop constraint if exists tasks_verification_status_check;
alter table public.tasks add constraint tasks_verification_status_check
  check (
    verification_status is null
    or verification_status in ('passes', 'needs_review', 'unverified')
  );

-- Column grants, not table grants: a browser may read the verdict and may not write it.
grant select (verification, verification_status, verified_at) on public.tasks to authenticated;

revoke update on public.tasks from authenticated;
grant update (id, user_id, employee_id, title, status, priority, due, detail, created_at, workspace_id)
  on public.tasks to authenticated;

revoke insert on public.tasks from authenticated;
grant insert (id, user_id, employee_id, title, status, priority, due, detail, created_at, workspace_id)
  on public.tasks to authenticated;

-- ── The billing payload the app reads ────────────────────────────────────────────────────────
-- Rebuilt rather than replaced: adding columns to a RETURNS TABLE definition needs a drop, and a
-- drop takes the grants with it.

drop function if exists public.workspace_billing();

create function public.workspace_billing()
returns table (
  plan text,
  status text,
  billing_interval text,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean,
  has_customer boolean,
  subscription_id text,
  trial_started_at timestamp with time zone,
  ai_locked boolean,
  seat_limit integer,
  seats_used integer
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select w.plan,
         w.subscription_status,
         w.billing_interval,
         w.current_period_end,
         coalesce(w.cancel_at_period_end, false),
         w.stripe_customer_id is not null,
         w.stripe_subscription_id,
         p.trial_started_at,
         public.workspace_ai_locked(w.id),
         public.plan_seat_limit(w.plan),
         (select count(*)::integer from public.hires h where h.workspace_id = w.id)
    from public.workspaces w
    left join public.profiles p on p.id = auth.uid()
   where w.id = public.my_workspace();
$$;

revoke all on function public.workspace_billing() from public, anon;
grant execute on function public.workspace_billing() to authenticated, service_role;
