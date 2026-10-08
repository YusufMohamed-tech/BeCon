import { createClient } from '@/lib/supabase/server';
import { formatHalalas, type PlanType } from '@becon/shared';
import { planTypeLabel } from '@/lib/labels';

type Summary = {
  total_orders: number;
  paid_orders: number;
  completed_orders: number;
  revenue_halalas: number;
  conversion_rate: number | null;
  completion_rate: number | null;
  sla_breaches: number;
  orders_last_24h: number;
};

type DailyRow = { day: string; orders: number; revenue_halalas: number };

type TopPlan = {
  plan_id: string;
  name_en: string;
  type: PlanType;
  orders: number;
  revenue_halalas: number;
};

type RpcArrayResult<T> = T[] | { Error: string } | null;

function asArray<T>(value: RpcArrayResult<T>): T[] {
  return Array.isArray(value) ? value : [];
}

export default async function AnalyticsPage() {
  const supabase = createClient();

  const [summaryRes, dailyRes, topRes] = await Promise.all([
    supabase.rpc('analytics_summary').returns<Summary[]>(),
    supabase.rpc('analytics_daily', { days: 14 }).returns<DailyRow[]>(),
    supabase.rpc('analytics_top_plans', { limit_count: 5 }).returns<TopPlan[]>(),
  ]);

  const summary = asArray(summaryRes.data)[0];
  const daily = asArray(dailyRes.data);
  const topPlans = asArray(topRes.data);
  const error = summaryRes.error || dailyRes.error || topRes.error;
  const maxRevenue = Math.max(1, ...daily.map((d) => d.revenue_halalas));

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="page-kicker">تحليلات التشغيل</p>
          <h1 className="page-title">أداء BeCon</h1>
          <p className="page-subtitle">
            قراءة سريعة للإيرادات، التحويل، اكتمال الطلبات، وأي تأخير في SLA حتى يعرف الفريق أين يركز.
          </p>
        </div>
      </div>

      {error && <div className="error">{error.message}</div>}

      <div className="kpi-grid">
        <Kpi
          label="الإيرادات"
          value={formatHalalas(summary?.revenue_halalas ?? 0, 'ar')}
          sub="طلبات مدفوعة أو مكتملة"
        />
        <Kpi
          label="الطلبات"
          value={`${summary?.total_orders ?? 0}`}
          sub={`${summary?.orders_last_24h ?? 0} خلال آخر 24 ساعة`}
        />
        <Kpi
          label="التحويل"
          value={`${summary?.conversion_rate ?? 0}%`}
          sub={`${summary?.paid_orders ?? 0} طلب مدفوع`}
        />
        <Kpi
          label="الإكمال"
          value={`${summary?.completion_rate ?? 0}%`}
          sub={`${summary?.completed_orders ?? 0} طلب مكتمل`}
        />
        <Kpi
          label="تجاوز SLA"
          value={`${summary?.sla_breaches ?? 0}`}
          sub="طلبات تجاوزت مهلة 24 ساعة"
        />
      </div>

      <div className="section">
        <h2 className="section-title">الإيرادات خلال آخر 14 يوم</h2>
        <div className="card">
          {daily.length === 0 && <div className="muted">لا توجد طلبات بعد.</div>}
          {daily.map((d) => (
            <div className="bar-row" key={d.day}>
              <div className="bar-label">{formatDay(d.day)}</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(d.revenue_halalas / maxRevenue) * 100}%` }}
                />
              </div>
              <div className="bar-value">{formatHalalas(d.revenue_halalas, 'ar')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">أعلى الباقات</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الباقة</th>
                <th>النوع</th>
                <th>الطلبات</th>
                <th>الإيرادات</th>
              </tr>
            </thead>
            <tbody>
              {topPlans.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--muted)' }}>
                    لا توجد طلبات مدفوعة بعد.
                  </td>
                </tr>
              )}
              {topPlans.map((p) => (
                <tr key={p.plan_id}>
                  <td>{p.name_en}</td>
                  <td>{planTypeLabel(p.type)}</td>
                  <td>{p.orders}</td>
                  <td>{formatHalalas(p.revenue_halalas, 'ar')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function formatDay(day: string): string {
  return new Intl.DateTimeFormat('ar-SA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(day));
}
