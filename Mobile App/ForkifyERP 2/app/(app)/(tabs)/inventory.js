// app/(app)/(tabs)/inventory.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { inventoryService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, LoadingScreen } from '../../../src/components/common';

const MODULES = [
  { id: 'raw-materials',  label: 'Raw Materials',  icon: '🌾', desc: 'Track ingredient stock levels', path: '/(app)/inventory/raw-materials' },
  { id: 'finished-goods', label: 'Finished Goods', icon: '🍽', desc: 'Completed production items',    path: '/(app)/inventory/finished-goods' },
  { id: 'stock-in',       label: 'Stock In',        icon: '📥', desc: 'Record incoming deliveries',   path: '/(app)/inventory/stock-in' },
  { id: 'stock-out',      label: 'Stock Out',       icon: '📤', desc: 'Record consumed/used stock',   path: '/(app)/inventory/stock-out' },
  { id: 'wastage',        label: 'Wastage',         icon: '🗑',  desc: 'Log and approve wastage',     path: '/(app)/inventory/wastage' },
  { id: 'transfers',      label: 'Transfers',       icon: '🔄', desc: 'Move stock between branches', path: '/(app)/inventory/transfers', hqOnly: true },
];

export default function InventoryTab() {
  const router = useRouter();
  const { branchId } = useBranch();
  const { isHQ }     = usePermission();

  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!branchId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const { data } = await inventoryService.getSummary(branchId);
      setSummary(data);
    } catch { setError('Failed to load summary'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen message="Loading inventory..." />;

  const stats = [
    { label: 'Total Items',  value: summary?.totalItems    ?? '—', icon: '📦', color: Colors.primary },
    { label: 'Low Stock',    value: summary?.lowStockCount ?? '—', icon: '⚠️',  color: Colors.warning },
    { label: 'Critical',     value: summary?.criticalCount ?? '—', icon: '🚨', color: Colors.danger },
    { label: 'Total Value',  value: summary ? `₹${(+summary.totalValue||0).toLocaleString('en-IN')}` : '—', icon: '💰', color: Colors.success },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />}
    >
      <Text style={styles.pageTitle}>📦  Inventory</Text>
      <Text style={styles.pageSub}>Manage your branch inventory</Text>

      <Banner type="error" message={error} onDismiss={() => setError(null)} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <View key={i} style={[styles.statCard, Shadow.sm]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Module cards */}
      <Text style={styles.sectionLabel}>MODULES</Text>
      <View style={styles.moduleGrid}>
        {MODULES.filter(m => !m.hqOnly || isHQ).map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.moduleCard, Shadow.sm]}
            onPress={() => router.push(m.path)}
            activeOpacity={0.75}
          >
            <Text style={styles.moduleIcon}>{m.icon}</Text>
            <Text style={styles.moduleLabel}>{m.label}</Text>
            <Text style={styles.moduleDesc}>{m.desc}</Text>
            <Text style={styles.moduleArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  content:     { padding: Spacing.lg },
  pageTitle:   { fontSize: Typography.xxl, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  pageSub:     { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg },

  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  statCard:    { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statIcon:    { fontSize: 20, marginBottom: 4 },
  statValue:   { fontSize: Typography.lg, fontWeight: '800' },
  statLabel:   { fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  sectionLabel:{ fontSize: Typography.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },

  moduleGrid:  { gap: 10 },
  moduleCard:  { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  moduleIcon:  { fontSize: 28, width: 44, textAlign: 'center' },
  moduleLabel: { fontSize: Typography.md, fontWeight: '700', color: Colors.text, flex: 1 },
  moduleDesc:  { fontSize: Typography.xs, color: Colors.textMuted, position: 'absolute', bottom: 12, left: 68 },
  moduleArrow: { fontSize: Typography.lg, color: Colors.textMuted },
});
