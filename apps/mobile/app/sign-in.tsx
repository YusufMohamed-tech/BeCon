import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors, styles } from '@/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (requestedMode === 'in' || requestedMode === 'up') {
      setMode(requestedMode);
    }
  }, [requestedMode]);

  async function submit() {
    setLoading(true);
    setError(null);
    const result =
      mode === 'in'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, fullName);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace('/home');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>حساب BeCon</Text>
        <Text style={styles.heroTitle}>
          {mode === 'in' ? 'مرحباً بعودتك' : 'أنشئ حسابك لإكمال الطلب'}
        </Text>
        <Text style={styles.heroText}>
          التصفح متاح كضيف، لكن الدفع وتتبع الطلب والإشعارات تحتاج حساباً حتى لا تضيع أي
          عملية بعد الشراء.
        </Text>
      </View>

      <View style={styles.navDock}>
        <Pressable
          hitSlop={8}
          style={[styles.navItem, mode === 'up' && styles.navItemActive]}
          onPress={() => setMode('up')}
        >
          <Text style={[styles.navText, mode === 'up' && { color: colors.white }]}>إنشاء حساب</Text>
        </Pressable>
        <Pressable
          hitSlop={8}
          style={[styles.navItem, mode === 'in' && styles.navItemActive]}
          onPress={() => setMode('in')}
        >
          <Text style={[styles.navText, mode === 'in' && { color: colors.white }]}>تسجيل الدخول</Text>
        </Pressable>
      </View>

      <Pressable
        hitSlop={8}
        style={[styles.elevatedCard, { backgroundColor: colors.cardBlue }]}
        onPress={() =>
          Alert.alert(
            'تسجيل Google',
            'الواجهة جاهزة، لكن يجب تفعيل Google OAuth من Supabase وربطه بتطبيق Expo قبل الاختبار الحقيقي.',
          )
        }
      >
        <Text style={styles.cardTitle}>المتابعة بحساب Google</Text>
        <Text style={styles.cardDesc}>مسار سريع للمستخدمين الجدد عند تفعيل OAuth.</Text>
      </Pressable>

      <View style={styles.elevatedCard}>
        {mode === 'up' && (
          <>
            <Text style={styles.label}>الاسم الكامل</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="اكتب اسمك"
              placeholderTextColor={colors.muted}
            />
          </>
        )}

        <Text style={styles.label}>البريد الإلكتروني</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="name@example.com"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>كلمة المرور</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
        />

        <Pressable
          hitSlop={8}
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'جاري المعالجة...' : mode === 'in' ? 'دخول' : 'إنشاء الحساب'}
          </Text>
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <Pressable
        hitSlop={8}
        style={[styles.button, styles.buttonGhost, { marginTop: 2 }]}
        onPress={() => router.replace('/home')}
      >
        <Text style={styles.buttonGhostText}>الدخول كضيف وتصفح الباقات</Text>
      </Pressable>
    </ScrollView>
  );
}
