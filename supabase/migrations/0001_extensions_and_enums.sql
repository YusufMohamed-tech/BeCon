-- =============================================================================
-- 0001_extensions_and_enums.sql
-- Foundational extensions and enum types for BeCon.
-- =============================================================================

-- UUID generation
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

-- Type of product a plan represents.
create type plan_type as enum ('sim', 'esim', 'recharge');

-- Lifecycle status of an order (see ARCHITECTURE.md section 6 — state machine).
create type order_status as enum (
  'created',
  'awaiting_payment',
  'paid',
  'processing',
  'awaiting_user_action',
  'completed',
  'payment_failed',
  'refunding',
  'refunded',
  'cancelled'
);

-- Status of a payment attempt.
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- Payment method used (KSA-focused).
create type payment_method as enum ('mada', 'applepay', 'stcpay', 'card');

-- Activation status for a provisioned SIM/eSIM asset.
create type activation_status as enum ('pending', 'active', 'failed');

-- Channels a notification can be delivered through.
create type notification_channel as enum ('push', 'sms', 'email');

-- Delivery status of a notification.
create type notification_status as enum ('pending', 'sent', 'failed');

-- Mobile platform for a registered device/push token.
create type device_platform as enum ('ios', 'android');

-- Admin/ops roles for the dashboard (RBAC — see ARCHITECTURE.md section 9).
create type admin_role as enum (
  'super_admin',
  'ops_agent',
  'catalog_manager',
  'finance',
  'support'
);

-- -----------------------------------------------------------------------------
-- Shared trigger: keep updated_at current on row updates.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
