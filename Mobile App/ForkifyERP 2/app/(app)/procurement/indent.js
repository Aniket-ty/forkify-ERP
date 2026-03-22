// app/(app)/procurement/indent.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { procurementService, recipeService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, LoadingScreen, EmptyState, PrimaryButton, FormField, FormInput, StatusBadge, ScreenHeader} from '../../../src/components/common';
import { Ionicons } from '@expo/vector-icons';

const emptyItem = () => ({ ingredientId: '', quantity: '', notes: '' });
const emptyForm = () => ({ priority: 'MEDIUM', notes: '', items: [emptyItem()] });

export default function MaterialIndent() {
  const router = useRouter();
  const { branchId }   = useBranch();
  const { canApprove } = usePermission();

  const [indents,    setIndents]    = useState([]);
  const [ingredients,setIngredients]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter,setStatusFilter]=useState('all');
  const [modal,      setModal]      = useState(false);
  const [form,       setForm]       = useState(emptyForm());
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!branchId) return;
    if (!silent) setLoading(true);
    try {
      const [iRes, ingRes] = await Promise.all([
        procurementService.getIndents(branchId, statusFilter === 'all' ? null : statusFilter),
        recipeService.getAllIngredients(),
      ]);
      setIndents(iRes.data || []);
      setIngredients(ingRes.data || []);
    } catch { setError('Failed to load indents'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, key, val) => setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [key]: val } : it) }));

  const handleSubmit = async () => {
    const valid = form.items.filter(it => it.ingredientId && it.quantity);
    if (valid.length === 0) { setError('Add at least one item with ingredient and quantity'); return; }
    setSaving(true);
    try {
      await procurementService.createIndent({
        priority: form.priority,
        notes:    form.notes || null,
        items: valid.map(it => ({ ingredientId: parseInt(it.ingredientId), quantity: parseFloat(it.quantity), notes: it.notes || null })),
      }, branchId);
      setSuccess('Indent raised successfully');
      setModal(false);
      setForm(emptyForm());
      load(true);
    } catch (e) { setError(e.response?.data || 'Failed to raise indent'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try { await procurementService.approveIndent(id); setSuccess('Indent approved'); load(true); }
    catch (e) { setError(e.response?.data || 'Failed'); }
  };
  const handleReject = async (id) => {
    try { await procurementService.rejectIndent(id, 'Rejected via mobile'); setSuccess('Indent rejected'); load(true); }
    catch (e) { setError(e.response?.data || 'Failed'); }
  };

  const STATUSES = ['all', 'PENDING', 'APPROVED', 'REJECTED', 'CONVERTED'];
  const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  if (loading) return <LoadingScreen message="Loading indents..." />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="📋  Material Indent"
          subtitle={`${indents.length} requests`}
          right={
            <TouchableOpacity style={styles.addBtn} onPress={() => { setForm(emptyForm()); setModal(true); }}>
          <Text style={styles.addBtnText}>+ Raise</Text>
        </TouchableOpacity>
          }
        />

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />

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
        {indents.length === 0 ? (
          <EmptyState icon="📋" title="No indent requests" subtitle="Raise a request for materials you need" action={() => { setForm(emptyForm()); setModal(true); }} actionLabel="+ Raise Indent" />
        ) : indents.map(indent => {
          const priorityColor = { LOW: Colors.success, MEDIUM: Colors.warning, HIGH: Colors.danger, URGENT: '#7e22ce' }[indent.priority] || Colors.textMuted;
          return (
            <View key={indent.id} style={[styles.indentCard, Shadow.sm]}>
              <View style={styles.indentTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.indentNum}>{indent.indentNumber || `IND-${indent.id}`}</Text>
                  <Text style={styles.indentDate}>📅 {indent.createdDate || '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <StatusBadge status={indent.status} />
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}>
                    <Text style={[styles.priorityText, { color: priorityColor }]}>{indent.priority}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.indentItems}>
                {(indent.items || []).slice(0, 3).map((it, i) => (
                  <Text key={i} style={styles.indentItem}>• {it.ingredientName}: {it.quantity} {it.unit}</Text>
                ))}
                {(indent.items || []).length > 3 && (
                  <Text style={styles.indentMore}>+{indent.items.length - 3} more items</Text>
                )}
              </View>

              {indent.notes && <Text style={styles.indentNotes}>📝 {indent.notes}</Text>}
              <Text style={styles.indentBy}>By: {indent.requestedBy || '—'}</Text>

              {canApprove && indent.status === 'PENDING' && (
                <View style={styles.approvalRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(indent.id)}>
                    <Text style={styles.approveBtnText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(indent.id)}>
                    <Text style={styles.rejectBtnText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Raise Indent Modal */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📋  Raise Indent</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />

            <FormField label="Priority">
              <View style={styles.priorityRow}>
                {PRIORITIES.map(p => {
                  const col = { LOW: Colors.success, MEDIUM: Colors.warning, HIGH: Colors.danger, URGENT: '#7e22ce' }[p];
                  return (
                    <TouchableOpacity key={p} style={[styles.priorityBtn, form.priority === p && { backgroundColor: col + '20', borderColor: col }]} onPress={() => setForm(f => ({ ...f, priority: p }))}>
                      <Text style={[styles.priorityBtnText, form.priority === p && { color: col }]}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </FormField>

            <FormField label="Notes">
              <FormInput value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Reason for request..." multiline />
            </FormField>

            <Text style={styles.itemsLabel}>Items Requested</Text>
            {form.items.map((item, idx) => (
              <View key={idx} style={styles.itemBlock}>
                <View style={styles.itemBlockHeader}>
                  <Text style={styles.itemBlockNum}>Item #{idx + 1}</Text>
                  {form.items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(idx)}>
                      <Text style={styles.removeItemText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <FormField label="Ingredient *">
                  <View style={styles.pickerWrap}>
                    <ScrollView style={{ maxHeight: 130 }}>
                      {ingredients.map(ing => (
                        <TouchableOpacity key={ing.id} style={[styles.pickerOption, item.ingredientId === String(ing.id) && styles.pickerOptionActive]} onPress={() => updateItem(idx, 'ingredientId', String(ing.id))}>
                          <Text style={[styles.pickerOptionText, item.ingredientId === String(ing.id) && styles.pickerOptionTextActive]}>{ing.name} ({ing.unit})</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </FormField>
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <FormField label="Quantity *">
                      <FormInput value={item.quantity} onChangeText={v => updateItem(idx, 'quantity', v)} keyboardType="decimal-pad" placeholder="0.00" />
                    </FormField>
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label="Notes">
                      <FormInput value={item.notes} onChangeText={v => updateItem(idx, 'notes', v)} placeholder="Optional" />
                    </FormField>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
              <Text style={styles.addItemText}>+ Add Another Item</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.modalFooter}>
            <PrimaryButton label="Cancel" onPress={() => setModal(false)} outline style={{ flex: 1 }} />
            <PrimaryButton label={saving ? 'Raising...' : 'Raise Indent'} onPress={handleSubmit} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  backIcon:     { fontSize: Typography.lg },
  title:        { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  sub:          { fontSize: Typography.xs, color: Colors.textMuted },
  addBtn:       { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#b3ccf5' },
  addBtnText:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.primaryDark },
  filterScroll: { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent:{ padding: Spacing.md, flexDirection: 'row' },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bg, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive:   { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText:     { fontSize: Typography.xs, color: Colors.textSecondary },
  chipTextActive:{ color: Colors.primary, fontWeight: '700' },
  list:         { padding: Spacing.md, gap: 10 },
  indentCard:   { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  indentTop:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  indentNum:    { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  indentDate:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  priorityBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  priorityText: { fontSize: Typography.xs, fontWeight: '700' },
  indentItems:  { marginBottom: 6 },
  indentItem:   { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 2 },
  indentMore:   { fontSize: Typography.xs, color: Colors.textMuted, fontStyle: 'italic' },
  indentNotes:  { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: 4 },
  indentBy:     { fontSize: Typography.xs, color: Colors.textMuted },
  approvalRow:  { flexDirection: 'row', gap: 8, marginTop: 10 },
  approveBtn:   { flex: 1, paddingVertical: 8, backgroundColor: '#f0fdf4', borderRadius: Radius.md, borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center' },
  approveBtnText:{ fontSize: Typography.sm, fontWeight: '600', color: '#15803d' },
  rejectBtn:    { flex: 1, paddingVertical: 8, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' },
  rejectBtnText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.danger },
  modal:        { flex: 1, backgroundColor: Colors.card },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:   { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  modalClose:   { fontSize: Typography.xl, color: Colors.textMuted, padding: 4 },
  modalBody:    { flex: 1, padding: Spacing.lg },
  modalFooter:  { flexDirection: 'row', gap: 12, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  priorityRow:  { flexDirection: 'row', gap: 8 },
  priorityBtn:  { flex: 1, paddingVertical: 9, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.bg },
  priorityBtnText:{ fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  itemsLabel:   { fontSize: Typography.sm, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  itemBlock:    { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  itemBlockHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  itemBlockNum: { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },
  removeItemText:{ fontSize: Typography.xs, color: Colors.danger, fontWeight: '600' },
  row2:         { flexDirection: 'row', gap: 12 },
  pickerWrap:   { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden' },
  pickerOption: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerOptionActive:{ backgroundColor: Colors.primaryLight },
  pickerOptionText:  { fontSize: Typography.sm, color: Colors.text },
  pickerOptionTextActive:{ color: Colors.primary, fontWeight: '600' },
  addItemBtn:   { paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed', alignItems: 'center', marginBottom: Spacing.lg },
  addItemText:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.primary },
});
