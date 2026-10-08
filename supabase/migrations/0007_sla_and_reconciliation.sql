-- =============================================================================
-- 0007_sla_and_reconciliation.sql
-- Support columns for the SLA-breach and reconciliation workers (Phase 2).
-- =============================================================================

-- Marks the moment an SLA-breach alert was first sent for an order, so the
-- worker is idempotent and never alerts the same order twice.
alter table public.orders
  add column if not exists sla_breached_at timestamptz;

-- Records the last time the reconciliation worker checked a payment and any
-- mismatch it found (free-form), for auditing.
alter table public.payments
  add column if not exists reconciled_at timestamptz,
  add column if not exists reconciliation_note text;

-- Helpful partial index: orders that are past due and not yet alerted.
create index if not exists idx_orders_sla_breach_scan
  on public.orders (sla_due_at)
  where sla_breached_at is null
    and status in ('paid', 'processing', 'awaiting_user_action');
