-- =============================================================================
-- 0010_analytics.sql
-- Read-only analytics helpers for the admin dashboard. These aggregate in the
-- database so the dashboard stays fast and can run against a read replica.
-- All are SECURITY DEFINER but gated by public.is_admin().
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Headline KPIs.
-- -----------------------------------------------------------------------------
create or replace function public.analytics_summary()
returns table (
  total_orders        bigint,
  paid_orders         bigint,
  completed_orders    bigint,
  revenue_halalas     bigint,
  conversion_rate     numeric,   -- paid / total
  completion_rate     numeric,   -- completed / paid
  sla_breaches        bigint,
  orders_last_24h     bigint
)
language sql
stable
security definer set search_path = public
as $$
  select
    count(*) as total_orders,
    count(*) filter (where status not in ('created','awaiting_payment','payment_failed','cancelled')) as paid_orders,
    count(*) filter (where status = 'completed') as completed_orders,
    coalesce(sum(amount_halalas) filter (where status not in ('created','awaiting_payment','payment_failed','cancelled')), 0) as revenue_halalas,
    round(
      count(*) filter (where status not in ('created','awaiting_payment','payment_failed','cancelled'))::numeric
      / nullif(count(*), 0) * 100, 1
    ) as conversion_rate,
    round(
      count(*) filter (where status = 'completed')::numeric
      / nullif(count(*) filter (where status not in ('created','awaiting_payment','payment_failed','cancelled')), 0) * 100, 1
    ) as completion_rate,
    count(*) filter (where sla_breached_at is not null) as sla_breaches,
    count(*) filter (where created_at > now() - interval '24 hours') as orders_last_24h
  from public.orders
  where public.is_admin();
$$;

-- -----------------------------------------------------------------------------
-- Daily revenue + order counts for the last N days (default 14).
-- -----------------------------------------------------------------------------
create or replace function public.analytics_daily(days integer default 14)
returns table (
  day             date,
  orders          bigint,
  revenue_halalas bigint
)
language sql
stable
security definer set search_path = public
as $$
  select
    date_trunc('day', created_at)::date as day,
    count(*) as orders,
    coalesce(sum(amount_halalas) filter (
      where status not in ('created','awaiting_payment','payment_failed','cancelled')
    ), 0) as revenue_halalas
  from public.orders
  where public.is_admin()
    and created_at > now() - (days || ' days')::interval
  group by 1
  order by 1;
$$;

-- -----------------------------------------------------------------------------
-- Top plans by paid order count.
-- -----------------------------------------------------------------------------
create or replace function public.analytics_top_plans(limit_count integer default 5)
returns table (
  plan_id         uuid,
  name_en         text,
  type            plan_type,
  orders          bigint,
  revenue_halalas bigint
)
language sql
stable
security definer set search_path = public
as $$
  select
    p.id as plan_id,
    p.name_en,
    p.type,
    count(o.id) as orders,
    coalesce(sum(o.amount_halalas), 0) as revenue_halalas
  from public.plans p
  join public.orders o on o.plan_id = p.id
    and o.status not in ('created','awaiting_payment','payment_failed','cancelled')
  where public.is_admin()
  group by p.id, p.name_en, p.type
  order by orders desc
  limit limit_count;
$$;
