'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPlan } from './actions';

export function NewPlanForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPlan(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        إضافة باقة
      </button>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card" style={{ marginBottom: 20 }}>
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <p className="page-kicker">كتالوج BeCon</p>
          <h2 className="section-title" style={{ margin: 0 }}>
            باقة جديدة
          </h2>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
          إغلاق
        </button>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>نوع الخدمة</label>
          <select name="type" className="select" defaultValue="esim">
            <option value="esim">eSIM</option>
            <option value="sim">شريحة فعلية</option>
            <option value="recharge">شحن</option>
          </select>
        </div>
        <div className="field">
          <label>السعر بالريال</label>
          <input name="price_sar" type="number" step="0.01" min="0" className="input" required />
        </div>
        <div className="field">
          <label>الاسم بالإنجليزية</label>
          <input name="name_en" className="input" required />
        </div>
        <div className="field">
          <label>الاسم بالعربية</label>
          <input name="name_ar" className="input" required dir="rtl" />
        </div>
        <div className="field">
          <label>الوصف بالإنجليزية</label>
          <input name="description_en" className="input" />
        </div>
        <div className="field">
          <label>الوصف بالعربية</label>
          <input name="description_ar" className="input" dir="rtl" />
        </div>
        <div className="field">
          <label>ترتيب الظهور</label>
          <input name="sort_order" type="number" defaultValue={0} className="input" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" type="submit" disabled={isPending}>
          {isPending ? 'جاري الحفظ...' : 'حفظ الباقة'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
          إلغاء
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
