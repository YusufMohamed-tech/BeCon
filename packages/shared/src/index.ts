/**
 * Shared domain types and constants for BeCon.
 * Mirrors the database schema in supabase/migrations.
 */

// -----------------------------------------------------------------------------
// Enums (kept in sync with 0001_extensions_and_enums.sql)
// -----------------------------------------------------------------------------

export type PlanType = 'sim' | 'esim' | 'recharge';

export type OrderStatus =
  | 'created'
  | 'awaiting_payment'
  | 'paid'
  | 'processing'
  | 'awaiting_user_action'
  | 'completed'
  | 'payment_failed'
  | 'refunding'
  | 'refunded'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'mada' | 'applepay' | 'stcpay' | 'card';

export type ActivationStatus = 'pending' | 'active' | 'failed';

export type NotificationChannel = 'push' | 'sms' | 'email';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

export type DevicePlatform = 'ios' | 'android';

export type AdminRole =
  | 'super_admin'
  | 'ops_agent'
  | 'catalog_manager'
  | 'finance'
  | 'support';

// -----------------------------------------------------------------------------
// Order state machine (mirrors 0005_state_machine.sql)
// -----------------------------------------------------------------------------

/** Valid order transitions. Keep in sync with public.order_transitions. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['awaiting_payment', 'cancelled'],
  awaiting_payment: ['paid', 'payment_failed', 'cancelled'],
  payment_failed: ['awaiting_payment'],
  paid: ['processing', 'refunding', 'awaiting_user_action', 'cancelled'],
  processing: ['completed', 'awaiting_user_action', 'refunding'],
  awaiting_user_action: ['processing', 'refunding', 'cancelled'],
  refunding: ['refunded'],
  completed: [],
  refunded: [],
  cancelled: [],
};

/** Whether a transition from -> to is allowed. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses considered terminal (no further transitions). */
export const TERMINAL_STATUSES: OrderStatus[] = [
  'completed',
  'refunded',
  'cancelled',
];

// -----------------------------------------------------------------------------
// Money helpers — everything is stored as integer halalas (1 SAR = 100 halalas)
// -----------------------------------------------------------------------------

export const HALALAS_PER_SAR = 100;

/** KSA VAT rate. */
export const VAT_RATE = 0.15;

export function halalasToSar(halalas: number): number {
  return halalas / HALALAS_PER_SAR;
}

export function sarToHalalas(sar: number): number {
  return Math.round(sar * HALALAS_PER_SAR);
}

/** Format halalas as a SAR currency string (e.g. "49.00 SAR"). */
export function formatHalalas(halalas: number, locale: 'ar' | 'en' = 'en'): string {
  const sar = halalasToSar(halalas);
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
  }).format(sar);
}

/** VAT amount (in halalas) for a VAT-inclusive total. */
export function vatFromInclusive(totalHalalas: number): number {
  return Math.round(totalHalalas - totalHalalas / (1 + VAT_RATE));
}

// -----------------------------------------------------------------------------
// Entity types (mirror the tables)
// -----------------------------------------------------------------------------

export interface Plan {
  id: string;
  type: PlanType;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price_halalas: number;
  specs: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  plan_id: string;
  status: OrderStatus;
  sim_type: PlanType;
  amount_halalas: number;
  sla_due_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  delivery: Record<string, unknown>;
  target_msisdn: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  amount_halalas: number;
  moyasar_ref: string | null;
  idempotency_key: string;
  provider_payload: Record<string, unknown> | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  nafath_ref: string | null;
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected';
  locale: 'ar' | 'en';
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor: string | null;
  note: string | null;
  created_at: string;
}
