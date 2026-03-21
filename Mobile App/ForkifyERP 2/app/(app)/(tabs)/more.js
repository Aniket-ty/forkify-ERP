// app/(app)/(tabs)/more.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { usePermission, useBranch } from '../../../src/hooks';
import { logoutThunk } from '../../../src/store';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';

const SECTIONS = [
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Daily Sales',       icon: '🛒', path: '/(app)/sales/daily-sales'  },
      { label: 'Menu Management',   icon: '🍽', path: '/(app)/menu/active'         },
      { label: 'Meal Planning',     icon: '📅', path: '/(app)/meal-planning/weekly'},
      { label: 'Customer CRM',      icon: '❤️',  path: '/(app)/customers'           },
      { label: 'Shift Scheduler',   icon: '👔', path: '/(app)/staff/shifts', managerOnly: true },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { label: 'Inventory Report',  icon: '📦', path: '/(app)/reports/inventory'  },
      { label: 'Cost & Margin',     icon: '💰', path: '/(app)/reports/cost'        },
      { label: 'Wastage Report',    icon: '🗑',  path: '/(app)/reports/wastage'     },
      { label: 'Sales Report',      icon: '📈', path: '/(app)/reports/sales'       },
      { label: 'Supplier Report',   icon: '🚚', path: '/(app)/reports/supplier'    },
      { label: 'Branch Comparison', icon: '🏪', path: '/(app)/reports/branches', hqOnly: true },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { label: 'Analytics',         icon: '📊', path: '/(app)/admin/analytics',    hqOnly: true },
      { label: 'User Management',   icon: '👥', path: '/(app)/admin/users',         hqOnly: true },
      { label: 'Branch Management', icon: '🏪', path: '/(app)/admin/branches',      hqOnly: true },
      { label: 'Audit Logs',        icon: '🛡',  path: '/(app)/admin/audit',         hqOnly: true },
    ],
  },
];

export default function MoreTab() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const { isHQ, canApprove } = usePermission();
  const { branchName } = useBranch();
  const { user } = usePermission();

  const roleLabel = { ROLE_ADMIN: 'Super Admin', ROLE_MANAGER: 'Branch Manager', ROLE_STAFF: 'Kitchen Staff', ROLE_USER: 'Inventory Clerk' }[user?.role] || 'Staff';
  const initials  = (user?.fullName || user?.username || 'U').charAt(0).toUpperCase();

  const canSee = (item) => {
    if (item.hqOnly && !isHQ) return false;
    if (item.managerOnly && !canApprove) return false;
    return true;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile card */}
      <View style={[styles.profileCard, Shadow.sm]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.username || 'User'}</Text>
          <Text style={styles.profileRole}>{roleLabel}</Text>
          <Text style={styles.profileBranch}>🏪 {branchName}</Text>
        </View>
      </View>

      {SECTIONS.map(section => {
        const visible = section.items.filter(canSee);
        if (visible.length === 0) return null;
        return (
          <View key={section.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <View style={[styles.menuCard, Shadow.sm]}>
              {visible.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, i < visible.length - 1 && styles.menuItemBorder]}
                  onPress={() => router.push(item.path)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Text style={styles.menuItemArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      {/* App info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Forkify ERP  v2.1.0</Text>
        <Text style={styles.appSub}>Restaurant Management System</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logoutThunk())}>
        <Text style={styles.logoutText}>🚪  Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  content:      { padding: Spacing.lg },
  profileCard:  { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:   { color: '#fff', fontSize: Typography.xl, fontWeight: '700' },
  profileName:  { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  profileRole:  { fontSize: Typography.xs, color: Colors.textMuted },
  profileBranch:{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 3 },
  section:      { marginBottom: Spacing.lg },
  sectionLabel: { fontSize: Typography.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  menuCard:     { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12 },
  menuItemBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuItemIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  menuItemLabel:{ flex: 1, fontSize: Typography.md, fontWeight: '500', color: Colors.text },
  menuItemArrow:{ fontSize: Typography.lg, color: Colors.textMuted },
  appInfo:      { alignItems: 'center', paddingVertical: Spacing.xl },
  appVersion:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.textMuted },
  appSub:       { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  logoutBtn:    { backgroundColor: Colors.dangerLight, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  logoutText:   { fontSize: Typography.md, fontWeight: '700', color: Colors.danger },
});
