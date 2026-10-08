import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function WelcomeScreen() {
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      router.replace('/home');
    }
  }, [router, session]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0A0E1A',
        paddingHorizontal: 24,
        paddingVertical: 38,
        justifyContent: 'center',
      }}
    >
      <StatusBar style="light" />

      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 118,
            height: 118,
            borderRadius: 34,
            backgroundColor: '#111827',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: '#F5F7FF',
              fontSize: 33,
              fontWeight: '900',
              writingDirection: 'ltr',
            }}
          >
            Be<Text style={{ color: '#1B6BFF' }}>C</Text>on
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(0,212,168,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(0,212,168,0.24)',
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            marginBottom: 18,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              backgroundColor: '#00D4A8',
            }}
          />
          <Text style={{ color: '#B8FFF0', fontSize: 12, fontWeight: '800' }}>
            خطط نشطة الآن
          </Text>
        </View>

        <Text
          style={{
            color: '#F5F7FF',
            fontSize: 31,
            lineHeight: 39,
            fontWeight: '900',
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          ابدأ رحلتك مع BeCon
        </Text>
        <Text
          style={{
            color: '#8892B0',
            fontSize: 14,
            lineHeight: 23,
            textAlign: 'center',
            writingDirection: 'rtl',
            marginTop: 12,
            marginBottom: 30,
          }}
        >
          سجل الدخول، أنشئ حسابك، أو ادخل كضيف لتصفح شرائح SIM و eSIM وباقات الشحن قبل الشراء.
        </Text>

        <View style={{ width: '100%', gap: 12 }}>
          <Pressable
            hitSlop={8}
            style={{
              minHeight: 54,
              borderRadius: 14,
              backgroundColor: '#1B6BFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'in' } })}
          >
            <Text style={{ color: '#F5F7FF', fontSize: 15, fontWeight: '900' }}>
              تسجيل الدخول
            </Text>
          </Pressable>

          <Pressable
            hitSlop={8}
            style={{
              minHeight: 54,
              borderRadius: 14,
              backgroundColor: '#00D4A8',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'up' } })}
          >
            <Text style={{ color: '#07111D', fontSize: 15, fontWeight: '900' }}>
              إنشاء حساب
            </Text>
          </Pressable>

          <Pressable
            hitSlop={8}
            style={{
              minHeight: 54,
              borderRadius: 14,
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => router.replace('/home')}
          >
            <Text style={{ color: '#F5F7FF', fontSize: 15, fontWeight: '900' }}>
              الدخول كضيف
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
