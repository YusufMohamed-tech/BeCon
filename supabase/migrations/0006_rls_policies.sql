-- =============================================================================
-- 0006_rls_policies.sql
-- Row-Level Security: users see only their own data; admins manage everything.
-- ARCHITECTURE.md sections 9 (RBAC) & 12 (security).
-- =============================================================================

-- Enable RLS on all application tables.
alter table public.profiles       enable row level security;
alter table public.admin_users    enable row level security;
alter table public.plans          enable row level security;
alter table public.orders         enable row level security;
alter table public.payments       enable row level security;
alter table public.sim_assets     enable row level security;
alter table public.invoices       enable row level security;
alter table public.devices        enable row level security;
alter table public.notifications  enable row level security;
alter table public.order_events   enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles: owner can read"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: owner can update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- admin_users (only super_admin manages; admins can read themselves)
-- -----------------------------------------------------------------------------
create policy "admin_users: self or super_admin read"
  on public.admin_users for select
  using (id = auth.uid() or public.is_admin(array['super_admin']::admin_role[]));

create policy "admin_users: super_admin write"
  on public.admin_users for all
  using (public.is_admin(array['super_admin']::admin_role[]))
  with check (public.is_admin(array['super_admin']::admin_role[]));

-- -----------------------------------------------------------------------------
-- plans
-- Public can read ACTIVE plans (guest browsing). Catalog managers manage all.
-- -----------------------------------------------------------------------------
create policy "plans: public read active"
  on public.plans for select
  using (is_active = true or public.is_admin());

create policy "plans: catalog manager write"
  on public.plans for all
  using (public.is_admin(array['super_admin', 'catalog_manager']::admin_role[]))
  with check (public.is_admin(array['super_admin', 'catalog_manager']::admin_role[]));

-- -----------------------------------------------------------------------------
-- orders
-- Owner can read their orders and create new ones. Admins can read/manage all.
-- Status changes go through advance_order_status() (security definer), so we do
-- NOT grant broad update to users here.
-- -----------------------------------------------------------------------------
create policy "orders: owner read"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

create policy "orders: owner create"
  on public.orders for insert
  with check (user_id = auth.uid());

create policy "orders: admin update"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- payments (read-only to owner; writes happen server-side via service role)
-- -----------------------------------------------------------------------------
create policy "payments: owner read"
  on public.payments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = payments.order_id and o.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- sim_assets (owner read; admin manage)
-- -----------------------------------------------------------------------------
create policy "sim_assets: owner read"
  on public.sim_assets for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = sim_assets.order_id and o.user_id = auth.uid()
    )
  );

create policy "sim_assets: admin write"
  on public.sim_assets for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- invoices (owner read; admin/finance manage)
-- -----------------------------------------------------------------------------
create policy "invoices: owner read"
  on public.invoices for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = invoices.order_id and o.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- devices (owner manages their own push tokens)
-- -----------------------------------------------------------------------------
create policy "devices: owner all"
  on public.devices for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- notifications (owner read; admin read)
-- -----------------------------------------------------------------------------
create policy "notifications: owner read"
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- order_events (owner read own order history; admin read all)
-- -----------------------------------------------------------------------------
create policy "order_events: owner read"
  on public.order_events for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_events.order_id and o.user_id = auth.uid()
    )
  );

-- NOTE: payments/invoices/notifications inserts & updates are performed by
-- trusted server code using the service role key (Edge Functions / workers),
-- which bypasses RLS. No client-facing write policies are granted for them.
