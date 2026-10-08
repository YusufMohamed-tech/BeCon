-- =============================================================================
-- 0008_cron_schedules.sql
-- Schedule the SLA-breach and reconciliation workers with pg_cron + pg_net.
--
-- These call the deployed Edge Functions over HTTP using the service-role key.
-- Set the two settings below once per project (psql or the SQL editor):
--
--   alter database postgres set app.settings.functions_base_url = 'https://<ref>.functions.supabase.co';
--   alter database postgres set app.settings.service_role_key   = '<service-role-key>';
--
-- On Supabase Cloud, pg_cron and pg_net are available; enable them here.
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Helper to POST to an Edge Function with the service-role bearer token.
create or replace function public.invoke_edge_function(fn_name text)
returns void
language plpgsql
security definer
as $$
declare
  base_url text := current_setting('app.settings.functions_base_url', true);
  key      text := current_setting('app.settings.service_role_key', true);
begin
  if base_url is null or key is null then
    raise notice 'functions_base_url or service_role_key not set; skipping %', fn_name;
    return;
  end if;

  perform net.http_post(
    url     := base_url || '/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || key
    ),
    body    := '{}'::jsonb
  );
end;
$$;

-- SLA-breach scan: every 15 minutes.
select cron.schedule(
  'sla-breach-worker',
  '*/15 * * * *',
  $$ select public.invoke_edge_function('sla-breach-worker'); $$
);

-- Payment reconciliation: every 5 minutes.
select cron.schedule(
  'reconciliation-worker',
  '*/5 * * * *',
  $$ select public.invoke_edge_function('reconciliation-worker'); $$
);
