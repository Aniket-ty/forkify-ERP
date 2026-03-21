// app/(app)/(tabs)/_layout.js
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../src/theme';

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Inventory" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" label="Recipes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="procurement"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚚" label="Procure" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="☰" label="More" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: 64,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabItem:        { alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabEmoji:       { fontSize: 20, opacity: 0.45 },
  tabEmojiActive: { opacity: 1 },
  tabLabel:       { fontSize: 10, color: '#9ca3af', fontWeight: '500' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});
