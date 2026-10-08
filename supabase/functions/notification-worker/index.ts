// =============================================================================
// notification-worker
// Turns queued `notifications` rows (status='pending', channel='push') into
// real FCM sends to the user's registered devices.
//
// For each pending notification:
//   - look up the user's device tokens,
//   - send via FCM HTTP v1,
//   - mark the notification sent/failed,
//   - prune dead device tokens.
//
// Scheduled by pg_cron (migration 0008) or an external scheduler.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sendFcm } from '../_shared/fcm.ts';

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '___')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Pull a batch of pending push notifications.
  const { data: pending, error } = await admin
    .from('notifications')
    .select('id, user_id, title, body, order_id')
    .eq('status', 'pending')
    .eq('channel', 'push')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    return json({ error: error.message }, 500);
  }

  let sent = 0;
  let failed = 0;

  for (const n of pending ?? []) {
    // Find the user's devices.
    const { data: devices } = await admin
      .from('devices')
      .select('id, fcm_token')
      .eq('user_id', n.user_id);

    if (!devices || devices.length === 0) {
      // No device to deliver to — mark failed so it isn't retried forever.
      await admin
        .from('notifications')
        .update({ status: 'failed' })
        .eq('id', n.id);
      failed++;
      continue;
    }

    let anyDelivered = false;

    for (const device of devices) {
      try {
        const result = await sendFcm(
          device.fcm_token,
          n.title ?? 'BeCon',
          n.body ?? '',
          n.order_id ? { order_id: n.order_id } : undefined,
        );

        if (result.ok) {
          anyDelivered = true;
        } else if (result.invalidToken) {
          // Prune dead tokens.
          await admin.from('devices').delete().eq('id', device.id);
        }
      } catch (_e) {
        // Leave for the next run; a transient FCM/auth error.
      }
    }

    await admin
      .from('notifications')
      .update({
        status: anyDelivered ? 'sent' : 'failed',
        sent_at: anyDelivered ? new Date().toISOString() : null,
      })
      .eq('id', n.id);

    anyDelivered ? sent++ : failed++;
  }

  return json({ ok: true, processed: pending?.length ?? 0, sent, failed });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
