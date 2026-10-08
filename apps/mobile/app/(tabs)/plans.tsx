import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { PlanType } from '@becon/shared';
import {
  BrandHeader,
  EmptyPlans,
  FILTERS,
  PlanCard,
  SERVICES,
  ServiceTile,
} from '@/components/catalog';
import { useActivePlans } from '@/lib/catalog';
import { useAuth } from '@/lib/auth';
import { colors, styles } from '@/theme';

export default function PlansTab() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: PlanType | 'all' }>();
  const { session } = useAuth();
  const { plans, loading } = useActivePlans();
  const [activeType, setActiveType] = useState<PlanType | 'all'>('all');

  useEffect(() => {
    if (type === 'sim' || type === 'esim' || type === 'recharge' || type === 'all') {
      setActiveType(type);
    }
  }, [type]);

  const visiblePlans = useMemo(
    () => plans.filter((plan) => activeType === 'all' || plan.type === activeType),
    [plans, activeType],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        contentContainerStyle={[styles.container, { paddingBottom: 112 }]}
        data={visiblePlans}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <BrandHeader
              actionLabel={session ? 'حسابي' : 'دخول'}
              onAction={() => router.push(session ? '/account' : { pathname: '/sign-in', params: { mode: 'in' } })}
            />

            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>كتالوج BeCon</Text>
              <Text style={styles.heroTitle}>كل الباقات في صفحة واحدة واضحة</Text>
              <Text style={styles.heroText}>
                فلتر حسب الخدمة، افتح التفاصيل، ثم أنشئ حسابك عند قرار الشراء. الأسعار والمزايا تظهر قبل الدفع.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>اختيار سريع</Text>
              <Text style={styles.sectionHint}>غيّر نوع الخدمة</Text>
            </View>
            <View style={[styles.row, { gap: 10, marginBottom: 6 }]}>
              {SERVICES.map((service) => (
                <ServiceTile
                  key={service.type}
                  active={activeType === service.type}
                  title={service.title}
                  text={service.text}
                  accent={service.accent}
                  onPress={() => setActiveType(service.type)}
                />
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>تصفية الباقات</Text>
              <Text style={styles.sectionHint}>{visiblePlans.length} نتيجة</Text>
            </View>
            <FlatList
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              data={FILTERS}
              keyExtractor={(item) => item.type}
              contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
              renderItem={({ item }) => {
                const active = activeType === item.type;
                return (
                  <Pressable
                    hitSlop={8}
                    style={[
                      styles.softChip,
                      active && { backgroundColor: colors.blue, borderColor: colors.blue },
                    ]}
                    onPress={() => setActiveType(item.type)}
                  >
                    <Text style={[styles.softChipText, active && { color: colors.white }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الباقات المتاحة</Text>
              <Text style={styles.sectionHint}>أسعار واضحة</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.elevatedCard}>
              <ActivityIndicator color={colors.orange} />
              <Text style={[styles.cardDesc, { textAlign: 'center' }]}>جاري تحميل الباقات...</Text>
            </View>
          ) : (
            <EmptyPlans />
          )
        }
        renderItem={({ item, index }) => <PlanCard plan={item} featured={index === 0} />}
      />
    </SafeAreaView>
  );
}
