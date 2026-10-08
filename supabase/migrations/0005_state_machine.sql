-- =============================================================================
-- 0005_state_machine.sql
-- Order state machine: audit log + enforced valid transitions.
-- Implements ARCHITECTURE.md section 6.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- order_events: immutable audit trail of every status transition.
-- -----------------------------------------------------------------------------
create table public.order_events (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  from_status  order_status,
  to_status    order_status not null,
  -- Who triggered it: an auth user id (admin or system). Null = system/automation.
  actor        uuid,
  note         text,
  created_at   timestamptz not null default now()
);

create index idx_order_events_order on public.order_events (order_id, created_at);

-- -----------------------------------------------------------------------------
-- Allowed transitions table. A transition is valid only if present here.
-- -----------------------------------------------------------------------------
create table public.order_transitions (
  from_status order_status not null,
  to_status   order_status not null,
  primary key (from_status, to_status)
);

insert into public.order_transitions (from_status, to_status) values
  ('created',              'awaiting_payment'),
  ('created',              'cancelled'),
  ('awaiting_payment',     'paid'),
  ('awaiting_payment',     'payment_failed'),
  ('awaiting_payment',     'cancelled'),
  ('payment_failed',       'awaiting_payment'),  -- retry payment
  ('paid',                 'processing'),
  ('paid',                 'refunding'),
  ('paid',                 'awaiting_user_action'),
  ('paid',                 'cancelled'),
  ('processing',           'completed'),
  ('processing',           'awaiting_user_action'),
  ('processing',           'refunding'),
  ('awaiting_user_action', 'processing'),
  ('awaiting_user_action', 'refunding'),
  ('awaiting_user_action', 'cancelled'),
  ('refunding',            'refunded');

-- -----------------------------------------------------------------------------
-- Trigger: validate status changes and timestamp side effects.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_order_transition()
returns trigger
language plpgsql
as $$
begin
  -- Only act when status actually changes.
  if new.status is distinct from old.status then
    -- Reject transitions that are not in the allowed set.
    if not exists (
      select 1 from public.order_transitions t
      where t.from_status = old.status
        and t.to_status = new.status
    ) then
      raise exception 'Invalid order transition: % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;

    -- Maintain lifecycle timestamps.
    if new.status = 'paid' then
      new.paid_at := coalesce(new.paid_at, now());
      new.sla_due_at := coalesce(new.sla_due_at, now() + interval '24 hours');
    elsif new.status = 'completed' then
      new.completed_at := coalesce(new.completed_at, now());
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_orders_enforce_transition
  before update of status on public.orders
  for each row execute function public.enforce_order_transition();

-- -----------------------------------------------------------------------------
-- Trigger: write an audit row to order_events after every status change.
-- -----------------------------------------------------------------------------
create or replace function public.log_order_event()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.order_events (order_id, from_status, to_status, actor)
    values (new.id, null, new.status, auth.uid());
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.order_events (order_id, from_status, to_status, actor)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_orders_log_event
  after insert or update of status on public.orders
  for each row execute function public.log_order_event();

-- -----------------------------------------------------------------------------
-- Convenience RPC: advance an order's status with an optional note.
-- Used by the admin website (e.g. "Mark complete"). Security checks live in
-- RLS + this function verifies admin rights for protected transitions.
-- -----------------------------------------------------------------------------
create or replace function public.advance_order_status(
  p_order_id uuid,
  p_to_status order_status,
  p_note text default null
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_order public.orders;
begin
  -- Only admins may advance orders through ops/fulfillment states.
  if not public.is_admin() then
    raise exception 'Not authorized to change order status'
      using errcode = 'insufficient_privilege';
  end if;

  update public.orders
     set status = p_to_status,
         notes  = coalesce(p_note, notes)
   where id = p_order_id
   returning * into v_order;

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  -- Attach the note to the just-written audit event, if provided.
  if p_note is not null then
    update public.order_events
       set note = p_note
     where id = (
       select id from public.order_events
        where order_id = p_order_id
        order by created_at desc
        limit 1
     );
  end if;

  return v_order;
end;
$$;
