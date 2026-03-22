// app/(app)/inventory/stock-in.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { inventoryService, recipeService } from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, LoadingScreen, EmptyState, PrimaryButton, FormField, FormInput, ScreenHeader} from '../../../src/components/common';

const emptyForm = () => ({ ingredientId: '', quantity: '', supplier: '', referenceNo: '', unitCost: '', expiryDate: '', notes: '' });

export default function StockIn() {
  const router = useRouter();
  const { branchId } = useBranch();

  const [transactions, setTransactions] = useState([]);
  const [ingredients,  setIngredients]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [search,       setSearch]       = useState('');
  const [modalOpen,    setModalOpen]    = useState(false);
  const [form,         setForm]         = useState(emptyForm());
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);
  const [success,      setSuccess]      = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!branchId) return;
    if (!silent) setLoading(true);
    try {
      const [txRes, ingRes] = await Promise.all([
        inventoryService.getTransactions(branchId, 'STOCK_IN'),
        recipeService.getAllIngredients(),
      ]);
      setTransactions(txRes.data || []);
      setIngredients(ingRes.data || []);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const stats = {
    total:    transactions.length,
    today:    transactions.filter(t => t.transactionDate === new Date().toISOString().split('T')[0]).length,
    suppliers:[...new Set(transactions.map(t => t.supplier).filter(Boolean))].length,
  };

  const filtered = transactions.filter(t =>
    !search || t.ingredientName.toLowerCase().includes(search.toLowerCase())
      || (t.supplier || '').toLowerCase().includes(search.toLowerCase())
      || (t.referenceNo || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.ingredientId || !form.quantity) { setError('Ingredient and quantity are required'); return; }
    setSaving(true);
    try {
      await inventoryService.stockIn({
        ingredientId: parseInt(form.ingredientId),
        quantity:     parseFloat(form.quantity),
        supplier:     form.supplier   || null,
        referenceNo:  form.referenceNo|| null,
        unitCost:     form.unitCost   ? parseFloat(form.unitCost) : null,
        expiryDate:   form.expiryDate || null,
        notes:        form.notes      || null,
      }, branchId);
      setSuccess('Stock recorded — inventory updated');
      setModalOpen(false);
      setForm(emptyForm());
      load(true);
    } catch (e) { setError(e.response?.data || 'Failed to record stock'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen message="Loading stock entries..." />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="📥  Stock In"
          subtitle="Record incoming deliveries"
          right={
            <TouchableOpacity style={styles.addBtn} onPress={() => { setForm(emptyForm()); setModalOpen(true); }}>
          <Text style={styles.addBtnText}>+ Entry</Text>
        </TouchableOpacity>
          }
        />

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total Entries',     value: stats.total,     icon: '📦' },
          { label: "Today's Entries",   value: stats.today,     icon: '📅' },
          { label: 'Unique Suppliers',  value: stats.suppliers, icon: '🚚' },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, Shadow.sm]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text>🔍</Text>
          <FormInput value={search} onChangeText={setSearch} placeholder="Search ingredient, supplier or ref..." style={{ flex: 1, borderWidth: 0, paddingVertical: 2 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="📥" title="No stock entries yet" subtitle="Record your first delivery above" action={() => { setForm(emptyForm()); setModalOpen(true); }} actionLabel="+ New Entry" />
        ) : filtered.map(tx => (
          <View key={tx.id} style={[styles.txCard, Shadow.sm]}>
            <View style={styles.txTop}>
              <Text style={styles.txName}>{tx.ingredientName}</Text>
              <Text style={styles.txQty}>+{tx.quantity} {tx.unit}</Text>
            </View>
            <View style={styles.txMeta}>
              {tx.supplier   && <Text style={styles.txMetaItem}>🚚 {tx.supplier}</Text>}
              {tx.referenceNo && <Text style={styles.txMetaItem}>📄 {tx.referenceNo}</Text>}
              <Text style={styles.txMetaItem}>📅 {tx.transactionDate}</Text>
              {tx.unitCost && <Text style={styles.txMetaItem}>₹{parseFloat(tx.unitCost).toFixed(2)}/unit</Text>}
            </View>
            <View style={styles.txBottom}>
              <Text style={styles.txBalance}>Balance after: <Text style={{ fontWeight: '700', color: Colors.primary }}>{tx.balanceAfter} {tx.unit}</Text></Text>
              {tx.createdBy && <Text style={styles.txBy}>By: {tx.createdBy}</Text>}
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📥  Record Stock In</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Ingredient *">
              <View style={styles.pickerWrap}>
                <ScrollView style={{ maxHeight: 160 }}>
                  {ingredients.map(ing => (
                    <TouchableOpacity key={ing.id} style={[styles.pickerOption, form.ingredientId === String(ing.id) && styles.pickerOptionActive]} onPress={() => setForm(f => ({ ...f, ingredientId: String(ing.id) }))}>
                      <Text style={[styles.pickerOptionText, form.ingredientId === String(ing.id) && styles.pickerOptionTextActive]}>{ing.name} ({ing.unit})</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </FormField>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Quantity *">
                  <FormInput value={form.quantity} onChangeText={v => setForm(f => ({ ...f, quantity: v }))} keyboardType="decimal-pad" placeholder="0.00" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Unit Cost">
                  <FormInput value={form.unitCost} onChangeText={v => setForm(f => ({ ...f, unitCost: v }))} keyboardType="decimal-pad" placeholder="Optional" />
                </FormField>
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Supplier">
                  <FormInput value={form.supplier} onChangeText={v => setForm(f => ({ ...f, supplier: v }))} placeholder="Supplier name" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Reference / PO No.">
                  <FormInput value={form.referenceNo} onChangeText={v => setForm(f => ({ ...f, referenceNo: v }))} placeholder="e.g. PO-1023" />
                </FormField>
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Expiry Date">
                  <FormInput value={form.expiryDate} onChangeText={v => setForm(f => ({ ...f, expiryDate: v }))} placeholder="YYYY-MM-DD" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Notes">
                  <FormInput value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional" />
                </FormField>
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <PrimaryButton label="Cancel" onPress={() => setModalOpen(false)} outline style={{ flex: 1 }} />
            <PrimaryButton label={saving ? 'Saving...' : 'Record Entry'} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
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
  addBtn:      { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#b3ccf5' },
  addBtnText:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.primaryDark },
  statsRow:    { flexDirection: 'row', gap: 8, padding: Spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statCard:    { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statIcon:    { fontSize: 18, marginBottom: 4 },
  statValue:   { fontSize: Typography.lg, fontWeight: '800', color: Colors.text },
  statLabel:   { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  searchWrap:  { padding: Spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  list:        { padding: Spacing.md, gap: 10 },
  txCard:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  txTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  txName:      { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  txQty:       { fontSize: Typography.md, fontWeight: '700', color: Colors.success },
  txMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  txMetaItem:  { fontSize: Typography.xs, color: Colors.textMuted },
  txBottom:    { flexDirection: 'row', justifyContent: 'space-between' },
  txBalance:   { fontSize: Typography.xs, color: Colors.textSecondary },
  txBy:        { fontSize: Typography.xs, color: Colors.textMuted },
  row2:        { flexDirection: 'row', gap: 12 },
  pickerWrap:  { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden' },
  pickerOption:{ padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerOptionActive: { backgroundColor: Colors.primaryLight },
  pickerOptionText:   { fontSize: Typography.sm, color: Colors.text },
  pickerOptionTextActive: { color: Colors.primary, fontWeight: '600' },
  modal:       { flex: 1, backgroundColor: Colors.card },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:  { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  modalClose:  { fontSize: Typography.xl, color: Colors.textMuted, padding: 4 },
  modalBody:   { flex: 1, padding: Spacing.lg },
  modalFooter: { flexDirection: 'row', gap: 12, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
});
