'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/orders', label: 'الطلبات', hint: 'تنفيذ ومتابعة' },
  { href: '/catalog', label: 'الكتالوج', hint: 'الباقات والأسعار' },
  { href: '/analytics', label: 'التحليلات', hint: 'الإيرادات و SLA' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="brand" dir="ltr">
        Be<span>C</span>on
      </div>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
        >
          <span>{item.label}</span>
          <small className="muted" style={{ fontSize: 11, fontWeight: 800 }}>
            {item.hint}
          </small>
        </Link>
      ))}
      <div style={{ marginTop: 'auto' }}>
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={signOut}>
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
