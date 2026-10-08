import { useEffect, useState } from 'react';
import type { Plan } from '@becon/shared';
import { supabase } from '@/lib/supabase';

export function useActivePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (!mounted) return;
        setPlans((data as Plan[]) ?? []);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { plans, loading };
}
