-- =============================================================================
-- 0009_notifications_cron_and_trigger.sql
-- - Schedule the push-notification delivery worker.
-- - Enqueue a "completed" notification automatically when an order completes.
-- =============================================================================

-- Run the notification delivery worker every minute.
select cron.schedule(
  'notification-worker',
  '* * * * *',
  $$ select public.invoke_edge_function('notification-worker'); $$
);

-- When an order transitions to 'completed', queue a push notification.
create or replace function public.notify_order_completed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    insert into public.notifications (user_id, order_id, channel, template, title, body, status)
    values (
      new.user_id,
      new.id,
      'push',
      'order_completed',
      'Your order is ready',
      'Great news! Your request has been completed.',
      'pending'
    );
  end if;
  return new;
end;
$$;

create trigger trg_orders_notify_completed
  after update of status on public.orders
  for each row execute function public.notify_order_completed();
