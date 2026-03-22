// app/(app)/procurement/orders.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { procurementService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, LoadingScreen, EmptyState, StatusBadge, ScreenHeader} from '../../../src/components/common';

export default function PurchaseOrders() {
  const router = useRouter();
  const { branchId }   = useBranch();
  const { canApprove } = usePermission();

  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter,setStatusFilter]=useState('all');
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!branchId) return;
    if (!silent) setLoading(true);
    try {
      const { data } = await procurementService.getPOs(branchId, statusFilter === 'all' ? null : statusFilter);
      setOrders(data || []);
    } catch { setError('Failed to load purchase orders'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await procurementService.updatePOStatus(id, status);
      setSuccess(`PO marked as ${status}`);
      load(true);
    } catch (e) { setError(e.response?.data || 'Failed to update status'); }
  };

  const STATUSES = ['all', 'DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED'];

  if (loading) return <LoadingScreen message="Loading purchase orders..." />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="🛒  Purchase Orders"
          subtitle={`${orders.length} orders`}
        />

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, statusFilter === s && styles.chipActive]} onPress={() => setStatusFilter(s)}>
            <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>{s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />}
      >
        {orders.length === 0 ? (
          <EmptyState icon="🛒" title="No purchase orders" subtitle="Raise an indent to generate a PO" />
        ) : orders.map(po => (
          <View key={po.id} style={[styles.poCard, Shadow.sm]}>
            <View style={styles.poTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.poNumber}>{po.poNumber}</Text>
                <Text style={styles.poSupplier}>{po.supplierName}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.poAmt}>₹{(+po.totalAmount || 0).toFixed(0)}</Text>
                <StatusBadge status={po.status} />
              </View>
            </View>

            <View style={styles.poMeta}>
              <Text style={styles.metaItem}>📦 {po.itemCount} items</Text>
              <Text style={styles.metaItem}>📅 {po.orderDate || 'N/A'}</Text>
              {po.expectedDate && <Text style={styles.metaItem}>🚚 Expected: {po.expectedDate}</Text>}
            </View>

            {/* Status actions for manager/admin */}
            {canApprove && (po.status === 'DRAFT' || po.status === 'SENT') && (
              <View style={styles.actions}>
                {po.status === 'DRAFT' && (
                  <TouchableOpacity style={styles.sendBtn} onPress={() => handleStatusUpdate(po.id, 'SENT')}>
                    <Text style={styles.sendBtnText}>📤 Send to Supplier</Text>
                  </TouchableOpacity>
                )}
                {po.status === 'SENT' && (
                  <TouchableOpacity style={styles.receiveBtn} onPress={() => handleStatusUpdate(po.id, 'RECEIVED')}>
                    <Text style={styles.receiveBtnText}>✓ Mark Received</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleStatusUpdate(po.id, 'CANCELLED')}>
                  <Text style={styles.cancelBtnText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  backIcon:    { fontSize: Typography.lg },
  title:       { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  sub:         { fontSize: Typography.xs, color: Colors.textMuted },
  filterScroll:{ backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent:{ padding: Spacing.md, flexDirection: 'row' },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bg, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive:  { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText:    { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  list:        { padding: Spacing.md, gap: 10 },
  poCard:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  poTop:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  poNumber:    { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  poSupplier:  { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },
  poAmt:       { fontSize: Typography.lg, fontWeight: '800', color: Colors.primary },
  poMeta:      { flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
  metaItem:    { fontSize: Typography.xs, color: Colors.textSecondary },
  actions:     { flexDirection: 'row', gap: 8 },
  sendBtn:     { flex: 1, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: '#b3ccf5', backgroundColor: Colors.primaryLight, alignItems: 'center' },
  sendBtnText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.primary },
  receiveBtn:  { flex: 1, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: '#bbf7d0', backgroundColor: Colors.successLight, alignItems: 'center' },
  receiveBtnText:{ fontSize: Typography.xs, fontWeight: '600', color: '#15803d' },
  cancelBtn:   { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: '#fecaca', backgroundColor: Colors.dangerLight, alignItems: 'center' },
  cancelBtnText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.danger },
});
