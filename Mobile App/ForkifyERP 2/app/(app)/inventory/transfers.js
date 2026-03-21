// app/(app)/inventory/transfers.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { transferService, recipeService, branchService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, StatusBadge, FormField, FormInput, PrimaryButton } from '../../../src/components/common';

const STATUSES = ['all', 'PENDING', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'CANCELLED'];

export default function TransfersScreen() {
  const router = useRouter();
  const { branchId } = useBranch();
  const { canApprove, isAdmin } = usePermission();
  const [transfers, setTransfers]   = useState([]);
  const [branches, setBranches]     = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);
  const [form, setForm] = useState({ toBranchId: '', ingredientId: '', quantity: '', notes: '' });

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [tRes, bRes, iRes] = await Promise.all([
        transferService.getAll(branchId, statusFilter === 'all' ? null : statusFilter),
        branchService.getAll(),
        recipeService.getAllIngredients(),
      ]);
      setTransfers(tRes.data || []);
      setBranches((bRes.data || []).filter(b => b.id !== branchId));
      setIngredients(iRes.data || []);
    } catch { setError('Failed to load transfers'); }
    finally  { setLoading(false); }
  }, [branchId, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const filtered = transfers.filter(t => !search || (t.ingredientName || '').toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    if (!form.toBranchId || !form.ingredientId || !form.quantity) { setError('All fields required'); return; }
    setSaving(true);
    try {
      await transferService.create({ fromBranchId: branchId, toBranchId: parseInt(form.toBranchId), ingredientId: parseInt(form.ingredientId), quantity: parseFloat(form.quantity), notes: form.notes || null });
      setSuccess('Transfer request submitted');
      setModalOpen(false);
      setForm({ toBranchId: '', ingredientId: '', quantity: '', notes: '' });
      load();
    } catch (e) { setError(e.response?.data || 'Failed to create transfer'); }
    finally { setSaving(false); }
  };

  const handleAction = async (id, action) => {
    try {
      await transferService[action](id);
      setSuccess(`Transfer ${action}d`);
      load();
    } catch (e) { setError(e.response?.data || 'Action failed'); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}><Text style={{ fontSize: 18 }}>←</Text></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={S.headerTitle}>🔄 Stock Transfers</Text><Text style={S.headerSub}>Move stock between branches</Text></View>
        <TouchableOpacity style={S.addBtn} onPress={() => setModalOpen(true)}><Text style={S.addBtnText}>+ Transfer</Text></TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search transfers..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
          {STATUSES.map(s => (
            <TouchableOpacity key={s} onPress={() => setStatusFilter(s)}
              style={[S.chip, statusFilter === s && S.chipA]}>
              <Text style={[S.chipT, statusFilter === s && S.chipTA]}>{s === 'all' ? 'All' : s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : filtered.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>🔄</Text><Text style={S.emptyT}>No transfers</Text><Text style={S.emptyS}>Create a stock transfer request</Text></View>
      : <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={[S.card, Shadow.sm]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flex: 1 }}>
                  <Text style={S.ingName}>{item.ingredientName}</Text>
                  <Text style={S.metaText}>From: {item.fromBranchName} → To: {item.toBranchName}</Text>
                  <Text style={S.metaText}>Qty: {item.quantity} {item.unit} · {item.createdDate}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              {item.status === 'PENDING' && canApprove && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity style={S.approveBtn} onPress={() => handleAction(item.id, 'approve')}>
                    <Text style={S.approveBtnText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.rejectBtn} onPress={() => handleAction(item.id, 'cancel')}>
                    <Text style={S.rejectBtnText}>✕ Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'APPROVED' && (
                <TouchableOpacity style={[S.approveBtn, { marginTop: 8 }]} onPress={() => handleAction(item.id, 'dispatch')}>
                  <Text style={S.approveBtnText}>📦 Dispatch</Text>
                </TouchableOpacity>
              )}
              {item.status === 'DISPATCHED' && item.toBranchId === branchId && (
                <TouchableOpacity style={[S.approveBtn, { marginTop: 8 }]} onPress={() => handleAction(item.id, 'receive')}>
                  <Text style={S.approveBtnText}>✅ Receive</Text>
                </TouchableOpacity>
              )}
            </View>
          )} />}

      {/* Create Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}><Text style={S.mTitle}>New Transfer Request</Text><TouchableOpacity onPress={() => setModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="To Branch *">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {branches.map(b => (
                  <TouchableOpacity key={b.id} onPress={() => setForm(f => ({ ...f, toBranchId: b.id }))}
                    style={[S.chip, String(form.toBranchId) === String(b.id) && S.chipA]}>
                    <Text style={[S.chipT, String(form.toBranchId) === String(b.id) && S.chipTA]}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </FormField>
            <FormField label="Ingredient *">
              <ScrollView style={{ maxHeight: 180 }}>
                {ingredients.slice(0, 20).map(i => (
                  <TouchableOpacity key={i.id} onPress={() => setForm(f => ({ ...f, ingredientId: i.id }))}
                    style={[S.ingRow, String(form.ingredientId) === String(i.id) && { backgroundColor: Colors.primaryLight }]}>
                    <Text style={{ color: Colors.text, fontWeight: String(form.ingredientId) === String(i.id) ? '700' : '400' }}>{i.name}</Text>
                    <Text style={{ color: Colors.textMuted, fontSize: Typography.sm }}>{i.unit}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </FormField>
            <FormField label="Quantity *"><FormInput value={form.quantity} onChangeText={v => setForm(f => ({ ...f, quantity: v }))} keyboardType="decimal-pad" placeholder="0.00" /></FormField>
            <FormField label="Notes"><FormInput value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional" multiline /></FormField>
            <PrimaryButton label="Submit Transfer Request" onPress={handleSave} loading={saving} style={{ marginTop: 8, marginBottom: 32 }} />
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
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipA:       { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipT:       { fontSize: Typography.sm, color: Colors.textSecondary },
  chipTA:      { color: Colors.primary, fontWeight: '600' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:      { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptyS:      { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  card:        { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  ingName:     { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  metaText:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  approveBtn:  { flex: 1, backgroundColor: Colors.successLight, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  approveBtnText: { fontSize: Typography.sm, fontWeight: '600', color: '#15803d' },
  rejectBtn:   { flex: 1, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  rejectBtnText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.danger },
  mHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:      { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  mClose:      { fontSize: Typography.xl, color: Colors.textMuted },
  ingRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, borderRadius: Radius.sm },
});
