// =============================================================================
// generate-invoice
// HTTP entrypoint to generate a ZATCA-compliant e-invoice for a paid order.
// The actual logic lives in ../_shared/invoice.ts (also used by the webhook).
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { generateInvoiceForOrder } from '../_shared/invoice.ts';

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '___')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { order_id } = await req.json().catch(() => ({}));
  if (!order_id) {
    return json({ error: 'order_id is required' }, 400);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const result = await generateInvoiceForOrder(admin, order_id);
  return json(result, result.ok ? 200 : 500);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
