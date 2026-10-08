import { Pressable, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, styles } from '@/theme';

const TRACKER_STEPS = [
  {
    title: 'تم استلام الطلب',
    subtitle: 'وصل الطلب إلى نظام BeCon بعد الدفع.',
    state: 'done',
  },
  {
    title: 'قيد المعالجة',
    subtitle: 'فريق العمليات ينفذ الطلب في النظام الخارجي.',
    state: 'active',
  },
  {
    title: 'تم التفعيل',
    subtitle: 'يصلك إشعار عند اكتمال الطلب.',
    state: 'pending',
  },
] as const;

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const shortOrderId = orderId ? `BEC-${orderId.slice(0, 8).toUpperCase()}` : 'BEC';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.container, { flexGrow: 1, justifyContent: 'center' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: 22 }}>
          <View
            style={{
              width: 104,
              height: 104,
              borderRadius: 32,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.white, fontSize: 29, fontWeight: '900', writingDirection: 'ltr' }}>
              Be<Text style={{ color: colors.blue }}>C</Text>on
            </Text>
          </View>

          <View
            style={{
              width: 78,
              height: 78,
              borderRadius: 999,
              backgroundColor: colors.cardGreen,
              borderWidth: 1,
              borderColor: 'rgba(0,212,168,0.28)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Text style={{ color: colors.teal, fontSize: 38, fontWeight: '900' }}>✓</Text>
          </View>

          <View style={[styles.softChip, { backgroundColor: colors.cardBlue, borderColor: 'rgba(27,107,255,0.28)' }]}>
            <Text style={[styles.softChipText, { color: '#9FC0FF' }]}>تم إنشاء الطلب بنجاح</Text>
          </View>

          <Text style={[styles.heroTitle, { textAlign: 'center', marginTop: 18 }]}>
            طلبك قيد المعالجة
          </Text>
          <Text style={[styles.heroText, { textAlign: 'center', marginBottom: 0 }]}>
            تم استلام الدفع والطلب. سيتم تنفيذ طلبك خلال 24 ساعة، وسيصلك إشعار فور اكتماله من فريق العمليات.
          </Text>
        </View>

        <View style={styles.elevatedCard}>
          <View style={styles.between}>
            <View>
              <Text style={styles.cardDesc}>رقم الطلب</Text>
              <Text style={styles.cardTitle}>{shortOrderId}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.blue, borderColor: colors.blue }]}>
              <Text style={styles.chipText}>24 ساعة</Text>
            </View>
          </View>
          <View style={styles.divider} />
          {TRACKER_STEPS.map((step, index) => (
            <TrackerStep
              key={step.title}
              title={step.title}
              subtitle={step.subtitle}
              state={step.state}
              last={index === TRACKER_STEPS.length - 1}
            />
          ))}
        </View>

        <View style={[styles.elevatedCard, { backgroundColor: colors.cardGreen }]}>
          <Text style={styles.cardTitle}>ماذا يحدث الآن؟</Text>
          <Text style={styles.cardDesc}>
            يظهر الطلب الآن في لوحة العمليات على الويب. بعد تنفيذ الطلب في النظام الخارجي، يتم تحديث الحالة إلى مكتمل ويصلك إشعار.
          </Text>
        </View>

        <View style={[styles.row, { gap: 10 }]}>
          <Pressable
            hitSlop={8}
            style={[styles.button, styles.buttonBlue, { flex: 1 }]}
            onPress={() => router.replace('/my-orders')}
          >
            <Text style={styles.buttonText}>تتبع الطلب</Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            style={[styles.button, styles.buttonGhost, { flex: 1 }]}
            onPress={() => router.replace('/home')}
          >
            <Text style={styles.buttonGhostText}>الرئيسية</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function TrackerStep({
  title,
  subtitle,
  state,
  last,
}: {
  title: string;
  subtitle: string;
  state: 'done' | 'active' | 'pending';
  last: boolean;
}) {
  const active = state !== 'pending';
  const dotColor = state === 'done' ? colors.teal : state === 'active' ? colors.blue : colors.lineStrong;

  return (
    <View>
      <View style={[styles.row, { gap: 12, alignItems: 'flex-start', paddingVertical: 12 }]}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              backgroundColor: active ? dotColor : colors.cardSoft,
              borderWidth: 1,
              borderColor: dotColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: active ? colors.white : colors.muted, fontSize: 13, fontWeight: '900' }}>
              {state === 'done' ? '✓' : state === 'active' ? '2' : '3'}
            </Text>
          </View>
          {!last && <View style={{ width: 2, height: 34, backgroundColor: colors.line, marginTop: 4 }} />}
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
