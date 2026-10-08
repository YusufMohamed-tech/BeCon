'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/orders');
    router.refresh();
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand" dir="ltr">
          Be<span>C</span>on
        </div>
        <p className="page-kicker">لوحة العمليات</p>
        <h1 className="page-title" style={{ marginBottom: 8 }}>
          تسجيل دخول الفريق
        </h1>
        <p className="page-subtitle" style={{ marginBottom: 22 }}>
          هذه المساحة مخصصة لفريق العمليات لإدارة الطلبات وتحديث حالة التنفيذ.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
