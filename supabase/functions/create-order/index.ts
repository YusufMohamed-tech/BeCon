// =============================================================================
// create-order
// Creates an order + a pending payment, then returns the data the mobile app
// needs to launch the Moyasar payment sheet.
//
// The order is created server-side (service role) so the amount is taken from
// the plan in the DB — never trusted from the client.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // The caller's JWT identifies the user.
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { plan_id, target_msisdn, delivery } = await req.json();
    if (!plan_id) {
      return json({ error: 'plan_id is required' }, 400);
    }

    // Service-role client for trusted writes.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Read the plan price from the DB (source of truth).
    const { data: plan, error: planErr } = await admin
      .from('plans')
      .select('id, type, price_halalas, is_active')
      .eq('id', plan_id)
      .single();

    if (planErr || !plan || !plan.is_active) {
      return json({ error: 'Plan not found or inactive' }, 404);
    }

    // Create the order (status defaults to 'created').
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        sim_type: plan.type,
        amount_halalas: plan.price_halalas,
        target_msisdn: target_msisdn ?? null,
        delivery: delivery ?? {},
      })
      .select('id, amount_halalas')
      .single();

    if (orderErr || !order) {
      return json({ error: orderErr?.message ?? 'Failed to create order' }, 500);
    }

    // Move to awaiting_payment.
    await admin.from('orders').update({ status: 'awaiting_payment' }).eq('id', order.id);

    // Create the pending payment with an idempotency key.
    const idempotencyKey = crypto.randomUUID();
    const { error: payErr } = await admin.from('payments').insert({
      order_id: order.id,
      amount_halalas: order.amount_halalas,
      idempotency_key: idempotencyKey,
      status: 'pending',
    });

    if (payErr) {
      return json({ error: payErr.message }, 500);
    }

    // The mobile app uses the publishable key + amount to launch Moyasar.
    return json({
      order_id: order.id,
      amount_halalas: order.amount_halalas,
      currency: 'SAR',
      idempotency_key: idempotencyKey,
      moyasar_publishable_key: Deno.env.get('MOYASAR_PUBLISHABLE_KEY'),
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
