// app/(app)/procurement/grn.js — Goods Received Notes
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { procurementService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, StatusBadge, FormField, FormInput, PrimaryButton, ScreenHeader} from '../../../src/components/common';

export default function GRNScreen() {
  const router = useRouter();
  const { branchId } = useBranch();
  const { canApprove } = usePermission();
  const [grns, setGrns]         = useState([]);
  const [pos, setPOs]           = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);
  const [form, setForm] = useState({ purchaseOrderId: '', receivedBy: '', notes: '', items: [] });

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [gRes, pRes] = await Promise.all([
        procurementService.getGRNs(branchId),
        procurementService.getPOs(branchId, 'SENT'),
      ]);
      setGrns(gRes.data || []);
      setPOs(pRes.data || []);
    } catch { setError('Failed to load GRNs'); }
    finally  { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const filtered = grns.filter(g => !search ||
    (g.poNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.supplierName || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = async (id) => {
    try {
      await procurementService.confirmGRN(id);
      setSuccess('GRN confirmed — stock updated');
      load();
    } catch (e) { setError(e.response?.data || 'Failed to confirm GRN'); }
  };

  const handleCreate = async () => {
    if (!form.purchaseOrderId) { setError('Select a PO'); return; }
    setSaving(true);
    try {
      await procurementService.createGRN({ purchaseOrderId: parseInt(form.purchaseOrderId), receivedBy: form.receivedBy, notes: form.notes }, branchId);
      setSuccess('GRN created successfully');
      setModalOpen(false);
      setForm({ purchaseOrderId: '', receivedBy: '', notes: '', items: [] });
      load();
    } catch (e) { setError(e.response?.data || 'Failed to create GRN'); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScreenHeader
          title="📬 Goods Received"
          subtitle="Record incoming deliveries"
          right={
            <TouchableOpacity style={S.addBtn} onPress={() => setModalOpen(true)}><Text style={S.addBtnText}>+ New GRN</Text></TouchableOpacity>
          }
        />

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.sm }}>
        {[
          { label: 'Total GRNs', val: grns.length, icon: '📬' },
          { label: 'Pending', val: grns.filter(g => g.status === 'PENDING').length, icon: '⏳' },
          { label: 'Confirmed', val: grns.filter(g => g.status === 'CONFIRMED').length, icon: '✅' },
        ].map((s, i) => (
          <View key={i} style={[S.stat, Shadow.sm]}>
            <Text style={{ fontSize: 18 }}>{s.icon}</Text>
            <Text style={S.statVal}>{s.val}</Text>
            <Text style={S.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search GRNs..." />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : filtered.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>📬</Text><Text style={S.emptyT}>No GRNs yet</Text><Text style={S.emptyS}>Create a GRN to record received goods</Text></View>
      : <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={[S.card, Shadow.sm]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flex: 1 }}>
                  <Text style={S.grnNumber}>{item.grnNumber || `GRN-${item.id}`}</Text>
                  <Text style={S.metaText}>PO: {item.poNumber} · {item.supplierName}</Text>
                  <Text style={S.metaText}>Received: {item.receivedDate} · By: {item.receivedBy}</Text>
                </View>
                <StatusBadge status={item.status || 'PENDING'} />
              </View>
              {item.items && item.items.length > 0 && (
                <View style={S.itemsRow}>
                  {item.items.slice(0, 3).map((it, idx) => (
                    <Text key={idx} style={S.itemChip}>{it.ingredientName}: {it.receivedQuantity}</Text>
                  ))}
                  {item.items.length > 3 && <Text style={S.itemMore}>+{item.items.length - 3} more</Text>}
                </View>
              )}
              {item.status === 'PENDING' && canApprove && (
                <TouchableOpacity style={[S.confirmBtn, { marginTop: 8 }]} onPress={() => handleConfirm(item.id)}>
                  <Text style={S.confirmBtnText}>✓ Confirm & Update Inventory</Text>
                </TouchableOpacity>
              )}
            </View>
          )} />}

      {/* Create GRN Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}><Text style={S.mTitle}>Create GRN</Text><TouchableOpacity onPress={() => setModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Purchase Order *">
              {pos.length === 0
                ? <View style={S.noPO}><Text style={S.noPOText}>No sent purchase orders available. Send a PO first.</Text></View>
                : pos.map(po => (
                  <TouchableOpacity key={po.id} onPress={() => setForm(f => ({ ...f, purchaseOrderId: po.id }))}
                    style={[S.poRow, String(form.purchaseOrderId) === String(po.id) && S.poRowActive]}>
                    <Text style={{ fontWeight: '600', color: Colors.text }}>{po.poNumber}</Text>
                    <Text style={{ fontSize: Typography.xs, color: Colors.textMuted }}>{po.supplierName} · ₹{parseFloat(po.totalAmount || 0).toFixed(0)}</Text>
                  </TouchableOpacity>
                ))}
            </FormField>
            <FormField label="Received By">
              <FormInput value={form.receivedBy} onChangeText={v => setForm(f => ({ ...f, receivedBy: v }))} placeholder="Staff member name" />
            </FormField>
            <FormField label="Notes">
              <FormInput value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional notes" multiline />
            </FormField>
            <PrimaryButton label="Create GRN" onPress={handleCreate} loading={saving} style={{ marginTop: 8, marginBottom: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub:   { fontSize: Typography.xs, color: Colors.textMuted },
  addBtn:      { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.primary },
  stat:        { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.border },
  statVal:     { fontSize: Typography.md, fontWeight: '800', color: Colors.text },
  statLbl:     { fontSize: 10, color: Colors.textMuted },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:      { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptyS:      { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  card:        { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  grnNumber:   { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  metaText:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  itemsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  itemChip:    { fontSize: Typography.xs, backgroundColor: Colors.bg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, color: Colors.textSecondary },
  itemMore:    { fontSize: Typography.xs, color: Colors.textMuted },
  confirmBtn:  { backgroundColor: Colors.successLight, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  confirmBtnText: { fontSize: Typography.sm, fontWeight: '700', color: '#15803d' },
  mHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:      { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  mClose:      { fontSize: Typography.xl, color: Colors.textMuted },
  poRow:       { padding: Spacing.md, backgroundColor: Colors.bg, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  poRowActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  noPO:        { padding: Spacing.md, backgroundColor: Colors.warningLight, borderRadius: Radius.md },
  noPOText:    { fontSize: Typography.sm, color: '#92400e' },
});
