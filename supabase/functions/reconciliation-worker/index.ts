// =============================================================================
// reconciliation-worker
// The anti-Tygo safety net (ARCHITECTURE.md section 8).
//
// Periodically lists recent payments from Moyasar and compares them against our
// database. This recovers from missed/failed webhooks and flags mismatches:
//   - Moyasar 'paid'   but our order not paid     -> mark paid + advance order.
//   - Moyasar 'failed' but our payment not failed -> mark failed.
//   - Our payment 'paid' but Moyasar 'refunded'   -> move order to 'refunding'.
//
// Trigger on a schedule (pg_cron -> migration 0008) or an external scheduler
// calling this function's URL with the service-role key.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MOYASAR_API = 'https://api.moyasar.com/v1/payments';

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '___')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const secretKey = Deno.env.get('MOYASAR_SECRET_KEY');
  if (!secretKey) {
    return json({ error: 'MOYASAR_SECRET_KEY not configured' }, 500);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Basic auth: secret key as username, empty password.
  const authHeader = 'Basic ' + btoa(`${secretKey}:`);

  // Fetch a recent page of Moyasar payments.
  const res = await fetch(`${MOYASAR_API}?page=1`, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    return json({ error: `Moyasar API error ${res.status}` }, 502);
  }

  const body = await res.json();
  const moyasarPayments: MoyasarPayment[] = body.payments ?? [];

  const result = { scanned: moyasarPayments.length, fixed: 0, flagged: 0, mismatches: [] as string[] };
  const nowIso = new Date().toISOString();

  for (const mp of moyasarPayments) {
    const orderId = mp.metadata?.order_id;
    if (!orderId) continue;

    const { data: payment } = await admin
      .from('payments')
      .select('id, status, order_id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (!payment) continue;

    // Case 1: Moyasar paid, our DB not paid -> recover the missed webhook.
    if (mp.status === 'paid' && payment.status !== 'paid') {
      await admin
        .from('payments')
        .update({
          status: 'paid',
          moyasar_ref: mp.id,
          method: mapMethod(mp.source?.type),
          provider_payload: mp,
          reconciled_at: nowIso,
          reconciliation_note: 'Recovered paid status via reconciliation',
        })
        .eq('id', payment.id);

      await admin.from('orders').update({ status: 'paid' }).eq('id', orderId);
      result.fixed++;
      result.mismatches.push(`${orderId}: paid (recovered)`);
      continue;
    }

    // Case 2: Moyasar failed/voided, our DB still pending -> mark failed.
    if ((mp.status === 'failed' || mp.status === 'voided') && payment.status === 'pending') {
      await admin
        .from('payments')
        .update({
          status: 'failed',
          moyasar_ref: mp.id,
          failure_reason: mp.source?.message ?? 'Failed (reconciliation)',
          reconciled_at: nowIso,
          reconciliation_note: 'Marked failed via reconciliation',
        })
        .eq('id', payment.id);

      await admin.from('orders').update({ status: 'payment_failed' }).eq('id', orderId);
      result.fixed++;
      result.mismatches.push(`${orderId}: failed (recovered)`);
      continue;
    }

    // Case 3: We think paid, Moyasar refunded -> flag for refunding.
    if (mp.status === 'refunded' && payment.status === 'paid') {
      await admin
        .from('payments')
        .update({
          reconciled_at: nowIso,
          reconciliation_note: 'Moyasar shows refunded; order moved to refunding',
        })
        .eq('id', payment.id);

      // Only valid from non-terminal states; ignore errors if already terminal.
      await admin.from('orders').update({ status: 'refunding' }).eq('id', orderId);
      result.flagged++;
      result.mismatches.push(`${orderId}: refunded mismatch`);
      continue;
    }

    // In sync: just stamp the check time.
    await admin
      .from('payments')
      .update({ reconciled_at: nowIso })
      .eq('id', payment.id);
  }

  return json({ ok: true, ...result });
});

type MoyasarPayment = {
  id: string;
  status: string;
  source?: { type?: string; message?: string };
  metadata?: { order_id?: string };
};

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
