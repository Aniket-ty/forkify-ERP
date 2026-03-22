// app/(app)/inventory/stock-out.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, ActivityIndicator, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { inventoryService, recipeService } from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, FormField, FormInput, PrimaryButton, ScreenHeader} from '../../../src/components/common';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const REASONS = ['PRODUCTION', 'TRANSFER', 'WASTAGE', 'ADJUSTMENT', 'OTHER'];

export default function StockOutScreen() {
  const router = useRouter();
  const { branchId } = useBranch();
  const [transactions, setTransactions] = useState([]);
  const [ingredients, setIngredients]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(null);
  const [form, setForm] = useState({ ingredientId: '', quantity: '', reason: 'PRODUCTION', notes: '', referenceNo: '' });
  const [ingSearch, setIngSearch]       = useState('');
  const [ingModalOpen, setIngModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [txRes, ingRes] = await Promise.all([
        inventoryService.getTransactions(branchId, 'STOCK_OUT'),
        recipeService.getAllIngredients(),
      ]);
      setTransactions(txRes.data || []);
      setIngredients(ingRes.data || []);
    } catch { setError('Failed to load transactions'); }
    finally  { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const filtered = transactions.filter(t => !search || t.ingredientName?.toLowerCase().includes(search.toLowerCase()));
  const filteredIngs = ingredients.filter(i => !ingSearch || i.name.toLowerCase().includes(ingSearch.toLowerCase()));
  const selectedIng = ingredients.find(i => String(i.id) === String(form.ingredientId));

  const handleSave = async () => {
    if (!form.ingredientId || !form.quantity) { setError('Ingredient and quantity are required'); return; }
    setSaving(true);
    try {
      // Use negative quantity to denote stock out
      await inventoryService.stockIn({ ingredientId: parseInt(form.ingredientId), quantity: -Math.abs(parseFloat(form.quantity)), reason: form.reason, referenceNo: form.referenceNo || null, notes: form.notes || null, type: 'STOCK_OUT' }, branchId);
      setSuccess('Stock out recorded');
      setModalOpen(false);
      setForm({ ingredientId: '', quantity: '', reason: 'PRODUCTION', notes: '', referenceNo: '' });
      load();
    } catch (e) { setError(e.response?.data || 'Failed to record'); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScreenHeader
          title="📤 Stock Out"
          subtitle="Record outgoing stock usage"
          right={
            <TouchableOpacity style={S.addBtn} onPress={() => setModalOpen(true)}>
          <Text style={S.addBtnText}>+ New Entry</Text>
        </TouchableOpacity>
          }
        />

      <View style={{ flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.sm }}>
        {[{ label: 'Total', val: transactions.length, icon: '📋' }, { label: 'Today', val: transactions.filter(t => t.transactionDate === new Date().toISOString().split('T')[0]).length, icon: '📅' }].map((s, i) => (
          <View key={i} style={[S.stat, Shadow.sm]}>
            <Text style={{ fontSize: 22 }}>{s.icon}</Text>
            <Text style={S.statVal}>{s.val}</Text>
            <Text style={S.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search by ingredient..." />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : filtered.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>📤</Text><Text style={S.emptyT}>No stock out entries yet</Text><Text style={S.emptyS}>Tap + New Entry to record outgoing stock</Text></View>
      : <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          renderItem={({ item: tx }) => (
            <View style={[S.txCard, Shadow.sm]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={S.txName}>{tx.ingredientName}</Text>
                <Text style={{ fontWeight: '700', color: Colors.danger }}>-{Math.abs(tx.quantity)} {tx.unit}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Text style={S.txMeta}>📅 {tx.transactionDate}</Text>
                {tx.reason && <View style={S.reasonBadge}><Text style={S.reasonBadgeText}>{tx.reason}</Text></View>}
                <Text style={S.txMeta}>Balance: {tx.balanceAfter} {tx.unit}</Text>
              </View>
            </View>
          )} />}

      {/* Entry Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}><Text style={S.mTitle}>Record Stock Out</Text><TouchableOpacity onPress={() => setModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Ingredient *">
              <TouchableOpacity style={S.selectBtn} onPress={() => setIngModalOpen(true)}>
                <Text style={{ color: selectedIng ? Colors.text : Colors.textMuted }}>{selectedIng ? `${selectedIng.name} (${selectedIng.unit})` : 'Select ingredient'}</Text>
                <Text>▾</Text>
              </TouchableOpacity>
            </FormField>
            <FormField label="Quantity *"><FormInput value={form.quantity} onChangeText={v => setForm(f => ({ ...f, quantity: v }))} keyboardType="decimal-pad" placeholder="0.00" /></FormField>
            <FormField label="Reason">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {REASONS.map(r => (
                  <TouchableOpacity key={r} onPress={() => setForm(f => ({ ...f, reason: r }))}
                    style={[S.chip, form.reason === r && S.chipA]}>
                    <Text style={[S.chipT, form.reason === r && S.chipTA]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </FormField>
            <FormField label="Reference No"><FormInput value={form.referenceNo} onChangeText={v => setForm(f => ({ ...f, referenceNo: v }))} placeholder="e.g. PROD-001" /></FormField>
            <FormField label="Notes"><FormInput value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional notes" multiline /></FormField>
            <PrimaryButton label="Record Stock Out" onPress={handleSave} loading={saving} style={{ marginTop: 8, marginBottom: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Ingredient Picker */}
      <Modal visible={ingModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}><Text style={S.mTitle}>Select Ingredient</Text><TouchableOpacity onPress={() => setIngModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
          <View style={{ padding: Spacing.lg }}><SearchBar value={ingSearch} onChange={setIngSearch} placeholder="Search ingredients..." /></View>
          <FlatList data={filteredIngs} keyExtractor={i => String(i.id)} contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity style={S.ingRow} onPress={() => { setForm(f => ({ ...f, ingredientId: item.id })); setIngModalOpen(false); }}>
                <Text style={{ fontSize: Typography.base, fontWeight: '600', color: Colors.text }}>{item.name}</Text>
                <Text style={{ fontSize: Typography.sm, color: Colors.textMuted }}>{item.unit}</Text>
              </TouchableOpacity>
            )} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:   { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: Typography.xs, color: Colors.textMuted },
  addBtn:    { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText:{ fontSize: Typography.sm, fontWeight: '600', color: Colors.primary },
  stat:      { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border },
  statVal:   { fontSize: Typography.xl, fontWeight: '800', color: Colors.text },
  statLbl:   { fontSize: Typography.xs, color: Colors.textMuted },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:    { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptyS:    { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  txCard:    { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  txName:    { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  txMeta:    { fontSize: Typography.xs, color: Colors.textMuted },
  reasonBadge:{ backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  reasonBadgeText:{ fontSize: Typography.xs, fontWeight: '600', color: Colors.primary },
  mHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:    { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  mClose:    { fontSize: Typography.xl, color: Colors.textMuted },
  selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 11 },
  chip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, marginRight: 8, marginTop: 4 },
  chipA:     { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipT:     { fontSize: Typography.sm, color: Colors.textSecondary },
  chipTA:    { color: Colors.primary, fontWeight: '600' },
  ingRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
});
