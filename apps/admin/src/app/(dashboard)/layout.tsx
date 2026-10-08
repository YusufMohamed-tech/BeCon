import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from './Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure the signed-in user is an active admin.
  const { data: admin } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!admin || !admin.is_active) {
    redirect('/login?error=not_authorized');
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
}
