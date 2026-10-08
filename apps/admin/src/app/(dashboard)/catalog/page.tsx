import { createClient } from '@/lib/supabase/server';
import { formatHalalas, type PlanType } from '@becon/shared';
import { planTypeLabel } from '@/lib/labels';
import { NewPlanForm } from './NewPlanForm';
import { TogglePlan } from './TogglePlan';
import { EditPlanForm } from './EditPlanForm';

type PlanRow = {
  id: string;
  type: PlanType;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  price_halalas: number;
  sort_order: number;
  is_active: boolean;
};

export default async function CatalogPage() {
  const supabase = createClient();

  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, type, name_en, name_ar, description_en, description_ar, price_halalas, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .returns<PlanRow[]>();

  const rows = plans ?? [];
  const activeCount = rows.filter((p) => p.is_active).length;
  const disabledCount = rows.length - activeCount;

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="page-kicker">إدارة الكتالوج</p>
          <h1 className="page-title">الباقات والأسعار</h1>
          <p className="page-subtitle">
            أضف أو عدل أو عطّل خطط SIM و eSIM والشحن. ما يظهر هنا هو ما يراه العميل في تطبيق BeCon.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <NewPlanForm />
      </div>

      <div className="kpi-grid">
        <Kpi label="إجمالي الباقات" value={rows.length.toString()} sub="كل المنتجات المسجلة" />
        <Kpi label="باقات نشطة" value={activeCount.toString()} sub="ظاهرة للعملاء" />
        <Kpi label="باقات معطلة" value={disabledCount.toString()} sub="مخفية من التطبيق" />
      </div>

      {error && <div className="error">{error.message}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الاسم العربي</th>
              <th>الاسم الإنجليزي</th>
              <th>النوع</th>
              <th>السعر</th>
              <th>الترتيب</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.name_ar}</td>
                <td dir="ltr" style={{ textAlign: 'left' }}>
                  {p.name_en}
                </td>
                <td>{planTypeLabel(p.type)}</td>
                <td>{formatHalalas(p.price_halalas, 'ar')}</td>
                <td>{p.sort_order}</td>
                <td>
                  <span className={`badge badge-${p.is_active ? 'completed' : 'cancelled'}`}>
                    {p.is_active ? 'نشطة' : 'معطلة'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <EditPlanForm plan={p} />
                    <TogglePlan planId={p.id} isActive={p.is_active} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                  لا توجد باقات بعد.
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
