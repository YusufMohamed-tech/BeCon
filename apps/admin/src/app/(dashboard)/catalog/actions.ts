'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sarToHalalas, type PlanType } from '@becon/shared';

export async function createPlan(formData: FormData) {
  const supabase = createClient();

  const priceSar = Number(formData.get('price_sar'));
  const payload = {
    type: formData.get('type') as PlanType,
    name_ar: String(formData.get('name_ar') ?? ''),
    name_en: String(formData.get('name_en') ?? ''),
    description_ar: String(formData.get('description_ar') ?? '') || null,
    description_en: String(formData.get('description_en') ?? '') || null,
    price_halalas: sarToHalalas(priceSar),
    sort_order: Number(formData.get('sort_order') ?? 0),
    is_active: true,
  };

  const { error } = await supabase.from('plans').insert(payload);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/catalog');
  return { ok: true as const };
}

export async function togglePlanActive(planId: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('plans')
    .update({ is_active: isActive })
    .eq('id', planId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/catalog');
  return { ok: true as const };
}

export async function updatePlan(planId: string, formData: FormData) {
  const supabase = createClient();
  const priceSar = Number(formData.get('price_sar'));
  const payload = {
    type: formData.get('type') as PlanType,
    name_ar: String(formData.get('name_ar') ?? ''),
    name_en: String(formData.get('name_en') ?? ''),
    description_ar: String(formData.get('description_ar') ?? '') || null,
    description_en: String(formData.get('description_en') ?? '') || null,
    price_halalas: sarToHalalas(priceSar),
    sort_order: Number(formData.get('sort_order') ?? 0),
  };

  const { error } = await supabase.from('plans').update(payload).eq('id', planId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/catalog');
  return { ok: true as const };
}
