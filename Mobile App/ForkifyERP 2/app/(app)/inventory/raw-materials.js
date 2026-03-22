// app/(app)/inventory/raw-materials.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { inventoryService, recipeService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, StatusBadge, LoadingScreen, EmptyState, PrimaryButton, FormField, FormInput, ProgressBar, ScreenHeader} from '../../../src/components/common';

const STATUS_COLORS = {
  GOOD:         { bg: '#f0fdf4', color: '#15803d' },
  WARNING:      { bg: '#fefce8', color: '#a16207' },
  LOW:          { bg: Colors.primaryLight, color: Colors.primaryDark },
  CRITICAL:     { bg: Colors.dangerLight, color: '#b91c1c' },
  OUT_OF_STOCK: { bg: '#f1f5f9', color: '#475569' },
};

const emptyForm = () => ({ ingredientId: '', currentQuantity: '0', minStockLevel: '0', location: '', unitCost: '', expiryDate: '' });

export default function RawMaterials() {
  const router  = useRouter();
  const { branchId }   = useBranch();
  const { canApprove } = usePermission();

  const [items,       setItems]       = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('all');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(emptyForm());
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!branchId) return;
    if (!silent) setLoading(true);
    try {
      const [invRes, ingRes] = await Promise.all([
        inventoryService.getAll(branchId),
        recipeService.getAllIngredients(),
      ]);
      setItems(invRes.data || []);
      setIngredients(ingRes.data || []);
    } catch { setError('Failed to load inventory'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const categories = [...new Set(items.map(i => i.category))].sort();
  const filtered = items.filter(item => {
    const ms = !search || item.ingredientName.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'all' || item.category === catFilter;
    return ms && mc;
  });

  const openAdd  = () => { setEditTarget(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ ingredientId: item.ingredientId, currentQuantity: String(item.currentQuantity), minStockLevel: String(item.minStockLevel), location: item.location || '', unitCost: item.unitCost || '', expiryDate: item.expiryDate || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.ingredientId) { Alert.alert('Error', 'Please select an ingredient'); return; }
    setSaving(true);
    try {
      await inventoryService.upsertItem({
        ingredientId:    parseInt(form.ingredientId),
        currentQuantity: parseFloat(form.currentQuantity) || 0,
        minStockLevel:   parseFloat(form.minStockLevel)   || 0,
        location:  form.location  || null,
        unitCost:  form.unitCost  ? parseFloat(form.unitCost) : null,
        expiryDate:form.expiryDate|| null,
      }, branchId);
      setSuccess(editTarget ? 'Item updated' : 'Item added');
      setModalOpen(false);
      load(true);
    } catch (e) { setError(e.response?.data || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen message="Loading raw materials..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader
          title="🌾  Raw Materials"
          subtitle={`${filtered.length} items`}
          right={canApprove ? (
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          ) : null}
        />

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />

      {/* Search + Filter */}
      <View style={styles.filters}>
        <View style={styles.searchBar}>
          <Text>🔍</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search items..." placeholderTextColor={Colors.textMuted} style={styles.searchInput} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['all', ...categories].map(c => (
            <TouchableOpacity key={c} style={[styles.chip, catFilter === c && styles.chipActive]} onPress={() => setCatFilter(c)}>
              <Text style={[styles.chipText, catFilter === c && styles.chipTextActive]}>{c === 'all' ? 'All' : c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="📦" title="No items found" subtitle={items.length === 0 ? 'Add your first item above' : 'Try adjusting your search'} action={canApprove ? openAdd : null} actionLabel="+ Add Item" />
        ) : filtered.map(item => {
          const sc  = STATUS_COLORS[item.status] || STATUS_COLORS.GOOD;
          const pct = item.minStockLevel > 0 ? Math.min(100, (item.currentQuantity / item.minStockLevel) * 100) : 100;
          const barColor = item.status === 'CRITICAL' ? Colors.danger : item.status === 'LOW' ? Colors.warning : Colors.success;
          return (
            <View key={item.id} style={[styles.itemCard, Shadow.sm, (item.status === 'CRITICAL' || item.status === 'OUT_OF_STOCK') && styles.criticalCard]}>
              <View style={styles.itemTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.ingredientName}</Text>
                  {item.location && <Text style={styles.itemLoc}>📍 {item.location}</Text>}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.color }]}>{item.status?.replace('_', ' ')}</Text>
                </View>
              </View>

              <View style={styles.itemMeta}>
                <Text style={styles.metaLabel}>Category</Text>
                <View style={styles.catBadge}><Text style={styles.catText}>{item.category}</Text></View>
              </View>

              <View style={styles.stockInfo}>
                <View style={{ flex: 1 }}>
                  <View style={styles.stockRow}>
                    <Text style={styles.stockLabel}>Current</Text>
                    <Text style={styles.stockVal}>{item.currentQuantity} {item.unit}</Text>
                  </View>
                  <View style={styles.stockRow}>
                    <Text style={styles.stockLabel}>Min Level</Text>
                    <Text style={styles.stockVal}>{item.minStockLevel} {item.unit}</Text>
                  </View>
                  <ProgressBar percent={pct} color={barColor} />
                </View>
                <View style={styles.costInfo}>
                  <Text style={styles.costLabel}>Unit Cost</Text>
                  <Text style={styles.costVal}>₹{parseFloat(item.unitCost || 0).toFixed(2)}</Text>
                  <Text style={styles.costLabel}>Total</Text>
                  <Text style={[styles.costVal, { color: Colors.primary }]}>₹{parseFloat(item.totalValue || 0).toFixed(0)}</Text>
                </View>
              </View>

              {item.expiryDate && (
                <Text style={styles.expiry}>📅 Expires: {item.expiryDate}</Text>
              )}

              {canApprove && (
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>✏️  Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editTarget ? 'Edit Inventory Item' : 'Add Inventory Item'}</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {!editTarget ? (
              <FormField label="Ingredient *">
                <View style={styles.pickerWrap}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {ingredients.map(ing => (
                      <TouchableOpacity key={ing.id} style={[styles.pickerOption, form.ingredientId === String(ing.id) && styles.pickerOptionActive]} onPress={() => setForm(f => ({ ...f, ingredientId: String(ing.id) }))}>
                        <Text style={[styles.pickerOptionText, form.ingredientId === String(ing.id) && styles.pickerOptionTextActive]}>{ing.name} ({ing.unit})</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </FormField>
            ) : (
              <FormField label="Ingredient">
                <FormInput value={editTarget.ingredientName} editable={false} />
              </FormField>
            )}
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Current Quantity">
                  <FormInput value={form.currentQuantity} onChangeText={v => setForm(f => ({ ...f, currentQuantity: v }))} keyboardType="decimal-pad" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Min Stock Level">
                  <FormInput value={form.minStockLevel} onChangeText={v => setForm(f => ({ ...f, minStockLevel: v }))} keyboardType="decimal-pad" />
                </FormField>
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Unit Cost">
                  <FormInput value={form.unitCost} onChangeText={v => setForm(f => ({ ...f, unitCost: v }))} keyboardType="decimal-pad" placeholder="Leave blank for default" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Expiry Date (YYYY-MM-DD)">
                  <FormInput value={form.expiryDate} onChangeText={v => setForm(f => ({ ...f, expiryDate: v }))} placeholder="2025-12-31" />
                </FormField>
              </View>
            </View>
            <FormField label="Storage Location">
              <FormInput value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))} placeholder="e.g. Cool Room A1" />
            </FormField>
          </ScrollView>
          <View style={styles.modalFooter}>
            <PrimaryButton label="Cancel" onPress={() => setModalOpen(false)} outline style={{ flex: 1 }} />
            <PrimaryButton label={saving ? 'Saving...' : 'Save'} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
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
  backIcon:    { fontSize: Typography.lg, color: Colors.text },
  title:       { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  sub:         { fontSize: Typography.xs, color: Colors.textMuted },
  addBtn:      { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#b3ccf5' },
  addBtnText:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.primaryDark },

  filters:     { padding: Spacing.md, gap: 8, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.text },
  chipScroll:  { marginTop: 4 },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bg, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive:  { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText:    { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive:{ color: Colors.primary, fontWeight: '700' },

  list:        { padding: Spacing.md, gap: 10 },
  itemCard:    { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  criticalCard:{ borderColor: '#fecaca', backgroundColor: '#fff5f5' },

  itemTop:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  itemName:    { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  itemLoc:     { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText:  { fontSize: Typography.xs, fontWeight: '700' },

  itemMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  metaLabel:   { fontSize: Typography.xs, color: Colors.textMuted },
  catBadge:    { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#f0f9ff', borderRadius: Radius.full },
  catText:     { fontSize: Typography.xs, fontWeight: '600', color: '#0369a1' },

  stockInfo:   { flexDirection: 'row', gap: 12, marginBottom: 6 },
  stockRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  stockLabel:  { fontSize: Typography.xs, color: Colors.textMuted },
  stockVal:    { fontSize: Typography.xs, fontWeight: '600', color: Colors.text },
  costInfo:    { alignItems: 'flex-end', gap: 2 },
  costLabel:   { fontSize: 10, color: Colors.textMuted },
  costVal:     { fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
  expiry:      { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4 },
  editBtn:     { marginTop: 10, paddingVertical: 8, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  editBtnText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },

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
