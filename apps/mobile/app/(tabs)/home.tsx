import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { PlanType } from '@becon/shared';
import {
  BrandHeader,
  CarrierRail,
  HeroStat,
  PlanCard,
  SERVICES,
  ServiceTile,
} from '@/components/catalog';
import { useActivePlans } from '@/lib/catalog';
import { useAuth } from '@/lib/auth';
import { colors, styles } from '@/theme';

export default function HomeTab() {
  const router = useRouter();
  const { session } = useAuth();
  const { plans, loading } = useActivePlans();
  const featuredPlans = plans.slice(0, 2);

  function openPlans(type?: PlanType) {
    router.push({ pathname: '/plans', params: type ? { type } : undefined });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: 112 }]}
        showsVerticalScrollIndicator={false}
      >
      <BrandHeader
        actionLabel={session ? 'حسابي' : 'دخول'}
        onAction={() => router.push(session ? '/account' : { pathname: '/sign-in', params: { mode: 'in' } })}
      />

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>تصفح كضيف. ادفع عند القرار.</Text>
        <Text style={styles.heroTitle}>شريحة، eSIM، أو شحن بدون زيارة فرع</Text>
        <Text style={styles.heroText}>
          اختر الخدمة، شاهد السعر بوضوح، ثم أنشئ حسابك عند الشراء فقط. كل طلب له تتبع وإشعار حتى يكتمل خلال 24 ساعة.
        </Text>
        <View style={styles.heroStats}>
          <HeroStat value="24س" label="معالجة الطلب" />
          <HeroStat value="آمن" label="دفع وتأكيد" />
          <HeroStat value="RTL" label="عربي أولا" />
        </View>
        <View style={[styles.row, { gap: 10, marginTop: 18 }]}>
          <Pressable hitSlop={8} style={[styles.button, { flex: 1, marginTop: 0 }]} onPress={() => openPlans()}>
            <Text style={styles.buttonText}>تصفح الباقات</Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            style={[styles.button, styles.buttonGhost, { flex: 1, marginTop: 0 }]}
            onPress={() => router.push(session ? '/my-orders' : { pathname: '/sign-in', params: { mode: 'up' } })}
          >
            <Text style={styles.buttonGhostText}>{session ? 'تتبع طلباتي' : 'إنشاء حساب'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>اختصر طريقك</Text>
        <Text style={styles.sectionHint}>٣ خدمات</Text>
      </View>
      <View style={[styles.row, { gap: 10, marginBottom: 6 }]}>
        {SERVICES.map((service) => (
          <ServiceTile
            key={service.type}
            active={false}
            title={service.title}
            text={service.text}
            accent={service.accent}
            onPress={() => openPlans(service.type)}
          />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>كيف يمشي الطلب؟</Text>
        <Text style={styles.sectionHint}>واضح من البداية</Text>
      </View>
      <View style={styles.elevatedCard}>
        <FlowStep number="1" title="اختر الباقة" subtitle="شاهد السعر والمزايا قبل إنشاء الحساب." />
        <View style={styles.divider} />
        <FlowStep number="2" title="ادفع بأمان" subtitle="يتم الدفع عبر Moyasar، ثم يبدأ فريق العمليات." />
        <View style={styles.divider} />
        <FlowStep number="3" title="تابع الحالة" subtitle="يصلك إشعار عند اكتمال الطلب خلال 24 ساعة." />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>مشغلون وعروض</Text>
        <Text style={styles.sectionHint}>جاهز للشراكات</Text>
      </View>
      <CarrierRail />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>مختارات اليوم</Text>
        <Text style={styles.sectionHint}>افتح الباقات للمزيد</Text>
      </View>
      {loading ? (
        <View style={styles.elevatedCard}>
          <ActivityIndicator color={colors.orange} />
          <Text style={[styles.cardDesc, { textAlign: 'center' }]}>جاري تحميل الباقات...</Text>
        </View>
      ) : (
        featuredPlans.map((plan, index) => <PlanCard key={plan.id} plan={plan} featured={index === 0} />)
      )}
      {!loading && featuredPlans.length === 0 && (
        <View style={styles.elevatedCard}>
          <Text style={styles.cardTitle}>الكتالوج فارغ حاليا</Text>
          <Text style={styles.cardDesc}>أضف الباقات من لوحة العمليات لتظهر هنا وفي صفحة الباقات.</Text>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FlowStep({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={[styles.row, { gap: 12, alignItems: 'flex-start', paddingVertical: 6 }]}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          backgroundColor: colors.cardBlue,
          borderWidth: 1,
          borderColor: 'rgba(27,107,255,0.28)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.blue, fontSize: 14, fontWeight: '900' }}>{number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { fontSize: 15 }]}>{title}</Text>
        <Text style={styles.cardDesc}>{subtitle}</Text>
      </View>
    </View>
  );
}
