-- =============================================================================
-- 0003_catalog.sql
-- Catalog of plans/products that users browse and buy.
-- Managed by ops (catalog_manager / super_admin) from the admin website.
-- =============================================================================

create table public.plans (
  id            uuid primary key default gen_random_uuid(),
  type          plan_type not null,
  name_ar       text not null,
  name_en       text not null,
  description_ar text,
  description_en text,
  -- Price stored as integer halalas (1 SAR = 100 halalas) to avoid float errors.
  price_halalas integer not null check (price_halalas >= 0),
  -- Flexible structured details: data GB, validity days, network, etc.
  specs         jsonb not null default '{}'::jsonb,
  -- Display ordering in the app (lower = shown first).
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_plans_active on public.plans (is_active, sort_order);
create index idx_plans_type on public.plans (type);

create trigger trg_plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();
