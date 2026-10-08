import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Plan, PlanType } from '@becon/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { colors, formatArabicSar, styles } from '@/theme';

type SimChoice = 'esim' | 'physical';

const TYPE_LABEL: Record<PlanType, string> = {
  sim: 'شريحة فعلية',
  esim: 'eSIM رقمية',
  recharge: 'شحن باقة',
};

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedSimType, setSelectedSimType] = useState<SimChoice>('esim');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        const loadedPlan = data as Plan;
        setPlan(loadedPlan);
        setSelectedSimType(loadedPlan.type === 'sim' ? 'physical' : 'esim');
        setLoading(false);
      });
  }, [id]);

  if (loading || !plan) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.orange} size="large" />
        <Text style={[styles.cardDesc, { marginTop: 12 }]}>جاري تحميل تفاصيل الباقة...</Text>
      </View>
    );
  }

  const features = planFeatures(plan, selectedSimType);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 104 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: heroColor(plan.type), position: 'relative' }]}>
          <View
            style={{
              position: 'absolute',
              top: -56,
              left: -44,
              width: 160,
              height: 160,
              borderRadius: 999,
              backgroundColor: 'rgba(27,107,255,0.28)',
            }}
          />
          <View style={styles.between}>
            <View style={[styles.softChip, { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)' }]}>
              <Text style={[styles.softChipText, { color: colors.white }]}>{TYPE_LABEL[plan.type]}</Text>
            </View>
            <SignalBars />
          </View>

          <Text style={[styles.heroTitle, { marginTop: 18 }]}>{arabicPlanName(plan)}</Text>
          <Text style={styles.heroText}>{arabicPlanDescription(plan)}</Text>

          <View style={[styles.row, { gap: 10, marginTop: 18, alignItems: 'flex-end' }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#bfdbfe', textAlign: 'right', fontWeight: '800', fontSize: 12 }}>
                البيانات
              </Text>
              <Text style={{ color: colors.white, textAlign: 'right', fontWeight: '900', fontSize: 44, lineHeight: 52 }}>
                {dataLabel(plan)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#bfdbfe', textAlign: 'right', fontWeight: '800', fontSize: 12 }}>
                السعر
              </Text>
              <Text style={{ color: '#00D4A8', textAlign: 'right', fontWeight: '900', fontSize: 28 }}>
                {formatArabicSar(plan.price_halalas)}
              </Text>
            </View>
          </View>
        </View>

        {plan.type !== 'recharge' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>نوع التفعيل</Text>
              <Text style={styles.sectionHint}>اختر المسار</Text>
            </View>
            <View style={[styles.row, { gap: 10 }]}>
              <SimTypeOption
                active={selectedSimType === 'esim'}
                title="eSIM"
                subtitle="تفعيل رقمي بعد اكتمال الطلب"
                onPress={() => setSelectedSimType('esim')}
              />
              <SimTypeOption
                active={selectedSimType === 'physical'}
                title="شريحة فعلية"
                subtitle="تسليم ومعالجة خلال 24 ساعة"
                onPress={() => setSelectedSimType('physical')}
              />
            </View>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>مميزات الباقة</Text>
          <Text style={styles.sectionHint}>قبل الشراء</Text>
        </View>
        <View style={styles.elevatedCard}>
          {features.map((feature, index) => (
            <FeatureRow
              key={feature.title}
              title={feature.title}
              subtitle={feature.subtitle}
              last={index === features.length - 1}
            />
          ))}
        </View>

        <View style={[styles.elevatedCard, { backgroundColor: colors.cardGreen }]}>
          <Text style={styles.cardTitle}>ما بعد الدفع</Text>
          <Text style={styles.cardDesc}>
            ستظهر العملية لفريق العمليات على لوحة الويب، ثم يتم تنفيذها في النظام الخارجي، ثم
            يصلك إشعار عند اكتمال الطلب.
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 18,
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <Pressable
          hitSlop={8}
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: session ? '/checkout/[planId]' : '/sign-in',
              params: session
                ? { planId: plan.id, simType: selectedSimType }
                : { mode: 'up' },
            })
          }
        >
          <Text style={styles.buttonText}>
            {session
              ? `اشترِ الآن - ${formatArabicSar(plan.price_halalas)}`
              : 'أنشئ حسابك للشراء'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SignalBars() {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 3, height: 20 }}>
      {[8, 12, 16, 20].map((height, index) => (
        <View
          key={height}
          style={{
            width: 5,
            height,
            borderRadius: 8,
            backgroundColor: '#00D4A8',
            opacity: 0.5 + index * 0.15,
          }}
        />
      ))}
    </View>
  );
}

function SimTypeOption({
  active,
  title,
  subtitle,
  onPress,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      hitSlop={8}
      onPress={onPress}
      style={[
        styles.elevatedCard,
        {
          flex: 1,
          minHeight: 124,
          backgroundColor: active ? colors.cardBlue : colors.card,
          borderColor: active ? colors.blue : colors.line,
        },
      ]}
    >
      <View style={styles.between}>
        <Text style={[styles.cardTitle, { fontSize: 16 }]}>{title}</Text>
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: active ? colors.blue : colors.lineStrong,
            backgroundColor: active ? colors.blue : 'transparent',
          }}
        />
      </View>
      <Text style={styles.cardDesc}>{subtitle}</Text>
    </Pressable>
  );
}

