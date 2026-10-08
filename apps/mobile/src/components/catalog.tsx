import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { Plan, PlanType } from '@becon/shared';
import { colors, formatArabicSar, styles } from '@/theme';

export const FILTERS: Array<{ type: PlanType | 'all'; label: string }> = [
  { type: 'all', label: 'الكل' },
  { type: 'sim', label: 'شريحة' },
  { type: 'esim', label: 'eSIM' },
  { type: 'recharge', label: 'شحن' },
];

export const SERVICES: Array<{
  type: PlanType;
  title: string;
  text: string;
  accent: string;
}> = [
  {
    type: 'sim',
    title: 'شراء شريحة',
    text: 'طلب شريحة فعلية مع متابعة حتى الاكتمال',
    accent: colors.blue,
  },
  {
    type: 'esim',
    title: 'شراء eSIM',
    text: 'تفعيل رقمي وتسليم بيانات eSIM داخل الطلب',
    accent: colors.teal,
  },
  {
    type: 'recharge',
    title: 'شحن باقة',
    text: 'أدخل رقمك واختر قيمة الشحن المناسبة',
    accent: colors.orange,
  },
];

export const CARRIERS = ['STC', 'Mobily', 'Zain', 'Virgin', 'Yaqoot'];

const TYPE_LABEL: Record<PlanType, string> = {
  sim: 'شريحة',
  esim: 'eSIM',
  recharge: 'شحن',
};

export function BrandHeader({
  actionLabel,
  onAction,
}: {
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <View style={styles.brandLockup}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>B</Text>
        </View>
        <View>
          <Text style={styles.brandName}>BeCon</Text>
          <Text style={styles.brandSub}>سوق الاتصالات الذكي</Text>
        </View>
      </View>
      <Pressable hitSlop={10} style={styles.softChip} onPress={onAction}>
        <Text style={styles.softChipText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

export function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ServiceTile({
  active,
  title,
  text,
  accent,
  onPress,
}: {
  active: boolean;
  title: string;
  text: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      hitSlop={8}
      onPress={onPress}
      style={[styles.serviceTile, active && styles.serviceTileActive]}
    >
      <View style={[styles.serviceAccent, { backgroundColor: accent }]} />
      <Text style={[styles.cardTitle, { fontSize: 15 }, active && { color: colors.white }]}>
        {title}
      </Text>
      <Text style={[styles.cardDesc, { fontSize: 12 }, active && { color: '#CBD6EA' }]}>
        {text}
      </Text>
    </Pressable>
  );
}

export function CarrierRail() {
  return (
    <View style={[styles.row, { gap: 10, flexWrap: 'wrap' }]}>
      {CARRIERS.map((carrier, index) => (
        <View
          key={carrier}
          style={[
            styles.compactCard,
            {
              minWidth: 104,
              backgroundColor: index % 2 === 0 ? colors.cardBlue : colors.cardWarm,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { fontSize: 15, textAlign: 'left' }]}>{carrier}</Text>
          <Text style={[styles.cardDesc, { textAlign: 'left' }]}>باقات مختارة</Text>
        </View>
      ))}
    </View>
  );
}

export function PlanCard({ plan, featured }: { plan: Plan; featured?: boolean }) {
  const dataGb = plan.specs?.data_gb;
  const validity = plan.specs?.validity_days;
  const isUnlimited = plan.specs?.unlimited === true;
  const dataLabel = isUnlimited ? 'لا محدود' : dataGb ? `${dataGb} جيجا` : 'حسب الباقة';
  const validityLabel = validity ? `${validity} يوم` : 'فوري';

  return (
    <Link href={`/plan/${plan.id}`} asChild>
      <Pressable hitSlop={6} style={styles.elevatedCard}>
        {featured && (
          <View
            style={{
              backgroundColor: colors.blue,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              marginHorizontal: -18,
              marginTop: -18,
              marginBottom: 14,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: '900' }}>
              الأكثر طلبا
            </Text>
          </View>
        )}
        <View style={styles.between}>
          <View style={[styles.row, { gap: 8 }]}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{TYPE_LABEL[plan.type]}</Text>
            </View>
            <SignalBars />
          </View>
          <View style={[styles.softChip, { backgroundColor: colors.cardGreen, borderColor: 'rgba(0,212,168,0.24)' }]}>
            <Text style={[styles.softChipText, { color: colors.teal }]}>تتبع حتى الاكتمال</Text>
          </View>
        </View>

        <Text style={[styles.cardTitle, { marginTop: 14, fontSize: 20 }]}>
          {arabicPlanName(plan)}
        </Text>
        <Text style={styles.cardDesc}>{arabicPlanDescription(plan)}</Text>

        <View style={[styles.row, { gap: 8, marginTop: 14 }]}>
          <Spec label="البيانات" value={dataLabel} />
          <Spec label="الصلاحية" value={validityLabel} />
          <Spec label="الشبكة" value={String(plan.specs?.network ?? '5G')} />
        </View>

        <View style={styles.divider} />

        <View style={styles.between}>
          <View>
            <Text style={styles.price}>{formatArabicSar(plan.price_halalas)}</Text>
            <Text style={[styles.cardDesc, { marginTop: 0 }]}>شامل الضريبة حسب الفاتورة</Text>
          </View>
          <View style={[styles.button, styles.buttonBlue, { marginTop: 0, minHeight: 46, paddingHorizontal: 14 }]}>
            <Text style={styles.buttonText}>التفاصيل</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export function EmptyPlans() {
  return (
    <View style={styles.elevatedCard}>
      <Text style={styles.cardTitle}>لا توجد باقات حاليا</Text>
      <Text style={styles.cardDesc}>
        غير نوع الخدمة أو جرب لاحقا بعد تحديث الكتالوج من لوحة العمليات.
      </Text>
    </View>
  );
}

function SignalBars() {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 3, height: 18 }}>
      {[8, 11, 14, 17].map((height, index) => (
        <View
          key={height}
          style={{
            width: 4,
            height,
            borderRadius: 6,
            backgroundColor: colors.blue,
            opacity: 0.45 + index * 0.16,
          }}
        />
      ))}
    </View>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.compactCard, { flex: 1, padding: 10, backgroundColor: colors.cardSoft }]}>
      <Text style={[styles.cardDesc, { marginTop: 0, fontSize: 11 }]}>{label}</Text>
      <Text style={[styles.cardTitle, { fontSize: 13, marginTop: 2 }]}>{value}</Text>
    </View>
  );
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
  const unlimited = plan.specs?.unlimited === true;
  const data = plan.specs?.data_gb;
  return unlimited ? 'باقة eSIM لا محدودة' : data ? `باقة eSIM ${data} جيجا` : 'باقة eSIM';
}

function arabicPlanDescription(plan: Plan): string {
  if (plan.type === 'recharge') {
    return 'اشحن رقمك ونتابع الطلب حتى يكتمل من فريق العمليات.';
  }
  if (plan.type === 'sim') {
    return 'شريحة فعلية مع متابعة حالة الطلب وإشعار عند الاكتمال.';
  }
  return 'باقة رقمية مع تسليم بيانات التفعيل بعد اكتمال المعالجة.';
}
