// app/(app)/(tabs)/dashboard.js — v3 premium dashboard
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dashboardService, branchService } from '../../../src/services';
import { usePermission, useBranch } from '../../../src/hooks';
import { logoutThunk, setActiveBranch } from '../../../src/store';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, ProgressBar, StatusBadge } from '../../../src/components/common';
import { Modal, FlatList } from 'react-native';

const QUICK_ACTIONS = [
  { label: 'Log Sales',    icon: 'cart',          color: '#3b82f6', bg: '#eff6ff', path: '/(app)/sales/daily-sales' },
  { label: 'Stock In',     icon: 'download',       color: '#10b981', bg: '#f0fdf4', path: '/(app)/inventory/stock-in' },
  { label: 'Indent',       icon: 'document-text',  color: '#f59e0b', bg: '#fffbeb', path: '/(app)/procurement/indent' },
  { label: 'Wastage',      icon: 'trash',          color: '#ef4444', bg: '#fef2f2', path: '/(app)/inventory/wastage' },
];

export default function DashboardScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const insets   = useSafeAreaInsets();
  const { user } = useSelector((s) => s.auth);
  const { isHQ } = usePermission();
  const { branchId, branchName } = useBranch();

  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [branches,    setBranches]    = useState([]);
  const [branchModal, setBranchModal] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: d } = await dashboardService.get(branchId);
      setData(d);
      if (isHQ) {
        try { const br = await branchService.getAll(); setBranches(br.data || []); } catch {}
      }
    } catch { setError('Failed to load dashboard'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId, isHQ]);

  useEffect(() => { load(); }, [load]);

  const initials  = (user?.fullName || user?.username || 'U').charAt(0).toUpperCase();
  const roleLabel = { ROLE_ADMIN: 'Super Admin', ROLE_MANAGER: 'Branch Manager', ROLE_STAFF: 'Kitchen Staff', ROLE_USER: 'Inventory Clerk' }[user?.role] || 'Staff';
  const greeting  = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const revenue       = +(data?.totalRevenue || 0);
  const lastRevenue   = +(data?.lastMonthRevenue || 0);
  const revenueChange = lastRevenue > 0 ? (((revenue - lastRevenue) / lastRevenue) * 100).toFixed(1) : null;

  if (loading) {
    return (
      <View style={[S.loadingWrap, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={S.loadingIcon}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
        <Text style={S.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#fff" />}
      >
        {/* ── Hero header ── */}
        <View style={[S.hero, { paddingTop: insets.top + 16 }]}>
          <View style={S.heroTop}>
            <View style={S.heroLeft}>
              <View style={S.avatar}>
                <Text style={S.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={S.greeting}>{greeting()}, {user?.fullName?.split(' ')[0] || user?.username}</Text>
                <TouchableOpacity
                  style={S.branchRow}
                  onPress={() => isHQ && setBranchModal(true)}
                  activeOpacity={isHQ ? 0.7 : 1}
                >
                  <Ionicons name="business-outline" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={S.branchLabel}>{branchName}</Text>
                  {isHQ && <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.7)" />}
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={S.logoutBtn} onPress={() => dispatch(logoutThunk())}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Revenue hero card */}
          <View style={S.heroCard}>
            <Text style={S.heroCardLabel}>Total Revenue</Text>
            <Text style={S.heroCardValue}>₹{revenue.toLocaleString('en-IN')}</Text>
            {revenueChange && (
              <View style={S.heroCardChange}>
                <Ionicons
                  name={+revenueChange >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={+revenueChange >= 0 ? '#34d399' : '#f87171'}
                />
                <Text style={[S.heroCardChangeTxt, { color: +revenueChange >= 0 ? '#34d399' : '#f87171' }]}>
                  {revenueChange > 0 ? '+' : ''}{revenueChange}% vs last month
                </Text>
              </View>
            )}
          </View>

          {/* Quick actions */}
          <View style={S.quickActions}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity key={a.label} style={S.quickBtn} onPress={() => router.push(a.path)} activeOpacity={0.8}>
                <View style={[S.quickIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Ionicons name={a.icon} size={20} color="#fff" />
                </View>
                <Text style={S.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Body ── */}
        <View style={S.body}>
          <Banner type="error" message={error} onDismiss={() => setError(null)} />

          {/* KPI grid */}
          <Text style={S.sectionTitle}>Overview</Text>
          <View style={S.kpiGrid}>
            {[
              { label: 'Active Recipes', value: data?.activeRecipes ?? '—',    icon: 'restaurant-outline', color: Colors.primary },
              { label: 'Inv. Value',     value: `₹${(+(data?.inventoryValue||0)).toLocaleString('en-IN')}`, icon: 'cube-outline', color: '#10b981' },
              { label: 'Monthly Orders', value: data?.monthlyOrders ?? '—',    icon: 'cart-outline',       color: '#f59e0b' },
              { label: 'Low Stock',      value: data?.lowStockCount ?? '—',     icon: 'warning-outline',    color: data?.lowStockCount > 0 ? '#ef4444' : '#10b981' },
              { label: 'Suppliers',      value: data?.activeSuppliers ?? '—',   icon: 'people-outline',     color: '#06b6d4' },
              { label: 'Pending Waste',  value: data?.pendingWastage ?? '—',    icon: 'trash-outline',      color: '#8b5cf6' },
            ].map((k, i) => (
              <View key={i} style={[S.kpiCard, Shadow.card]}>
                <View style={[S.kpiIcon, { backgroundColor: k.color + '18' }]}>
                  <Ionicons name={k.icon} size={18} color={k.color} />
                </View>
                <Text style={[S.kpiValue, { color: k.color }]}>{k.value}</Text>
                <Text style={S.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>

          {/* Low Stock */}
          <View style={[S.card, Shadow.card]}>
            <View style={S.cardHeader}>
              <View style={S.cardTitleRow}>
                <View style={[S.cardIconBg, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="warning-outline" size={16} color="#ef4444" />
                </View>
                <Text style={S.cardTitle}>Low Stock Alerts</Text>
                {(data?.lowStockCount || 0) > 0 && (
                  <View style={S.alertBadge}><Text style={S.alertBadgeText}>{data.lowStockCount}</Text></View>
                )}
              </View>
              <TouchableOpacity onPress={() => router.push('/(app)/inventory/raw-materials')} style={S.viewAllBtn}>
                <Text style={S.viewAll}>View all</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {(data?.lowStockItems || []).length === 0 ? (
              <View style={S.emptyInCard}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
                <Text style={S.emptyInCardText}>All items well stocked</Text>
              </View>
            ) : (data?.lowStockItems || []).slice(0, 5).map((item, i) => {
              const pct = item.min > 0 ? Math.min(100, (item.current / item.min) * 100) : 100;
              const color = pct < 30 ? '#ef4444' : pct < 60 ? '#f59e0b' : Colors.success;
              return (
                <View key={i} style={S.stockRow}>
                  <View style={{ flex: 1, gap: 5 }}>
                    <View style={S.stockRowTop}>
                      <Text style={S.stockName}>{item.name}</Text>
                      <Text style={[S.stockQty, { color }]}>{item.current}/{item.min} {item.unit}</Text>
                    </View>
                    <ProgressBar percent={pct} color={color} height={4} />
                  </View>
                  <TouchableOpacity style={S.indentBtn} onPress={() => router.push('/(app)/procurement/indent')}>
                    <Text style={S.indentBtnText}>Indent</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Recent POs */}
          <View style={[S.card, Shadow.card]}>
            <View style={S.cardHeader}>
              <View style={S.cardTitleRow}>
                <View style={[S.cardIconBg, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="car-outline" size={16} color={Colors.primary} />
                </View>
                <Text style={S.cardTitle}>Recent Purchase Orders</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(app)/procurement/orders')} style={S.viewAllBtn}>
                <Text style={S.viewAll}>View all</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {(data?.recentOrders || []).length === 0 ? (
              <View style={S.emptyInCard}>
                <Text style={S.emptyInCardText}>No recent orders</Text>
              </View>
            ) : (data?.recentOrders || []).slice(0, 4).map((o, i) => (
              <View key={i} style={[S.orderRow, i < 3 && S.rowBorder]}>
                <View style={S.orderIconWrap}>
                  <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.orderPO}>{o.poNumber}</Text>
                  <Text style={S.orderSub}>{o.supplierName} · {o.itemCount} items</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 5 }}>
                  <Text style={S.orderAmt}>₹{(+o.totalAmount || 0).toFixed(0)}</Text>
                  <StatusBadge status={o.status} />
                </View>
              </View>
            ))}
          </View>

          {/* Top Recipes */}
          <View style={[S.card, Shadow.card]}>
            <View style={S.cardHeader}>
              <View style={S.cardTitleRow}>
                <View style={[S.cardIconBg, { backgroundColor: '#fdf4ff' }]}>
                  <Ionicons name="restaurant-outline" size={16} color="#9333ea" />
                </View>
                <Text style={S.cardTitle}>Top Recipes This Month</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/recipes')} style={S.viewAllBtn}>
                <Text style={S.viewAll}>View all</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {(data?.topRecipes || []).length === 0 ? (
              <View style={S.emptyInCard}>
                <Text style={S.emptyInCardText}>No sales logged yet</Text>
              </View>
            ) : (data?.topRecipes || []).slice(0, 5).map((r, i) => (
              <View key={i} style={[S.recipeRow, i < 4 && S.rowBorder]}>
                <View style={S.rankBadge}>
                  <Text style={S.rankText}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.recipeName}>{r.recipeName}</Text>
                  <Text style={S.recipeSub}>{r.quantitySold} covers</Text>
                </View>
                <Text style={S.recipeRev}>₹{(+r.revenue || 0).toFixed(0)}</Text>
              </View>
            ))}
          </View>

          {/* Branch Revenue (HQ) */}
          {isHQ && (data?.branchRevenue || []).length > 0 && (
            <View style={[S.card, Shadow.card]}>
              <View style={S.cardHeader}>
                <View style={S.cardTitleRow}>
                  <View style={[S.cardIconBg, { backgroundColor: '#ecfdf5' }]}>
                    <Ionicons name="business-outline" size={16} color={Colors.success} />
                  </View>
                  <Text style={S.cardTitle}>Revenue by Branch</Text>
                </View>
              </View>
              {data.branchRevenue.map((b, i) => {
                const maxRev = Math.max(...data.branchRevenue.map(br => +br.revenue));
                const pct = maxRev > 0 ? (+b.revenue / maxRev) * 100 : 0;
                return (
                  <View key={i} style={[S.branchRow2, i < data.branchRevenue.length - 1 && S.rowBorder]}>
                    <View style={S.branchRowTop}>
                      <Text style={S.branchName}>{b.branchName}</Text>
                      <Text style={S.branchRev}>₹{(+b.revenue).toLocaleString('en-IN')}</Text>
                    </View>
                    <ProgressBar percent={pct} color={Colors.primary} height={5} />
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Branch Switcher Modal */}
      <Modal visible={branchModal} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setBranchModal(false)} />
          <View style={S.branchSheet}>
            <View style={S.sheetHandle} />
            <Text style={S.sheetTitle}>Switch Branch</Text>
            <FlatList
              data={branches}
              keyExtractor={b => String(b.id)}
              renderItem={({ item }) => {
                const active = String(item.id) === String(branchId);
                return (
                  <TouchableOpacity
                    style={[S.branchItem, active && S.branchItemActive]}
                    onPress={() => { dispatch(setActiveBranch({ branchId: item.id, branchName: item.name })); setBranchModal(false); }}
                  >
                    <View style={[S.branchItemIcon, { backgroundColor: active ? Colors.primaryLight : Colors.bg }]}>
                      <Ionicons name={item.type === 'HQ' ? 'business' : 'storefront-outline'} size={18} color={active ? Colors.primary : Colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[S.branchItemName, active && { color: Colors.primary }]}>{item.name}</Text>
                      {item.city && <Text style={S.branchItemCity}>{item.city}</Text>}
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  loadingWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: Colors.bg },
  loadingIcon:    { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  loadingText:    { fontSize: Typography.base, color: Colors.textMuted, fontWeight: '500' },

  hero:           { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingBottom: 28 },
  heroTop:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  heroLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText:     { color: '#fff', fontSize: Typography.lg, fontWeight: '700' },
  greeting:       { fontSize: Typography.md, fontWeight: '700', color: '#fff' },
  branchRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  branchLabel:    { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  logoutBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  heroCard:       { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroCardLabel:  { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  heroCardValue:  { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroCardChange: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  heroCardChangeTxt:{ fontSize: Typography.sm, fontWeight: '600' },

  quickActions:   { flexDirection: 'row', gap: 8 },
  quickBtn:       { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  quickIcon:      { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel:     { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '600', textAlign: 'center' },

  body:           { padding: Spacing.lg, marginTop: -4 },
  sectionTitle:   { fontSize: Typography.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: 4 },

  kpiGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  kpiCard:        { width: '30.5%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 12, borderWidth: 1, borderColor: Colors.border, gap: 3 },
  kpiIcon:        { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiValue:       { fontSize: Typography.lg, fontWeight: '800', letterSpacing: -0.5 },
  kpiLabel:       { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },

  card:           { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, overflow: 'hidden' },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  cardTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIconBg:     { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle:      { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  viewAllBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAll:        { fontSize: Typography.xs, color: Colors.primary, fontWeight: '600' },
  alertBadge:     { backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  alertBadgeText: { fontSize: Typography.xs, color: '#ef4444', fontWeight: '700' },

  emptyInCard:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.lg, justifyContent: 'center' },
  emptyInCardText:{ fontSize: Typography.sm, color: Colors.textMuted },

  rowBorder:      { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },

  stockRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md },
  stockRowTop:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  stockName:      { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  stockQty:       { fontSize: Typography.xs, fontWeight: '700' },
  indentBtn:      { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.primaryLight, borderRadius: Radius.sm },
  indentBtnText:  { fontSize: Typography.xs, fontWeight: '700', color: Colors.primary },

  orderRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md },
  orderIconWrap:  { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  orderPO:        { fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
  orderSub:       { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  orderAmt:       { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },

  recipeRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md },
  rankBadge:      { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rankText:       { fontSize: Typography.xs, fontWeight: '800', color: Colors.primary },
  recipeName:     { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  recipeSub:      { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  recipeRev:      { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },

  branchRow2:     { padding: Spacing.md, gap: 6 },
  branchRowTop:   { flexDirection: 'row', justifyContent: 'space-between' },
  branchName:     { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  branchRev:      { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  branchSheet:    { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.lg, paddingBottom: 32, maxHeight: '65%' },
  sheetHandle:    { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  sheetTitle:     { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  branchItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  branchItemActive:{ },
  branchItemIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  branchItemName: { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  branchItemCity: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
});
