-- =============================================================================
-- 0002_profiles_and_admins.sql
-- User profiles (1:1 with auth.users) and admin/ops accounts with roles.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: public application data for each authenticated user.
-- auth.users holds the credentials; profiles holds app-facing fields.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  -- Nafath/KYC reference + status (raw ID documents are never stored here).
  nafath_ref  text,
  kyc_status  text not null default 'none' check (kyc_status in ('none', 'pending', 'verified', 'rejected')),
  locale      text not null default 'ar' check (locale in ('ar', 'en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Automatically create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- admin_users: ops/admin accounts allowed into the admin website.
-- An admin is also an auth.users record, flagged here with a role.
-- -----------------------------------------------------------------------------
create table public.admin_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        admin_role not null,
  full_name   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_admin_users_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- Helper: is the current user an active admin (optionally of a given role set)?
create or replace function public.is_admin(required_roles admin_role[] default null)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.id = auth.uid()
      and a.is_active
      and (required_roles is null or a.role = any (required_roles))
  );
$$;
