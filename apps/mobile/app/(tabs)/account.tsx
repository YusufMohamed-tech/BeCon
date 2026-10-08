import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors, styles } from '@/theme';

export default function AccountTab() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const email = session?.user?.email;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: 112 }]}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>حساب BeCon</Text>
        <Text style={styles.heroTitle}>
          {session ? 'كل عملياتك محفوظة في مكان واحد' : 'ادخل كضيف أو أنشئ حسابا عند الشراء'}
        </Text>
        <Text style={styles.heroText}>
          {session
            ? 'يمكنك تتبع الطلبات، استقبال الإشعارات، والرجوع لسجل العمليات بعد اكتمالها.'
            : 'التصفح متاح بدون حساب. عند الدفع سنطلب إنشاء حساب حتى نحفظ الطلب ونرسل الإشعارات.'}
        </Text>
      </View>

      {session ? (
        <>
          <View style={styles.elevatedCard}>
            <View style={styles.between}>
              <View>
                <Text style={styles.cardDesc}>مسجل الدخول</Text>
                <Text style={styles.cardTitle}>{email ?? 'حساب BeCon'}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: colors.teal, borderColor: colors.teal }]}>
                <Text style={styles.chipText}>نشط</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <AccountRow title="طلباتي" subtitle="تابع حالة الدفع والمعالجة والاكتمال." />
            <View style={styles.divider} />
            <AccountRow title="الإشعارات" subtitle="يصلك تحديث عند اكتمال الطلب أو الحاجة لإجراء." />
            <View style={styles.divider} />
            <AccountRow title="الدفع" subtitle="المدفوعات تتم عبر Moyasar بدون حفظ بيانات البطاقة في BeCon." />
          </View>

          <Pressable hitSlop={8} style={styles.button} onPress={() => router.push('/my-orders')}>
            <Text style={styles.buttonText}>عرض طلباتي</Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            style={[styles.button, styles.buttonGhost]}
            onPress={async () => {
              await signOut();
              router.replace('/');
            }}
          >
            <Text style={styles.buttonGhostText}>تسجيل الخروج</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.elevatedCard}>
            <AccountRow title="تصفح كضيف" subtitle="شاهد الخطط والأسعار بدون إنشاء حساب." />
            <View style={styles.divider} />
            <AccountRow title="حساب عند الشراء" subtitle="نطلب الحساب فقط عند الدفع وحفظ الطلب." />
            <View style={styles.divider} />
            <AccountRow title="Google جاهز للتفعيل" subtitle="واجهة المسار موجودة وتحتاج ربط OAuth من Supabase." />
          </View>

          <Pressable
            hitSlop={8}
            style={styles.button}
            onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'in' } })}
          >
            <Text style={styles.buttonText}>تسجيل الدخول</Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            style={[styles.button, { backgroundColor: colors.teal }]}
            onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'up' } })}
          >
            <Text style={[styles.buttonText, { color: '#07111D' }]}>إنشاء حساب</Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            style={[styles.button, styles.buttonGhost]}
            onPress={() => router.push('/plans')}
          >
            <Text style={styles.buttonGhostText}>متابعة كضيف</Text>
          </Pressable>
        </>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={[styles.row, { gap: 12, alignItems: 'flex-start', paddingVertical: 4 }]}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          backgroundColor: colors.cardBlue,
          borderWidth: 1,
          borderColor: 'rgba(27,107,255,0.28)',
          marginTop: 2,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { fontSize: 15 }]}>{title}</Text>
        <Text style={styles.cardDesc}>{subtitle}</Text>
      </View>
    </View>
  );
}
