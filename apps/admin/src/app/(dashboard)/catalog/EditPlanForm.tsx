'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanType } from '@becon/shared';
import { updatePlan } from './actions';

type EditablePlan = {
  id: string;
  type: PlanType;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  price_halalas: number;
  sort_order: number;
};

export function EditPlanForm({ plan }: { plan: EditablePlan }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePlan(plan.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>
        تعديل
      </button>
      {open && (
        <div className="modal-backdrop" role="presentation">
          <form className="card modal-card" onSubmit={handleSubmit}>
            <div className="page-head" style={{ marginBottom: 16 }}>
              <div>
                <p className="page-kicker">تعديل باقة</p>
                <h2 className="section-title" style={{ margin: 0 }}>
                  {plan.name_ar || plan.name_en}
                </h2>
              </div>
              <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
                إغلاق
              </button>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>نوع الخدمة</label>
                <select name="type" className="select" defaultValue={plan.type}>
                  <option value="esim">eSIM</option>
                  <option value="sim">شريحة فعلية</option>
                  <option value="recharge">شحن</option>
                </select>
              </div>
              <div className="field">
                <label>السعر بالريال</label>
                <input
                  name="price_sar"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  defaultValue={plan.price_halalas / 100}
                  required
                />
              </div>
              <div className="field">
                <label>الاسم بالإنجليزية</label>
                <input name="name_en" className="input" defaultValue={plan.name_en} required />
              </div>
              <div className="field">
                <label>الاسم بالعربية</label>
                <input name="name_ar" className="input" defaultValue={plan.name_ar} required dir="rtl" />
              </div>
              <div className="field">
                <label>الوصف بالإنجليزية</label>
                <input name="description_en" className="input" defaultValue={plan.description_en ?? ''} />
              </div>
              <div className="field">
                <label>الوصف بالعربية</label>
                <input
                  name="description_ar"
                  className="input"
                  defaultValue={plan.description_ar ?? ''}
                  dir="rtl"
                />
              </div>
              <div className="field">
                <label>ترتيب الظهور</label>
                <input name="sort_order" type="number" defaultValue={plan.sort_order} className="input" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" type="submit" disabled={isPending}>
                {isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
                إلغاء
              </button>
            </div>
            {error && <div className="error">{error}</div>}
          </form>
        </div>
      )}
    </>
  );
}
