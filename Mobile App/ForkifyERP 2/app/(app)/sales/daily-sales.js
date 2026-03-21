// app/(app)/sales/daily-sales.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { salesService, recipeService } from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, FormField, FormInput, PrimaryButton, SearchBar } from '../../../src/components/common';

export default function DailySalesScreen() {
  const router = useRouter();
  const { branchId } = useBranch();
  const [sales, setSales]         = useState([]);
  const [recipes, setRecipes]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [entries, setEntries]     = useState([{ recipeId: '', quantity: 1, salePrice: '' }]);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        salesService.getSales(branchId, date),
        recipeService.getAll({ status: 'ACTIVE' }),
      ]);
      setSales(sRes.data || []);
      setRecipes(rRes.data || []);
    } catch { setError('Failed to load sales'); }
    finally  { setLoading(false); }
  }, [branchId, date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
  const totalCovers  = sales.reduce((sum, s) => sum + parseInt(s.quantitySold || 0), 0);

  const addEntry = () => setEntries(e => [...e, { recipeId: '', quantity: 1, salePrice: '' }]);
  const removeEntry = (i) => setEntries(e => e.filter((_, idx) => idx !== i));
  const updateEntry = (i, key, val) => setEntries(e => e.map((en, idx) => idx === i ? { ...en, [key]: val } : en));

  const handleSave = async () => {
    const validEntries = entries.filter(e => e.recipeId && e.quantity);
    if (validEntries.length === 0) { setError('Add at least one sale entry'); return; }
    setSaving(true);
    try {
      await salesService.logSales({
        saleDate: date,
        items: validEntries.map(e => ({
          recipeId:  parseInt(e.recipeId),
          quantity:  parseInt(e.quantity),
          salePrice: e.salePrice ? parseFloat(e.salePrice) : null,
        })),
      }, branchId);
      setSuccess('Sales logged successfully');
      setModalOpen(false);
      setEntries([{ recipeId: '', quantity: 1, salePrice: '' }]);
      load();
    } catch (e) { setError(e.response?.data || 'Failed to log sales'); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}><Text style={{ fontSize: 18 }}>←</Text></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={S.headerTitle}>🛒 Daily Sales</Text><Text style={S.headerSub}>Log and view daily revenue</Text></View>
        <TouchableOpacity style={S.addBtn} onPress={() => setModalOpen(true)}><Text style={S.addBtnText}>+ Log Sales</Text></TouchableOpacity>
      </View>

      {/* Date selector + KPIs */}
      <View style={{ padding: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.md }}>
        <View style={S.dateRow}>
          <Text style={S.dateLabel}>📅 Date:</Text>
          <TouchableOpacity style={S.datePicker}>
            <Text style={S.dateVal}>{date}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <View style={[S.kpi, Shadow.sm]}>
            <Text style={S.kpiIcon}>💰</Text>
            <Text style={S.kpiVal}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
            <Text style={S.kpiLbl}>Revenue</Text>
          </View>
          <View style={[S.kpi, Shadow.sm]}>
            <Text style={S.kpiIcon}>🍴</Text>
            <Text style={S.kpiVal}>{totalCovers}</Text>
            <Text style={S.kpiLbl}>Covers</Text>
          </View>
          <View style={[S.kpi, Shadow.sm]}>
            <Text style={S.kpiIcon}>📋</Text>
            <Text style={S.kpiVal}>{sales.length}</Text>
            <Text style={S.kpiLbl}>Entries</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : sales.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>🛒</Text><Text style={S.emptyT}>No sales logged for {date}</Text><Text style={S.emptyS}>Tap + Log Sales to record today's revenue</Text></View>
      : <FlatList data={sales} keyExtractor={i => String(i.id)} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={[S.card, Shadow.sm]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={S.recipeName}>{item.recipeName}</Text>
                  <Text style={S.metaText}>{item.quantitySold} covers · ₹{parseFloat(item.salePrice || 0).toFixed(2)}/cover</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={S.revenue}>₹{parseFloat(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
                  <Text style={S.metaText}>{item.saleDate}</Text>
                </View>
              </View>
            </View>
          )} />}

      {/* Log Sales Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}><Text style={S.mTitle}>Log Sales</Text><TouchableOpacity onPress={() => setModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Sale Date"><FormInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" /></FormField>

            <Text style={S.sectionTitle}>Sale Entries</Text>
            {entries.map((entry, i) => (
              <View key={i} style={S.entryCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontWeight: '600', color: Colors.text }}>Entry {i + 1}</Text>
                  {i > 0 && <TouchableOpacity onPress={() => removeEntry(i)}><Text style={{ color: Colors.danger }}>✕</Text></TouchableOpacity>}
                </View>
                <FormField label="Recipe">
                  <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md }}>
                    {recipes.slice(0, 15).map(r => (
                      <TouchableOpacity key={r.id} onPress={() => updateEntry(i, 'recipeId', r.id)}
                        style={[S.recipeRow, String(entry.recipeId) === String(r.id) && S.recipeRowActive]}>
                        <Text style={{ fontWeight: String(entry.recipeId) === String(r.id) ? '700' : '400', color: Colors.text }}>{r.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </FormField>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}><FormField label="Qty"><FormInput value={String(entry.quantity)} onChangeText={v => updateEntry(i, 'quantity', v)} keyboardType="number-pad" placeholder="1" /></FormField></View>
                  <View style={{ flex: 1 }}><FormField label="Price/cover (₹)"><FormInput value={entry.salePrice} onChangeText={v => updateEntry(i, 'salePrice', v)} keyboardType="decimal-pad" placeholder="0.00" /></FormField></View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={S.addEntryBtn} onPress={addEntry}>
              <Text style={S.addEntryText}>+ Add Another Entry</Text>
            </TouchableOpacity>

            <PrimaryButton label="Log Sales" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md, marginBottom: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle:  { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub:    { fontSize: Typography.xs, color: Colors.textMuted },
  addBtn:       { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.primary },
  dateRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateLabel:    { fontSize: Typography.base, color: Colors.textSecondary },
  datePicker:   { backgroundColor: Colors.card, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border },
  dateVal:      { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  kpi:          { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.border },
  kpiIcon:      { fontSize: 20 },
  kpiVal:       { fontSize: Typography.md, fontWeight: '800', color: Colors.text },
  kpiLbl:       { fontSize: Typography.xs, color: Colors.textMuted },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:       { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptyS:       { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  card:         { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  recipeName:   { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  metaText:     { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  revenue:      { fontSize: Typography.md, fontWeight: '800', color: Colors.primary },
  mHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:       { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  mClose:       { fontSize: Typography.xl, color: Colors.textMuted },
  sectionTitle: { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  entryCard:    { backgroundColor: Colors.bg, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  recipeRow:    { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  recipeRowActive: { backgroundColor: Colors.primaryLight },
  addEntryBtn:  { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  addEntryText: { fontSize: Typography.base, fontWeight: '600', color: Colors.primary },
});
