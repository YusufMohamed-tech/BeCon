-- =============================================================================
-- seed.sql
-- Sample catalog data for local development.
-- Prices are in halalas (1 SAR = 100 halalas).
-- =============================================================================

insert into public.plans (type, name_ar, name_en, description_ar, description_en, price_halalas, specs, sort_order, is_active)
values
  -- eSIM plans
  ('esim', 'باقة eSIM 10 جيجا', 'eSIM 10GB',
   'باقة بيانات 10 جيجا صالحة 30 يوم', '10GB data valid for 30 days',
   4900, '{"data_gb": 10, "validity_days": 30, "network": "5G"}'::jsonb, 10, true),

  ('esim', 'باقة eSIM 25 جيجا', 'eSIM 25GB',
   'باقة بيانات 25 جيجا صالحة 30 يوم', '25GB data valid for 30 days',
   8900, '{"data_gb": 25, "validity_days": 30, "network": "5G"}'::jsonb, 20, true),

  ('esim', 'باقة eSIM لا محدود', 'eSIM Unlimited',
   'بيانات لا محدودة صالحة 30 يوم', 'Unlimited data valid for 30 days',
   14900, '{"data_gb": null, "validity_days": 30, "network": "5G", "unlimited": true}'::jsonb, 30, true),

  -- Physical SIM plans
  ('sim', 'شريحة جديدة 20 جيجا', 'New SIM 20GB',
   'شريحة فعلية مع 20 جيجا وتوصيل خلال 24 ساعة', 'Physical SIM with 20GB, delivered within 24h',
   7900, '{"data_gb": 20, "validity_days": 30, "delivery": true}'::jsonb, 40, true),

  ('sim', 'شريحة جديدة 50 جيجا', 'New SIM 50GB',
   'شريحة فعلية مع 50 جيجا وتوصيل خلال 24 ساعة', 'Physical SIM with 50GB, delivered within 24h',
   11900, '{"data_gb": 50, "validity_days": 30, "delivery": true}'::jsonb, 50, true),

  -- Recharge plans
  ('recharge', 'إعادة شحن 30 ريال', 'Recharge SAR 30',
   'إعادة شحن رصيد بقيمة 30 ريال', 'Top up balance worth SAR 30',
   3000, '{"credit_sar": 30}'::jsonb, 60, true),

  ('recharge', 'إعادة شحن 50 ريال', 'Recharge SAR 50',
   'إعادة شحن رصيد بقيمة 50 ريال', 'Top up balance worth SAR 50',
   5000, '{"credit_sar": 50}'::jsonb, 70, true),

  ('recharge', 'إعادة شحن 100 ريال', 'Recharge SAR 100',
   'إعادة شحن رصيد بقيمة 100 ريال', 'Top up balance worth SAR 100',
   10000, '{"credit_sar": 100}'::jsonb, 80, true);
