import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';
import { colors } from '@/theme';

I18nManager.allowRTL(true);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.ink,
            headerTitleAlign: 'center',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="plan/[id]" options={{ title: 'تفاصيل الباقة' }} />
          <Stack.Screen name="checkout/[planId]" options={{ title: 'مراجعة الطلب' }} />
          <Stack.Screen name="sign-in" options={{ title: 'الدخول إلى BeCon', presentation: 'modal' }} />
          <Stack.Screen name="pay/[orderId]" options={{ title: 'الدفع الآمن' }} />
          <Stack.Screen name="order/success/[orderId]" options={{ title: 'تم استلام الطلب', headerShown: false }} />
          <Stack.Screen name="orders" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
