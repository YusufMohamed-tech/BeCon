'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@becon/shared';

/**
 * Advance an order to a new status via the secure DB function
 * (public.advance_order_status), which enforces valid transitions + admin rights.
 */
export async function advanceOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  note?: string,
) {
  const supabase = createClient();

  const { error } = await supabase.rpc('advance_order_status', {
    p_order_id: orderId,
    p_to_status: toStatus,
    p_note: note ?? null,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  return { ok: true as const };
}
