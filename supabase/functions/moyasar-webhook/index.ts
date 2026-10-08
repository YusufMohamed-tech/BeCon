// =============================================================================
// moyasar-webhook
// Source of truth for payment status (ARCHITECTURE.md section 8).
//
// Moyasar calls this endpoint when a payment succeeds/fails. We:
//   1. Verify the shared secret token.
//   2. Idempotently update the payment + order in one logical step.
//   3. Never trust the client redirect for confirmation.
//
// Configure the webhook in the Moyasar dashboard to POST here with a secret
// token (set MOYASAR_WEBHOOK_SECRET to match).
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { generateInvoiceForOrder } from '../_shared/invoice.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 1. Verify the webhook secret (Moyasar sends it in the payload or a header).
  const expectedSecret = Deno.env.get('MOYASAR_WEBHOOK_SECRET');
  const providedSecret =
    req.headers.get('x-moyasar-token') ?? new URL(req.url).searchParams.get('token');

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response('Invalid signature', { status: 401 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const event = await req.json();
    // Moyasar payment object: { type, data: { id, status, amount, source, metadata } }
    const payment = event.data ?? event;
    const moyasarId: string = payment.id;
    const status: string = payment.status; // 'paid' | 'failed' | ...
    const orderId: string | undefined = payment.metadata?.order_id;
    const method: string | undefined = payment.source?.type; // mada / creditcard / applepay / stcpay

    if (!moyasarId || !orderId) {
      return new Response('Missing payment id or order_id', { status: 400 });
    }

    // 2. Idempotent update: only act if we haven't already recorded this state.
    const { data: existing } = await admin
      .from('payments')
      .select('id, status, order_id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (!existing) {
      return new Response('Payment record not found', { status: 404 });
    }

    const mappedMethod = mapMethod(method);

    if (status === 'paid') {
      // Already paid? Idempotent no-op.
      if (existing.status === 'paid') {
        return new Response('Already processed', { status: 200 });
      }

      await admin
        .from('payments')
        .update({
          status: 'paid',
          moyasar_ref: moyasarId,
          method: mappedMethod,
          provider_payload: payment,
        })
        .eq('id', existing.id);

      // Advance the order to 'paid' (trigger sets paid_at + sla_due_at).
      await admin.from('orders').update({ status: 'paid' }).eq('id', orderId);

      // Generate the ZATCA e-invoice (idempotent).
      await generateInvoiceForOrder(admin, orderId);

      // Queue a payment-confirmation notification to the user.
      const { data: paidOrder } = await admin
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (paidOrder) {
        await admin.from('notifications').insert({
          user_id: paidOrder.user_id,
          order_id: orderId,
          channel: 'push',
          template: 'payment_confirmed',
          title: 'Payment received',
          body: 'Thank you! Your request will be processed within 24 hours.',
          status: 'pending',
        });
      }
    } else if (status === 'failed' || status === 'voided') {
      await admin
        .from('payments')
        .update({
          status: 'failed',
          moyasar_ref: moyasarId,
          failure_reason: payment.source?.message ?? 'Payment failed',
          provider_payload: payment,
        })
        .eq('id', existing.id);

      await admin.from('orders').update({ status: 'payment_failed' }).eq('id', orderId);
    }

    return new Response('ok', { status: 200 });
  } catch (e) {
    return new Response(`Error: ${e}`, { status: 500 });
  }
});

function mapMethod(source?: string): string | null {
  switch (source) {
    case 'mada':
      return 'mada';
    case 'applepay':
      return 'applepay';
    case 'stcpay':
      return 'stcpay';
    case 'creditcard':
    case 'card':
      return 'card';
    default:
      return null;
  }
}
