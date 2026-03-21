// app/(app)/(tabs)/dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { dashboardService } from '../../../src/services';
import { usePermission, useBranch } from '../../../src/hooks';
import { logoutThunk } from '../../../src/store';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { KpiCard, Banner, ProgressBar, StatusBadge } from '../../../src/components/common';

export default function DashboardScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { isHQ } = usePermission();
  const { branchId, branchName } = useBranch();

  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: d } = await dashboardService.get(branchId);
      setData(d);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const revenueChange = data && data.lastMonthRevenue > 0
    ? (((+data.totalRevenue - +data.lastMonthRevenue) / +data.lastMonthRevenue) * 100).toFixed(1)
    : null;

  const kpis = data ? [
    { title: 'Revenue', value: `₹${(+data.totalRevenue||0).toLocaleString('en-IN')}`, change: revenueChange ? `${revenueChange>0?'+':''}${revenueChange}%` : 'No prior data', trend: revenueChange > 0 ? 'up' : 'down', icon: '💰' },
    { title: 'Recipes', value: data.activeRecipes, change: 'Active', trend: 'up', icon: '👨‍🍳' },
    { title: 'Inv. Value', value: `₹${(+data.inventoryValue||0).toLocaleString('en-IN')}`, change: `${data.lowStockCount} low`, trend: data.lowStockCount > 0 ? 'down' : 'up', icon: '📦' },
    { title: 'Orders', value: data.monthlyOrders, change: `${data.totalOrders} total`, trend: 'up', icon: '🛒' },
    { title: 'Suppliers', value: data.activeSuppliers, change: 'Approved', trend: 'up', icon: '🤝' },
    { title: 'Wastage', value: data.pendingWastage, change: 'Pending', trend: data.pendingWastage > 0 ? 'down' : 'up', icon: '🗑' },
  ] : [];

  const initials = (user?.fullName || user?.username || 'U').charAt(0).toUpperCase();
  const roleLabel = { ROLE_ADMIN: 'Super Admin', ROLE_MANAGER: 'Branch Manager', ROLE_STAFF: 'Kitchen Staff' }[user?.role] || 'Staff';

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>
              {isHQ ? 'HQ Dashboard' : `${branchName}`}
            </Text>
            <Text style={styles.role}>{roleLabel}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logoutThunk())}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.dateText}>
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>

      {/* Error banner */}
      <Banner type="error" message={error} onDismiss={() => setError(null)} />

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[
          { label: 'Log Sales',    icon: '🛒', path: '/(app)/sales/daily-sales' },
          { label: 'Stock In',     icon: '📥', path: '/(app)/inventory/stock-in' },
          { label: 'Raise Indent', icon: '📋', path: '/(app)/procurement/indent' },
          { label: 'Log Wastage',  icon: '🗑',  path: '/(app)/inventory/wastage' },
        ].map((a, i) => (
          <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => router.push(a.path)}>
            <Text style={styles.quickIcon}>{a.icon}</Text>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* KPIs */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.kpiGrid}>
        {kpis.map((kpi, i) => (
          <View key={i} style={styles.kpiWrapper}>
            <KpiCard {...kpi} />
          </View>
        ))}
      </View>

      {/* Low Stock Alerts */}
      <View style={[styles.card, Shadow.sm]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>⚠️  Low Stock Alerts</Text>
            {data?.lowStockCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{data.lowStockCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/inventory/raw-materials')}>
            <Text style={styles.viewAll}>View →</Text>
          </TouchableOpacity>
        </View>

        {(data?.lowStockItems || []).length === 0 ? (
          <View style={styles.emptyInCard}>
            <Text style={styles.emptyInCardText}>✅  All items well stocked</Text>
          </View>
        ) : (data?.lowStockItems || []).slice(0, 5).map((item, i) => {
          const pct = item.min > 0 ? Math.min(100, (item.current / item.min) * 100) : 100;
          const color = pct < 30 ? Colors.danger : pct < 60 ? Colors.warning : Colors.success;
          return (
            <View key={i} style={styles.stockRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.stockRowTop}>
                  <Text style={styles.stockName}>{item.name}</Text>
                  <Text style={[styles.stockQty, { color: Colors.danger }]}>
                    {item.current}/{item.min} {item.unit}
                  </Text>
                </View>
                <ProgressBar percent={pct} color={color} />
              </View>
              <TouchableOpacity style={styles.indentBtn} onPress={() => router.push('/(app)/procurement/indent')}>
                <Text style={styles.indentBtnText}>Indent</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Recent POs */}
      <View style={[styles.card, Shadow.sm]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🚚  Recent Purchase Orders</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/procurement/orders')}>
            <Text style={styles.viewAll}>View →</Text>
          </TouchableOpacity>
        </View>
        {(data?.recentOrders || []).length === 0 ? (
          <View style={styles.emptyInCard}><Text style={styles.emptyInCardText}>No recent orders</Text></View>
        ) : (data?.recentOrders || []).slice(0, 4).map((o, i) => (
          <View key={i} style={styles.orderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderPO}>{o.poNumber}</Text>
              <Text style={styles.orderSub}>{o.supplierName} · {o.itemCount} items</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.orderAmt}>₹{(+o.totalAmount||0).toFixed(0)}</Text>
              <StatusBadge status={o.status} />
            </View>
          </View>
        ))}
      </View>

      {/* Top Recipes */}
      <View style={[styles.card, Shadow.sm]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>👨‍🍳  Top Recipes This Month</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/recipes')}>
            <Text style={styles.viewAll}>View →</Text>
          </TouchableOpacity>
        </View>
        {(data?.topRecipes || []).length === 0 ? (
          <View style={styles.emptyInCard}>
            <Text style={styles.emptyInCardText}>No sales data yet — log sales to see top recipes</Text>
          </View>
        ) : (data?.topRecipes || []).slice(0, 5).map((r, i) => (
          <View key={i} style={styles.recipeRow}>
            <View style={styles.recipeRank}>
              <Text style={styles.recipeRankText}>#{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recipeName}>{r.recipeName}</Text>
              <Text style={styles.recipeSub}>{r.quantitySold} covers sold</Text>
            </View>
            <Text style={styles.recipeRev}>₹{(+r.revenue||0).toFixed(0)}</Text>
          </View>
        ))}
      </View>

      {/* Branch Revenue (HQ only) */}
      {isHQ && (data?.branchRevenue || []).length > 0 && (
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🏪  Revenue by Branch</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/reports/branches')}>
              <Text style={styles.viewAll}>View →</Text>
            </TouchableOpacity>
          </View>
          {data.branchRevenue.map((b, i) => {
            const maxRev = Math.max(...data.branchRevenue.map(br => +br.revenue));
            const pct = maxRev > 0 ? (+b.revenue / maxRev) * 100 : 0;
            return (
              <View key={i} style={styles.branchRow}>
                <View style={styles.branchRowTop}>
                  <Text style={styles.branchName}>{b.branchName}</Text>
                  <Text style={styles.branchRev}>₹{(+b.revenue).toLocaleString('en-IN')}</Text>
                </View>
                <ProgressBar percent={pct} color={Colors.primary} />
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  content:      { padding: Spacing.lg },
  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Colors.bg },
  loadingText:  { fontSize: Typography.base, color: Colors.textMuted },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#fff', fontSize: Typography.lg, fontWeight: '700' },
  greeting:     { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  role:         { fontSize: Typography.xs, color: Colors.textMuted },
  logoutBtn:    { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#fecaca' },
  logoutText:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.danger },
  dateText:     { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: Spacing.lg },

  quickActions: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  quickBtn:     { flex: 1, alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  quickIcon:    { fontSize: 20 },
  quickLabel:   { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  sectionTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  kpiGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  kpiWrapper:   { width: '48%' },

  card:         { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, overflow: 'hidden' },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:    { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  viewAll:      { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
  countBadge:   { backgroundColor: Colors.dangerLight, borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  countBadgeText:{ fontSize: Typography.xs, color: Colors.danger, fontWeight: '700' },

  emptyInCard:  { padding: Spacing.lg, alignItems: 'center' },
  emptyInCardText:{ fontSize: Typography.sm, color: Colors.textMuted },

  stockRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  stockRowTop:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  stockName:    { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  stockQty:     { fontSize: Typography.xs, fontWeight: '600' },
  indentBtn:    { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.primaryLight, borderRadius: Radius.sm, borderWidth: 1, borderColor: '#b3ccf5' },
  indentBtnText:{ fontSize: Typography.xs, fontWeight: '600', color: Colors.primaryDark },

  orderRow:     { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  orderPO:      { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  orderSub:     { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  orderAmt:     { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },

  recipeRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  recipeRank:   { width: 28, height: 28, backgroundColor: Colors.primaryLight, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  recipeRankText:{ fontSize: Typography.xs, fontWeight: '700', color: Colors.primary },
  recipeName:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  recipeSub:    { fontSize: Typography.xs, color: Colors.textMuted },
  recipeRev:    { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },

  branchRow:    { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  branchRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  branchName:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  branchRev:    { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },
});