function FeatureRow({
  title,
  subtitle,
  last,
}: {
  title: string;
  subtitle: string;
  last: boolean;
}) {
  return (
    <View>
      <View style={[styles.row, { gap: 12, alignItems: 'flex-start', paddingVertical: 12 }]}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            backgroundColor: colors.cardGreen,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.teal, fontWeight: '900' }}>✓</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { fontSize: 15 }]}>{title}</Text>
          <Text style={styles.cardDesc}>{subtitle}</Text>
        </View>
      </View>
      {!last && <View style={styles.divider} />}
    </View>
  );
}

function heroColor(type: PlanType): string {
  if (type === 'sim') return colors.navy;
  if (type === 'esim') return '#0f3148';
  return '#2f2410';
}

function dataLabel(plan: Plan): string {
  if (plan.specs?.unlimited === true) return '∞';
  if (plan.specs?.data_gb) return `${plan.specs.data_gb}G`;
  if (plan.specs?.credit_sar) return `${plan.specs.credit_sar}`;
  return 'باقة';
}

function validityLabel(plan: Plan): string {
  return plan.specs?.validity_days ? `${plan.specs.validity_days} يوم` : 'فوري';
}

function planFeatures(plan: Plan, simType: SimChoice) {
  const validity = validityLabel(plan);
  const data = dataLabel(plan);

  if (plan.type === 'recharge') {
    return [
      { title: 'شحن مباشر', subtitle: 'أدخل رقم الجوال في مراجعة الطلب وسيتم تنفيذ الطلب من العمليات.' },
      { title: 'تأكيد دفع موثوق', subtitle: 'الدفع يؤكد من مزود الدفع قبل بدء التنفيذ.' },
      { title: 'تتبع الطلب', subtitle: 'تشاهد حالة الطلب حتى الاكتمال.' },
    ];
  }

  return [
    { title: `${data} بيانات`, subtitle: `صلاحية ${validity} مع شبكة ${String(plan.specs?.network ?? '5G')}.` },
    {
      title: simType === 'esim' ? 'تفعيل eSIM' : 'شريحة فعلية',
      subtitle:
        simType === 'esim'
          ? 'بعد اكتمال الطلب تظهر بيانات التفعيل داخل طلبك.'
          : 'فريق العمليات يتابع التسليم والمعالجة خلال 24 ساعة.',
    },
    { title: 'إشعارات الحالة', subtitle: 'يصلك إشعار عند استلام الطلب وعند اكتماله.' },
    { title: 'فاتورة وسجل', subtitle: 'يبقى الطلب محفوظاً في صفحة طلباتي للرجوع له.' },
  ];
}

function arabicPlanName(plan: Plan): string {
  if (plan.type === 'recharge') {
    const credit = plan.specs?.credit_sar;
    return credit ? `شحن رصيد ${credit} ريال` : 'شحن رصيد';
  }
  if (plan.type === 'sim') {
    const data = plan.specs?.data_gb;
    return data ? `شريحة جديدة ${data} جيجا` : 'شريحة جديدة';
  }
  if (plan.specs?.unlimited === true) return 'باقة eSIM لا محدودة';
  const data = plan.specs?.data_gb;
  return data ? `باقة eSIM ${data} جيجا` : 'باقة eSIM';
}

function arabicPlanDescription(plan: Plan): string {
  if (plan.type === 'recharge') {
    return 'شحن آمن مع متابعة الطلب حتى اكتماله من فريق العمليات.';
  }
  if (plan.type === 'sim') {
    return 'شريحة فعلية أو eSIM مع تجربة شراء واضحة ودون زيارة فرع.';
  }
  return 'eSIM رقمية مع متابعة حالة الطلب وإشعار عند اكتمال التفعيل.';
}
