import type { OrderStatus, PlanType } from '@becon/shared';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  created: 'تم إنشاء الطلب',
  awaiting_payment: 'بانتظار الدفع',
  paid: 'تم الدفع',
  processing: 'قيد المعالجة',
  awaiting_user_action: 'بانتظار إجراء العميل',
  completed: 'مكتمل',
  payment_failed: 'فشل الدفع',
  refunding: 'قيد الاسترداد',
  refunded: 'تم الاسترداد',
  cancelled: 'ملغي',
};

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  sim: 'شريحة فعلية',
  esim: 'eSIM',
  recharge: 'شحن',
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function planTypeLabel(type: string | null | undefined): string {
  if (!type) return '-';
  return PLAN_TYPE_LABELS[type as PlanType] ?? type;
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatAdminDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
