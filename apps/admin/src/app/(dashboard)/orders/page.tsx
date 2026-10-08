import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatHalalas, type OrderStatus } from '@becon/shared';
import {
  formatAdminDate,
  formatAdminDateTime,
  planTypeLabel,
  statusLabel,
} from '@/lib/labels';

const STATUS_FILTERS: (OrderStatus | 'all')[] = [
  'all',
  'paid',
  'processing',
  'awaiting_user_action',
  'completed',
  'payment_failed',
  'refunding',
];

const ACTIVE_STATUSES: OrderStatus[] = ['paid', 'processing', 'awaiting_user_action'];
const TERMINAL_STATUSES: OrderStatus[] = ['completed', 'refunded', 'cancelled'];

type OrderRow = {
  id: string;
  status: OrderStatus;
  sim_type: string;
  amount_halalas: number;
  sla_due_at: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
  plans: { name_en: string; name_ar: string | null } | null;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const status = searchParams.status ?? 'all';

  let query = supabase
    .from('orders')
    .select(
      'id, status, sim_type, amount_halalas, sla_due_at, created_at, profiles(full_name, phone), plans(name_en, name_ar)',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: orders, error } = await query.returns<OrderRow[]>();
  const rows = orders ?? [];
  const now = Date.now();
  const activeOrders = rows.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const completedOrders = rows.filter((o) => o.status === 'completed').length;
  const breachedOrders = rows.filter(
    (o) =>
      o.sla_due_at &&
      new Date(o.sla_due_at).getTime() < now &&
      !TERMINAL_STATUSES.includes(o.status),
  ).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="page-kicker">لوحة العمليات</p>
          <h1 className="page-title">طلبات العملاء</h1>
          <p className="page-subtitle">
            كل طلب مدفوع يظهر هنا لفريق العمليات. افتح الطلب، نفذه في النظام الخارجي، ثم حدّث الحالة إلى مكتمل.
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi label="طلبات ظاهرة" value={rows.length.toString()} sub="آخر 100 طلب حسب التصفية" />
        <Kpi label="قيد التنفيذ" value={activeOrders.toString()} sub="مدفوعة أو تحت المعالجة" />
        <Kpi label="مكتملة" value={completedOrders.toString()} sub="تم إغلاقها بنجاح" />
        <Kpi label="SLA متأخر" value={breachedOrders.toString()} sub="تجاوزت مهلة 24 ساعة" />
      </div>

      <div className="toolbar">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/orders' : `/orders?status=${s}`}
            className={`badge badge-${s === 'all' ? 'created' : s}`}
            style={{ opacity: status === s ? 1 : 0.55 }}
          >
            {s === 'all' ? 'الكل' : statusLabel(s)}
          </Link>
        ))}
      </div>

      {error && <div className="error">{error.message}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الطلب</th>
              <th>العميل</th>
              <th>الباقة</th>
              <th>النوع</th>
              <th>المبلغ</th>
              <th>الحالة</th>
              <th>SLA</th>
              <th>تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/orders/${o.id}`} style={{ fontWeight: 900 }}>
                    #{o.id.slice(0, 8)}
                  </Link>
                </td>
                <td>{o.profiles?.full_name ?? o.profiles?.phone ?? '-'}</td>
                <td>{o.plans?.name_ar ?? o.plans?.name_en ?? '-'}</td>
                <td>{planTypeLabel(o.sim_type)}</td>
                <td>{formatHalalas(o.amount_halalas, 'ar')}</td>
                <td>
                  <span className={`badge badge-${o.status}`}>{statusLabel(o.status)}</span>
                </td>
                <td>{formatAdminDateTime(o.sla_due_at)}</td>
                <td>{formatAdminDate(o.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                  لا توجد طلبات حسب هذه التصفية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
