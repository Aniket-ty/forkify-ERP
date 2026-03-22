// app/(app)/(tabs)/_layout.js — v3 premium tab bar
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/theme';

const TABS = [
  { name: 'dashboard',   label: 'Home',      icon: 'grid-outline',     iconActive: 'grid' },
  { name: 'inventory',   label: 'Inventory', icon: 'cube-outline',     iconActive: 'cube' },
  { name: 'recipes',     label: 'Recipes',   icon: 'book-outline',     iconActive: 'book' },
  { name: 'procurement', label: 'Orders',    icon: 'cart-outline',     iconActive: 'cart' },
  { name: 'more',        label: 'More',      icon: 'menu-outline',     iconActive: 'menu' },
];

function TabIcon({ iconName, iconActive, label, focused }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={focused ? iconActive : iconName}
          size={22}
          color={focused ? '#fff' : Colors.textMuted}
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom }],
        tabBarShowLabel: false,
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconName={tab.icon}
                iconActive={tab.iconActive}
                label={tab.label}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eef1f8',
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  tabItem:       { alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconWrap:      { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive:{ backgroundColor: Colors.primary, width: 44, height: 30 },
  tabLabel:      { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  tabLabelActive:{ color: Colors.primary, fontWeight: '700' },
});
