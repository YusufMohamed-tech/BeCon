import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import type { OrderStatus } from '@becon/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { colors, formatArabicSar, styles } from '@/theme';

type OrderRow = {
  id: string;
  status: OrderStatus;
  amount_halalas: number;
  created_at: string;
  sla_due_at: string | null;
  plans: { name_en: string; name_ar?: string | null; type?: string; specs?: Record<string, unknown> } | null;
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  created: 'تم إنشاء الطلب',
  awaiting_payment: 'بانتظار الدفع',
  paid: 'تم الدفع',
  processing: 'قيد المعالجة',
  awaiting_user_action: 'مطلوب إجراء منك',
  completed: 'مكتمل',
  payment_failed: 'فشل الدفع',
  refunding: 'جاري الاسترداد',
  refunded: 'تم الاسترداد',
  cancelled: 'ملغي',
};

const STATUS_HELP: Record<OrderStatus, string> = {
  created: 'لم يبدأ الدفع بعد.',
  awaiting_payment: 'أكمل الدفع حتى يبدأ فريق العمليات.',
  paid: 'وصل الدفع. سيبدأ الفريق معالجة الطلب.',
  processing: 'فريق العمليات ينفذ الطلب في النظام الخارجي.',
  awaiting_user_action: 'نحتاج منك معلومة إضافية لإكمال الطلب.',
  completed: 'تم تنفيذ الطلب وإغلاقه بنجاح.',
  payment_failed: 'لم يتم تأكيد الدفع. يمكنك إعادة المحاولة.',
  refunding: 'الفريق المالي يعالج الاسترداد.',
  refunded: 'تم إرجاع المبلغ حسب طريقة الدفع.',
  cancelled: 'تم إلغاء الطلب.',
};

export default function MyOrdersTab() {
  const router = useRouter();
  const { session } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('orders')
      .select('id, status, amount_halalas, created_at, sla_due_at, plans(name_en, name_ar, type, specs)')
      .order('created_at', { ascending: false })
      .returns<OrderRow[]>();
    setOrders(data ?? []);
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      setLoading(Boolean(session));
      loadOrders();
    }, [loadOrders, session]),
  );

  async function refresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={[styles.container, { flex: 1, justifyContent: 'center', paddingBottom: 112 }]}>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>تتبع الطلبات</Text>
            <Text style={styles.heroTitle}>سجل دخولك لحفظ كل عملية</Text>
            <Text style={styles.heroText}>
              التصفح متاح كضيف، لكن تتبع الطلبات والإشعارات يحتاجان حسابا حتى لا تضيع أي عملية بعد الدفع.
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            style={styles.button}
            onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'up' } })}
          >
            <Text style={styles.buttonText}>إنشاء حساب أو دخول</Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            style={[styles.button, styles.buttonGhost]}
            onPress={() => router.push('/plans')}
          >
            <Text style={styles.buttonGhostText}>تصفح الباقات</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator color={colors.orange} size="large" />
        <Text style={[styles.cardDesc, { marginTop: 12 }]}>جاري تحميل طلباتك...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        contentContainerStyle={[styles.container, { paddingBottom: 112 }]}
        data={orders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.orange} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>تتبع الطلبات</Text>
              <Text style={styles.heroTitle}>لا يوجد طلب يضيع بعد الدفع</Text>
              <Text style={styles.heroText}>
                كل طلب يظهر لفريق العمليات، وكل حالة لها معنى واضح. اسحب لتحديث الحالة في أي وقت.
              </Text>
              <View style={styles.heroStats}>
                <HeroStat value={`${orders.length}`} label="طلب" />
                <HeroStat value={`${orders.filter((o) => o.status === 'completed').length}`} label="مكتمل" />
                <HeroStat value="24س" label="SLA" />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.elevatedCard}>
            <Text style={styles.cardTitle}>لا توجد طلبات بعد</Text>
            <Text style={styles.cardDesc}>
              ابدأ من الباقات، اختر شريحة أو eSIM أو شحن، وبعد الدفع سيظهر الطلب هنا بتتبع كامل.
            </Text>
            <Pressable hitSlop={8} style={styles.button} onPress={() => router.push('/plans')}>
              <Text style={styles.buttonText}>تصفح الباقات</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </SafeAreaView>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const progress = progressForStatus(order.status);
  const date = new Date(order.created_at).toLocaleDateString('ar-SA');
  const isRisk = order.status === 'payment_failed' || order.status === 'cancelled';

  return (
    <View style={[styles.elevatedCard, isRisk && { borderColor: colors.danger }]}>
      <View style={styles.between}>
        <View style={[styles.chip, statusColor(order.status)]}>
          <Text style={styles.chipText}>{STATUS_LABEL[order.status]}</Text>
        </View>
        <Text style={styles.price}>{formatArabicSar(order.amount_halalas)}</Text>
      </View>

      <Text style={[styles.cardTitle, { marginTop: 14 }]}>
        {order.plans?.name_ar ?? order.plans?.name_en ?? 'طلب BeCon'}
      </Text>
      <Text style={styles.cardDesc}>تاريخ الطلب: {date}</Text>
      <Text style={styles.cardDesc}>{STATUS_HELP[order.status]}</Text>

      <View style={{ marginTop: 16 }}>
        <View style={[styles.row, { gap: 6 }]}>
          {[0, 1, 2, 3].map((step) => (
            <View
              key={step}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 8,
                backgroundColor: step <= progress ? colors.teal : colors.line,
              }}
            />
          ))}
        </View>
        <View style={[styles.between, { marginTop: 8 }]}>
          <Text style={[styles.cardDesc, { fontSize: 11 }]}>إنشاء</Text>
          <Text style={[styles.cardDesc, { fontSize: 11 }]}>دفع</Text>
          <Text style={[styles.cardDesc, { fontSize: 11 }]}>معالجة</Text>
          <Text style={[styles.cardDesc, { fontSize: 11 }]}>اكتمال</Text>
        </View>
      </View>

      <View
        style={[
          styles.compactCard,
          { backgroundColor: order.status === 'completed' ? colors.cardGreen : colors.cardBlue, marginTop: 14 },
        ]}
      >
        <Text style={[styles.cardTitle, { fontSize: 15 }]}>
          {order.status === 'completed' ? 'تم إغلاق الطلب' : 'الموعد المتوقع'}
        </Text>
        <Text style={styles.cardDesc}>
          {order.status === 'completed'
            ? 'تم تنفيذ الطلب بنجاح. يمكنك الاحتفاظ بالفاتورة والرجوع لهذا السجل.'
            : 'خلال 24 ساعة من تأكيد الدفع. إذا حدث تأخير، يظهر كتنبيه لفريق العمليات.'}
        </Text>
      </View>
    </View>
  );
}

function progressForStatus(status: OrderStatus): number {
  if (status === 'completed' || status === 'refunded') return 3;
  if (status === 'processing' || status === 'awaiting_user_action' || status === 'refunding') return 2;
  if (status === 'paid') return 1;
  return 0;
}

function statusColor(status: OrderStatus) {
  if (status === 'completed') return { backgroundColor: colors.success, borderColor: colors.success };
  if (status === 'payment_failed' || status === 'cancelled') return { backgroundColor: colors.danger, borderColor: colors.danger };
  if (status === 'processing' || status === 'paid') return { backgroundColor: colors.teal, borderColor: colors.teal };
  if (status === 'awaiting_user_action') return { backgroundColor: colors.warning, borderColor: colors.warning };
  return { backgroundColor: colors.cardSoft, borderColor: colors.line };
}
