import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatHalalas, type OrderStatus } from '@becon/shared';
import {
  formatAdminDateTime,
  planTypeLabel,
  statusLabel,
} from '@/lib/labels';
import { OrderActions } from './OrderActions';

type OrderDetail = {
  id: string;
  status: OrderStatus;
  sim_type: string;
  amount_halalas: number;
  sla_due_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  target_msisdn: string | null;
  notes: string | null;
  created_at: string;
  delivery: Record<string, unknown>;
  profiles: { full_name: string | null; phone: string | null } | null;
  plans: { name_en: string; name_ar: string | null } | null;
};

type EventRow = {
  id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  created_at: string;
};

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, status, sim_type, amount_halalas, sla_due_at, paid_at, completed_at, target_msisdn, notes, created_at, delivery, profiles(full_name, phone), plans(name_en, name_ar)',
    )
    .eq('id', params.id)
    .maybeSingle<OrderDetail>();

  if (!order) {
    notFound();
  }

  const { data: events } = await supabase
    .from('order_events')
    .select('id, from_status, to_status, note, created_at')
    .eq('order_id', params.id)
    .order('created_at', { ascending: false })
    .returns<EventRow[]>();

  return (
    <div>
      <Link href="/orders" className="muted" style={{ fontWeight: 900 }}>
        العودة إلى الطلبات
      </Link>

      <div className="page-head" style={{ marginTop: 14 }}>
        <div>
          <p className="page-kicker">طلب #{order.id.slice(0, 8)}</p>
          <h1 className="page-title">
            {order.plans?.name_ar ?? order.plans?.name_en ?? 'طلب BeCon'}
          </h1>
          <p className="page-subtitle">
            نفذ الطلب في النظام الخارجي، ثم استخدم إجراءات الحالة لإبلاغ العميل وإغلاق الدورة.
          </p>
        </div>
        <span className={`badge badge-${order.status}`}>{statusLabel(order.status)}</span>
      </div>

      <div className="detail-grid">
        <section className="card">
          <h2 className="section-title">تفاصيل التنفيذ</h2>
          <dl className="definition-grid">
            <dt>العميل</dt>
            <dd>{order.profiles?.full_name ?? order.profiles?.phone ?? '-'}</dd>
            <dt>الجوال</dt>
            <dd>{order.profiles?.phone ?? order.target_msisdn ?? '-'}</dd>
            <dt>الباقة</dt>
            <dd>{order.plans?.name_ar ?? order.plans?.name_en ?? '-'}</dd>
            <dt>نوع الطلب</dt>
            <dd>{planTypeLabel(order.sim_type)}</dd>
            <dt>المبلغ</dt>
            <dd>{formatHalalas(order.amount_halalas, 'ar')}</dd>
            <dt>رقم الشحن</dt>
            <dd>{order.target_msisdn ?? '-'}</dd>
            <dt>SLA</dt>
            <dd>{formatAdminDateTime(order.sla_due_at)}</dd>
            <dt>وقت الدفع</dt>
            <dd>{formatAdminDateTime(order.paid_at)}</dd>
            <dt>وقت الإنشاء</dt>
            <dd>{formatAdminDateTime(order.created_at)}</dd>
            <dt>وقت الاكتمال</dt>
            <dd>{formatAdminDateTime(order.completed_at)}</dd>
          </dl>

          <div className="section" style={{ marginTop: 22, marginBottom: 0 }}>
            <h2 className="section-title">إجراءات الحالة</h2>
            <OrderActions orderId={order.id} currentStatus={order.status} />
          </div>
        </section>

        <aside className="card">
          <h2 className="section-title">مسار العمليات</h2>
          <p className="page-subtitle" style={{ marginBottom: 16 }}>
            الدفع مؤكد من Moyasar عبر webhook. التنفيذ الفعلي يتم خارج BeCon، ثم يتم تحديث الحالة هنا.
          </p>
          <div className="kpi" style={{ marginBottom: 14 }}>
            <div className="kpi-label">الخطوة الحالية</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>
              {statusLabel(order.status)}
            </div>
            <div className="kpi-sub">عند اختيار مكتمل سيصل إشعار للعميل.</div>
          </div>
          <h3 className="section-title">بيانات إضافية</h3>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              color: 'var(--muted-strong)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 12,
              direction: 'ltr',
              textAlign: 'left',
            }}
          >
            {JSON.stringify(order.delivery ?? {}, null, 2)}
          </pre>
          {order.notes && <p className="page-subtitle">ملاحظات: {order.notes}</p>}
        </aside>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title">سجل الحالة</h2>
        <ul className="timeline-list">
          {events?.map((e) => (
            <li key={e.id} className="timeline-item">
              <div>
                <span className="muted">
                  {e.from_status ? `${statusLabel(e.from_status)} -> ` : ''}
                </span>
                <strong>{statusLabel(e.to_status)}</strong>
              </div>
              {e.note && <div className="muted">{e.note}</div>}
              <div className="muted" style={{ fontSize: 12 }}>
                {formatAdminDateTime(e.created_at)}
              </div>
            </li>
          ))}
          {(!events || events.length === 0) && (
            <li className="muted">لا يوجد سجل حالة بعد.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
