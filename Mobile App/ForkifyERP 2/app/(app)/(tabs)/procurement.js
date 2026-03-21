// app/(app)/(tabs)/procurement.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { procurementService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, StatusBadge } from '../../../src/components/common';

const MODULES = [
  { id: 'indent',    label: 'Material Indent',   icon: '📋', desc: 'Raise stock requests',       path: '/(app)/procurement/indent'    },
  { id: 'orders',    label: 'Purchase Orders',    icon: '🛒', desc: 'Track POs from suppliers',   path: '/(app)/procurement/orders'    },
  { id: 'suppliers', label: 'Suppliers',          icon: '🤝', desc: 'Manage supplier contacts',   path: '/(app)/procurement/suppliers' },
  { id: 'grn',       label: 'Goods Received',     icon: '📬', desc: 'Log delivery receipts',      path: '/(app)/procurement/grn'       },
  { id: 'vendors',   label: 'Approved Vendors',   icon: '✅', desc: 'HQ-approved vendor list',    path: '/(app)/procurement/vendors',  hqOnly: true },
];

export default function ProcurementTab() {
  const router   = useRouter();
  const { branchId } = useBranch();
  const { isHQ } = usePermission();
  const [recentPOs,  setRecentPOs]  = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!branchId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const { data } = await procurementService.getPOs(branchId, null);
      const pos = data || [];
      setRecentPOs(pos.slice(0, 5));
      setStats({
        total:   pos.length,
        pending: pos.filter(p => p.status === 'DRAFT' || p.status === 'SENT').length,
        received:pos.filter(p => p.status === 'RECEIVED').length,
      });
    } catch { setError('Failed to load procurement data'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen message="Loading procurement..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />}
    >
      <Text style={styles.pageTitle}>🚚  Procurement</Text>
      <Text style={styles.pageSub}>Manage suppliers, orders and deliveries</Text>

      <Banner type="error" message={error} onDismiss={() => setError(null)} />

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          {[
            { label: 'Total POs',    value: stats.total,    icon: '📄', color: Colors.primary },
            { label: 'Pending',      value: stats.pending,  icon: '⏳', color: Colors.warning },
            { label: 'Received',     value: stats.received, icon: '✅', color: Colors.success },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, Shadow.sm]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Modules */}
      <Text style={styles.sectionLabel}>MODULES</Text>
      <View style={styles.moduleGrid}>
        {MODULES.filter(m => !m.hqOnly || isHQ).map(m => (
          <TouchableOpacity key={m.id} style={[styles.moduleCard, Shadow.sm]} onPress={() => router.push(m.path)} activeOpacity={0.75}>
            <Text style={styles.moduleIcon}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.moduleLabel}>{m.label}</Text>
              <Text style={styles.moduleDesc}>{m.desc}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent POs */}
      {recentPOs.length > 0 && (
        <>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionLabel}>RECENT PURCHASE ORDERS</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/procurement/orders')}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.recentCard, Shadow.sm]}>
            {recentPOs.map((po, i) => (
              <View key={po.id} style={[styles.poRow, i < recentPOs.length - 1 && styles.poRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.poNumber}>{po.poNumber}</Text>
                  <Text style={styles.poMeta}>{po.supplierName} · {po.itemCount} items</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.poAmt}>₹{(+po.totalAmount||0).toFixed(0)}</Text>
                  <StatusBadge status={po.status} />
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  content:      { padding: Spacing.lg },
  pageTitle:    { fontSize: Typography.xxl, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  pageSub:      { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  statCard:     { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statIcon:     { fontSize: 18, marginBottom: 4 },
  statValue:    { fontSize: Typography.lg, fontWeight: '800' },
  statLabel:    { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  sectionLabel: { fontSize: Typography.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  moduleGrid:   { gap: 10, marginBottom: Spacing.lg },
  moduleCard:   { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  moduleIcon:   { fontSize: 26, width: 40, textAlign: 'center' },
  moduleLabel:  { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  moduleDesc:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  arrow:        { fontSize: Typography.lg, color: Colors.textMuted },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  viewAll:      { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
  recentCard:   { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  poRow:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  poRowBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  poNumber:     { fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
  poMeta:       { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  poAmt:        { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },
});
