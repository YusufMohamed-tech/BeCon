import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Plan } from '@becon/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { colors, formatArabicSar, styles } from '@/theme';

type PaymentMethod = 'card' | 'applepay' | 'stcpay';

const PAYMENT_METHODS: Array<{
  value: PaymentMethod;
  title: string;
  subtitle: string;
}> = [
  {
    value: 'card',
    title: 'بطاقة ائتمان / مدى',
    subtitle: 'Visa، Mastercard، Mada',
  },
  {
    value: 'applepay',
    title: 'Apple Pay',
    subtitle: 'دفع سريع وآمن على أجهزة Apple',
  },
  {
    value: 'stcpay',
    title: 'STC Pay',
    subtitle: 'محفظة رقمية مناسبة للسوق السعودي',
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { planId, simType } = useLocalSearchParams<{ planId: string; simType?: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [targetNumber, setTargetNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace({ pathname: '/sign-in', params: { mode: 'up' } });
      return;
    }

    supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()
      .then(({ data }) => {
        setPlan(data as Plan);
        setLoading(false);
      });
  }, [planId, router, session]);

  async function submitOrder() {
    if (!plan) return;

    if (plan.type === 'recharge' && targetNumber.trim().length < 9) {
      Alert.alert('رقم الجوال مطلوب', 'أدخل الرقم المراد شحنه قبل الدفع.');
      return;
    }

    if (simType === 'physical' && deliveryAddress.trim().length < 8) {
      Alert.alert('عنوان التوصيل مطلوب', 'أدخل عنواناً واضحاً لتسليم الشريحة الفعلية.');
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('create-order', {
      body: {
        plan_id: plan.id,
        target_msisdn: plan.type === 'recharge' ? targetNumber.trim() : undefined,
        delivery:
          simType === 'physical'
            ? { address: deliveryAddress.trim(), method: 'physical_sim', payment_method: paymentMethod }
            : { method: simType ?? plan.type, payment_method: paymentMethod },
      },
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('تعذر إنشاء الطلب', error.message);
      return;
    }

    router.push({
      pathname: '/pay/[orderId]',
      params: {
        orderId: data.order_id,
        amount: String(data.amount_halalas),
        pk: data.moyasar_publishable_key ?? '',
      },
    });
  }

  if (loading || !plan) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.orange} size="large" />
        <Text style={[styles.cardDesc, { marginTop: 12 }]}>جاري تجهيز مراجعة الطلب...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>مراجعة الطلب</Text>
        <Text style={styles.heroTitle}>راجع طلبك قبل الدفع</Text>
        <Text style={styles.heroText}>
          اختر طريقة الدفع وتأكد من بيانات الطلب. بعد الدفع سيظهر الطلب مباشرة لفريق العمليات.
        </Text>
      </View>

      <View style={styles.elevatedCard}>
        <View style={styles.between}>
          <View>
            <Text style={styles.cardDesc}>ملخص الطلب</Text>
            <Text style={styles.cardTitle}>{arabicPlanName(plan)}</Text>
          </View>
          <Text style={styles.price}>{formatArabicSar(plan.price_halalas)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.row, { gap: 8, flexWrap: 'wrap' }]}>
          <SummaryChip text={plan.type === 'recharge' ? 'شحن' : simType === 'physical' ? 'شريحة فعلية' : 'eSIM'} />
          <SummaryChip text={plan.specs?.validity_days ? `${plan.specs.validity_days} يوم` : 'فوري'} />
          <SummaryChip text={String(plan.specs?.network ?? '5G')} />
        </View>
      </View>

      {plan.type === 'recharge' && (
        <View style={styles.elevatedCard}>
          <Text style={styles.cardTitle}>رقم الجوال</Text>
          <Text style={styles.cardDesc}>هذا الرقم هو الذي سيتم شحنه من فريق العمليات.</Text>
          <TextInput
            style={styles.input}
            value={targetNumber}
            onChangeText={setTargetNumber}
            keyboardType="phone-pad"
            placeholder="05xxxxxxxx"
            placeholderTextColor={colors.muted}
          />
        </View>
      )}

      {simType === 'physical' && (
        <View style={styles.elevatedCard}>
          <Text style={styles.cardTitle}>عنوان التوصيل</Text>
          <Text style={styles.cardDesc}>أدخل عنواناً واضحاً لتسليم الشريحة الفعلية.</Text>
          <TextInput
            style={[styles.input, { minHeight: 86, textAlignVertical: 'top' }]}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
            placeholder="المدينة، الحي، الشارع، أي ملاحظات مهمة"
            placeholderTextColor={colors.muted}
          />
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>طريقة الدفع</Text>
        <Text style={styles.sectionHint}>اختر واحدة</Text>
      </View>
      <View style={styles.elevatedCard}>
        {PAYMENT_METHODS.map((method, index) => (
          <PaymentOption
            key={method.value}
            title={method.title}
            subtitle={method.subtitle}
            active={paymentMethod === method.value}
            last={index === PAYMENT_METHODS.length - 1}
            onPress={() => setPaymentMethod(method.value)}
          />
        ))}
      </View>

      <View style={[styles.elevatedCard, { backgroundColor: colors.cardGreen }]}>
        <Text style={styles.cardTitle}>حماية العملية</Text>
        <Text style={styles.cardDesc}>
          إذا تم الدفع ولم يصل الرجوع من بوابة الدفع، سيقوم النظام بمطابقة العملية من مزود الدفع
          حتى لا يبقى الطلب معلقاً.
        </Text>
      </View>

      <Pressable
        hitSlop={8}
        style={[styles.button, submitting && { opacity: 0.7 }]}
        onPress={submitOrder}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? 'جاري تجهيز الدفع...' : `تأكيد الدفع - ${formatArabicSar(plan.price_halalas)}`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function SummaryChip({ text }: { text: string }) {
  return (
    <View style={[styles.softChip, { backgroundColor: colors.cardBlue, borderColor: '#bfdbfe' }]}>
      <Text style={[styles.softChipText, { color: colors.blue }]}>{text}</Text>
    </View>
  );
}

function PaymentOption({
  title,
  subtitle,
  active,
  last,
  onPress,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <View>
      <Pressable hitSlop={8} onPress={onPress} style={[styles.row, { gap: 12, paddingVertical: 14 }]}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: active ? colors.blue : colors.lineStrong,
            backgroundColor: active ? colors.blue : 'transparent',
          }}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { fontSize: 15 }]}>{title}</Text>
          <Text style={styles.cardDesc}>{subtitle}</Text>
        </View>
      </Pressable>
      {!last && <View style={styles.divider} />}
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
  if (plan.specs?.unlimited === true) return 'باقة eSIM لا محدودة';
  const data = plan.specs?.data_gb;
  return data ? `باقة eSIM ${data} جيجا` : 'باقة eSIM';
}
