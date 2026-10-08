import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '@/theme';

type TabName = 'home' | 'plans' | 'orders' | 'account';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '900',
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: 18,
          paddingVertical: 6,
        },
        tabBarStyle: {
          height: 76,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          backgroundColor: colors.card,
          paddingTop: 8,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="account"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ focused, color }) => <TabGlyph name="account" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-orders"
        options={{
          title: 'طلباتي',
          tabBarIcon: ({ focused, color }) => <TabGlyph name="orders" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'الباقات',
          tabBarIcon: ({ focused, color }) => <TabGlyph name="plans" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ focused, color }) => <TabGlyph name="home" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabGlyph({
  name,
  focused,
  color,
}: {
  name: TabName;
  focused: boolean;
  color: string;
}) {
  const bg = focused ? colors.blue : 'transparent';
  const border = focused ? colors.blue : colors.lineStrong;

  if (name === 'home') {
    return (
      <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 18, height: 14, borderRadius: 5, borderWidth: 2, borderColor: color, backgroundColor: bg }} />
        <View style={{ position: 'absolute', top: 2, width: 12, height: 12, borderTopWidth: 2, borderLeftWidth: 2, borderColor: color, transform: [{ rotate: '45deg' }] }} />
      </View>
    );
  }

  if (name === 'plans') {
    return (
      <View style={{ width: 24, height: 24, gap: 4, justifyContent: 'center' }}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={{ height: 4, borderRadius: 4, backgroundColor: item === 0 && focused ? colors.teal : color, opacity: item === 2 ? 0.55 : 1 }} />
        ))}
      </View>
    );
  }

  if (name === 'orders') {
    return (
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: border, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color, fontWeight: '900', fontSize: 13 }}>✓</Text>
      </View>
    );
  }

  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 9, height: 9, borderRadius: 99, borderWidth: 2, borderColor: color, backgroundColor: focused ? colors.teal : 'transparent' }} />
      <View style={{ width: 18, height: 9, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 2, borderBottomWidth: 0, borderColor: color, marginTop: 2 }} />
    </View>
  );
}
