-- =============================================================================
-- 0004_orders_payments.sql
-- Orders, payments, provisioned SIM assets, invoices, notifications, devices.
-- This is the heart of the system (ARCHITECTURE.md sections 6 & 7).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete restrict,
  plan_id        uuid not null references public.plans (id) on delete restrict,
  status         order_status not null default 'created',
  -- Snapshot of plan type at purchase time (plans may change later).
  sim_type       plan_type not null,
  -- Snapshot of the price actually charged (plan price may change later).
  amount_halalas integer not null check (amount_halalas >= 0),
  -- SLA deadline: set to paid_at + 24h when payment succeeds.
  sla_due_at     timestamptz,
  paid_at        timestamptz,
  completed_at   timestamptz,
  -- Delivery details for physical SIM (address, contact), free-form.
  delivery       jsonb not null default '{}'::jsonb,
  -- For eSIM: the MSISDN/number or recharge target, if provided.
  target_msisdn  text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_orders_user on public.orders (user_id);
create index idx_orders_status on public.orders (status);
create index idx_orders_sla on public.orders (sla_due_at)
  where status in ('paid', 'processing', 'awaiting_user_action');
create index idx_orders_created on public.orders (created_at desc);

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- payments
-- Webhook from Moyasar is the source of truth; idempotency_key prevents
-- duplicate processing (ARCHITECTURE.md section 8 — anti-Tygo safeguards).
-- -----------------------------------------------------------------------------
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  status          payment_status not null default 'pending',
  method          payment_method,
  amount_halalas  integer not null check (amount_halalas >= 0),
  -- Moyasar payment id / reference.
  moyasar_ref     text,
  -- Idempotency key to make webhook/processing safe under retries.
  idempotency_key text not null,
  -- Raw provider payload for auditing/reconciliation.
  provider_payload jsonb,
  failure_reason  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint uq_payments_idempotency unique (idempotency_key)
);

create unique index uq_payments_moyasar_ref on public.payments (moyasar_ref)
  where moyasar_ref is not null;
create index idx_payments_order on public.payments (order_id);
create index idx_payments_status on public.payments (status);

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- sim_assets: provisioned SIM/eSIM result (filled by ops / external system).
-- -----------------------------------------------------------------------------
create table public.sim_assets (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  iccid             text,
  msisdn            text,
  esim_qr_url       text,
  esim_activation_code text,
  activation_status activation_status not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_sim_assets_order on public.sim_assets (order_id);

create trigger trg_sim_assets_updated_at
  before update on public.sim_assets
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- invoices: ZATCA-compliant e-invoice reference per paid order.
-- -----------------------------------------------------------------------------
create table public.invoices (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  zatca_uuid    text,
  qr            text,
  -- 15% VAT amount, stored as halalas.
  vat_halalas   integer not null default 0 check (vat_halalas >= 0),
  total_halalas integer not null check (total_halalas >= 0),
  pdf_url       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_invoices_order on public.invoices (order_id);

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- devices: push tokens (FCM/APNs) per user.
-- -----------------------------------------------------------------------------
create table public.devices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  fcm_token   text not null,
  platform    device_platform not null,
  last_seen   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  constraint uq_devices_token unique (fcm_token)
);

create index idx_devices_user on public.devices (user_id);

-- -----------------------------------------------------------------------------
-- notifications: log of every notification sent to a user.
-- -----------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  order_id    uuid references public.orders (id) on delete set null,
  channel     notification_channel not null default 'push',
  template    text not null,
  title       text,
  body        text,
  status      notification_status not null default 'pending',
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id);
create index idx_notifications_order on public.notifications (order_id);
