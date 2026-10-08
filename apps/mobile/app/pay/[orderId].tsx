import { useMemo, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { colors, formatArabicSar, styles } from '@/theme';

export default function PayScreen() {
  const router = useRouter();
  const { orderId, amount, pk } = useLocalSearchParams<{
    orderId: string;
    amount: string;
    pk: string;
  }>();
  const callbackHandled = useRef(false);

  const amountHalalas = Number(amount);
  const html = useMemo(
    () => buildMoyasarHtml(orderId, amountHalalas, pk),
    [orderId, amountHalalas, pk],
  );

  function handleNavChange(nav: WebViewNavigation) {
    if (nav.url.startsWith('becon://payment-callback') && !callbackHandled.current) {
      callbackHandled.current = true;
      router.replace({
        pathname: '/order/success/[orderId]',
        params: { orderId },
      });
    }
  }

  if (!orderId || !amount || !pk) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.orange} size="large" />
        <Text style={[styles.cardDesc, { marginTop: 12 }]}>جاري تجهيز الدفع...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.container, { paddingBottom: 8 }]}>
        <View style={[styles.elevatedCard, { backgroundColor: colors.cardGreen }]}>
          <View style={styles.between}>
            <View>
              <Text style={styles.cardTitle}>الدفع الآمن</Text>
              <Text style={styles.cardDesc}>المبلغ: {formatArabicSar(amountHalalas)}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.teal }]}>
              <Text style={styles.chipText}>تأكيد الدفع</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.cardDesc}>
            تأكيد الطلب يتم من مزود الدفع مباشرة. إذا تأخر الرجوع من صفحة الدفع، سيستمر النظام
            في مطابقة العملية وحماية الطلب من الضياع.
          </Text>
        </View>
      </View>
      <View
        style={{
          flex: 1,
          marginHorizontal: 14,
          marginBottom: 14,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          onNavigationStateChange={handleNavChange}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator color={colors.orange} size="large" />
            </View>
          )}
        />
      </View>
    </View>
  );
}

function buildMoyasarHtml(orderId: string, amountHalalas: number, publishableKey: string) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css" />
    <style>
      body { background: ${colors.bg}; padding: 16px; font-family: system-ui, sans-serif; direction: rtl; }
      .mysr-form { color: ${colors.text}; }
      .mysr-form button { border-radius: 12px !important; min-height: 48px !important; }
      input, select { border-radius: 12px !important; }
    </style>
  </head>
  <body>
    <div class="mysr-form"></div>
    <script src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"></script>
    <script>
      Moyasar.init({
        element: '.mysr-form',
        amount: ${amountHalalas},
        currency: 'SAR',
        description: 'طلب BeCon ${orderId}',
        publishable_api_key: '${publishableKey}',
        callback_url: 'becon://payment-callback',
        methods: ['applepay', 'creditcard', 'stcpay'],
        apple_pay: {
          country: 'SA',
          label: 'BeCon',
          validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate'
        },
        metadata: { order_id: '${orderId}' }
      });
    </script>
  </body>
</html>`;
}
