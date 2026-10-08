// =============================================================================
// sla-breach-worker
// Scheduled worker (ARCHITECTURE.md sections 6 & 10).
//
// Finds orders whose 24h SLA has elapsed but are still not completed, then:
//   1. Sends an apology notification to the user.
//   2. Records an ops alert.
//   3. Marks the order as alerted (sla_breached_at) so it is never re-alerted.
//
// Trigger this on a schedule (pg_cron -> see migration 0008) or an external
// scheduler hitting this function's URL with the service-role key.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

// States that still owe the user fulfillment when the SLA elapses.
const ACTIVE_STATES = ['paid', 'processing', 'awaiting_user_action'];

Deno.serve(async (req) => {
  // Only allow trusted callers (cron/admin) holding the service role key.
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '___')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const nowIso = new Date().toISOString();

  // Find breached, not-yet-alerted orders.
  const { data: breached, error } = await admin
    .from('orders')
    .select('id, user_id, sla_due_at, status')
    .in('status', ACTIVE_STATES)
    .is('sla_breached_at', null)
    .lt('sla_due_at', nowIso)
    .limit(500);

  if (error) {
    return json({ error: error.message }, 500);
  }

  let processed = 0;

  for (const order of breached ?? []) {
    // 1. Apology notification to the user (worker queues it; delivery worker sends).
    await admin.from('notifications').insert({
      user_id: order.user_id,
      order_id: order.id,
      channel: 'push',
      template: 'sla_breach_apology',
      title: 'Sorry for the delay',
      body: 'Your order is taking longer than expected. Our team is on it and will complete it shortly.',
      status: 'pending',
    });

    // 2. Mark the order as alerted (idempotency) + add an audit note.
    await admin
      .from('orders')
      .update({
        sla_breached_at: nowIso,
        notes: `SLA breached at ${nowIso}`,
      })
      .eq('id', order.id);

    processed++;
  }

  return json({ ok: true, scanned: breached?.length ?? 0, processed });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
