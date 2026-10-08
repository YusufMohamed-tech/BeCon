// =============================================================================
// invoice.ts — shared ZATCA invoice generation logic (no server side effects).
// Used by both the generate-invoice function and the payment webhook.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { buildZatcaQr, halalasToSarString } from './zatca.ts';

const VAT_RATE = 0.15;

const SELLER_NAME = Deno.env.get('ZATCA_SELLER_NAME') ?? 'BeCon';
const SELLER_VAT = Deno.env.get('ZATCA_VAT_NUMBER') ?? '300000000000003';

/**
 * Generate a ZATCA-compliant invoice for a paid order.
 * Idempotent: at most one invoice per order. Treats amount as VAT-inclusive.
 */
export async function generateInvoiceForOrder(
  admin: ReturnType<typeof createClient>,
  orderId: string,
) {
  const { data: existing } = await admin
    .from('invoices')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existing) {
    return { ok: true, skipped: true, invoice_id: existing.id };
  }

  const { data: order, error } = await admin
    .from('orders')
    .select('id, amount_halalas, paid_at')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return { ok: false, error: 'Order not found' };
  }

  const totalHalalas = order.amount_halalas as number;
  const vatHalalas = Math.round(totalHalalas - totalHalalas / (1 + VAT_RATE));
  const timestamp = (order.paid_at as string) ?? new Date().toISOString();

  const qr = buildZatcaQr({
    sellerName: SELLER_NAME,
    vatNumber: SELLER_VAT,
    timestamp,
    totalWithVat: halalasToSarString(totalHalalas),
    vatTotal: halalasToSarString(vatHalalas),
  });

  const { data: invoice, error: insErr } = await admin
    .from('invoices')
    .insert({
      order_id: orderId,
      qr,
      vat_halalas: vatHalalas,
      total_halalas: totalHalalas,
    })
    .select('id')
    .single();

  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  return { ok: true, invoice_id: invoice.id, vat_halalas: vatHalalas };
}
