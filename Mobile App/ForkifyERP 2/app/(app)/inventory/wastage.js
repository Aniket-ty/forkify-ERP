// app/(app)/inventory/wastage.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { inventoryService, recipeService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, LoadingScreen, EmptyState, PrimaryButton, FormField, FormInput, StatusBadge } from '../../../src/components/common';
import api from '../../../src/services/api';

const REASONS = ['EXPIRED','DAMAGED','SPOILED','OVERPRODUCTION','QUALITY_ISSUE','OTHER'];
const REASON_LABELS = { EXPIRED:'Expired', DAMAGED:'Damaged', SPOILED:'Spoiled', OVERPRODUCTION:'Overproduction', QUALITY_ISSUE:'Quality Issue', OTHER:'Other' };
const emptyForm = () => ({ wastageType: 'INGREDIENT', ingredientId: '', recipeId: '', quantity: '', reason: 'EXPIRED', referenceNo: '', notes: '' });

export default function Wastage() {
  const router = useRouter();
  const { branchId }   = useBranch();
  const { canApprove } = usePermission();

  const [records,      setRecords]     = useState([]);
  const [ingredients,  setIngredients] = useState([]);
  const [fgStock,      setFgStock]     = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [refreshing,   setRefreshing]  = useState(false);
  const [statusFilter, setStatusFilter]= useState('all');
  const [typeFilter,   setTypeFilter]  = useState('all');
  const [modalOpen,    setModalOpen]   = useState(false);
  const [form,         setForm]        = useState(emptyForm());
  const [saving,       setSaving]      = useState(false);
  const [error,        setError]       = useState(null);
  const [success,      setSuccess]     = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!branchId) return;
    if (!silent) setLoading(true);
    try {
      const [wRes, ingRes, fgRes] = await Promise.all([
        inventoryService.getWastage(branchId, statusFilter === 'all' ? null : statusFilter),
        recipeService.getAllIngredients(),
        api.get('/production/stock', { params: { branchId } }),
      ]);
      setRecords(wRes.data || []);
      setIngredients(ingRes.data || []);
      setFgStock(fgRes.data || []);
    } catch { setError('Failed to load wastage records'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const totalLoss     = records.filter(r => r.status === 'APPROVED').reduce((s, r) => s + parseFloat(r.costLoss || 0), 0);
  const pendingCount  = records.filter(r => r.status === 'PENDING').length;
  const approvedCount = records.filter(r => r.status === 'APPROVED').length;

  const filtered = records.filter(r => {
    const matchType = typeFilter === 'all' || r.wastageType === typeFilter;
    return matchType;
  });

  const handleSubmit = async () => {
    if (form.wastageType === 'INGREDIENT' && !form.ingredientId) { setError('Select an ingredient'); return; }
    if (form.wastageType === 'FINISHED_PRODUCT' && !form.recipeId) { setError('Select a finished product'); return; }
    if (!form.quantity || parseFloat(form.quantity) <= 0) { setError('Enter a valid quantity'); return; }
    setSaving(true);
    try {
      await inventoryService.logWastage({
        wastageType:  form.wastageType,
        ingredientId: form.wastageType === 'INGREDIENT' ? parseInt(form.ingredientId) : null,
        recipeId:     form.wastageType === 'FINISHED_PRODUCT' ? parseInt(form.recipeId) : null,
        quantity:     parseFloat(form.quantity),
        reason:       form.reason,
        referenceNo:  form.referenceNo || null,
        notes:        form.notes       || null,
      }, branchId);
      setSuccess('Wastage logged — awaiting manager approval');
      setModalOpen(false);
      setForm(emptyForm());
      load(true);
    } catch (e) { setError(e.response?.data || 'Failed to log wastage'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try { await inventoryService.approveWastage(id); setSuccess('Wastage approved'); load(true); }
    catch (e) { setError(e.response?.data || 'Failed'); }
  };
  const handleReject = async (id) => {
    try { await inventoryService.rejectWastage(id); setSuccess('Wastage rejected'); load(true); }
    catch (e) { setError(e.response?.data || 'Failed'); }
  };

  if (loading) return <LoadingScreen message="Loading wastage..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🗑  Wastage Management</Text>
          <Text style={styles.sub}>Log and approve ingredient losses</Text>
        </View>
        <TouchableOpacity style={styles.dangerBtn} onPress={() => { setForm(emptyForm()); setModalOpen(true); }}>
          <Text style={styles.dangerBtnText}>⚠️ Record</Text>
        </TouchableOpacity>
      </View>

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total Loss', value: `₹${totalLoss.toFixed(0)}`, icon: '📉', color: Colors.danger },
          { label: 'Pending',    value: pendingCount,  icon: '⏳', color: Colors.warning },
          { label: 'Approved',   value: approvedCount, icon: '✅', color: Colors.success },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, Shadow.sm]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <TouchableOpacity key={s} style={[styles.chip, statusFilter === s && styles.chipActive]} onPress={() => setStatusFilter(s)}>
            <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>{s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ width: 1, backgroundColor: Colors.border, marginHorizontal: 8 }} />
        {['all', 'INGREDIENT', 'FINISHED_PRODUCT'].map(t => (
          <TouchableOpacity key={t} style={[styles.chip, typeFilter === t && styles.chipActive]} onPress={() => setTypeFilter(t)}>
            <Text style={[styles.chipText, typeFilter === t && styles.chipTextActive]}>
              {t === 'all' ? 'All Types' : t === 'INGREDIENT' ? '🌾 Ingredients' : '🍽 Finished'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="🗑" title="No wastage records" subtitle='Use "Record" to log wastage' />
        ) : filtered.map(r => {
          const isFg = r.wastageType === 'FINISHED_PRODUCT';
          return (
            <View key={r.id} style={[styles.record, Shadow.sm]}>
              <View style={styles.recordTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.recordTypeRow}>
                    <View style={[styles.typeBadge, { backgroundColor: isFg ? '#fdf4ff' : '#f0f9ff' }]}>
                      <Text style={[styles.typeText, { color: isFg ? '#7e22ce' : '#0369a1' }]}>
                        {isFg ? '🍽 Finished' : '🌾 Ingredient'}
                      </Text>
                    </View>
                    <Text style={styles.recordDate}>📅 {r.wastageDate}</Text>
                  </View>
                  <Text style={styles.recordName}>{isFg ? r.recipeName : r.ingredientName}</Text>
                  <Text style={styles.recordQty}>{r.quantity} {r.unit || ''} — {REASON_LABELS[r.reason] || r.reason}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <StatusBadge status={r.status} />
                  <Text style={styles.costLoss}>₹{parseFloat(r.costLoss || 0).toFixed(2)}</Text>
                </View>
              </View>
              {r.loggedBy && <Text style={styles.recordBy}>By: {r.loggedBy}</Text>}
              {canApprove && r.status === 'PENDING' && (
                <View style={styles.approvalRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(r.id)}>
                    <Text style={styles.approveBtnText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(r.id)}>
                    <Text style={styles.rejectBtnText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Log Wastage Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🗑  Record Wastage</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />

            <View style={styles.typeToggle}>
              {[{ val: 'INGREDIENT', label: '🌾 Raw Ingredient' }, { val: 'FINISHED_PRODUCT', label: '🍽 Finished Product' }].map(o => (
                <TouchableOpacity key={o.val} style={[styles.toggleBtn, form.wastageType === o.val && styles.toggleBtnActive]} onPress={() => setForm({ ...emptyForm(), wastageType: o.val })}>
                  <Text style={[styles.toggleBtnText, form.wastageType === o.val && styles.toggleBtnTextActive]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.wastageType === 'INGREDIENT' ? (
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
              <FormField label="Finished Product *">
                <View style={styles.pickerWrap}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {fgStock.map(f => (
                      <TouchableOpacity key={f.recipeId} style={[styles.pickerOption, form.recipeId === String(f.recipeId) && styles.pickerOptionActive]} onPress={() => setForm(p => ({ ...p, recipeId: String(f.recipeId) }))}>
                        <Text style={[styles.pickerOptionText, form.recipeId === String(f.recipeId) && styles.pickerOptionTextActive]}>{f.recipeName} — {f.availableServings} servings</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </FormField>
            )}

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Quantity *">
                  <FormInput value={form.quantity} onChangeText={v => setForm(f => ({ ...f, quantity: v }))} keyboardType="decimal-pad" placeholder="0" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Reason *">
                  <View style={styles.pickerWrap}>
                    <ScrollView style={{ maxHeight: 150 }}>
                      {REASONS.map(r => (
                        <TouchableOpacity key={r} style={[styles.pickerOption, form.reason === r && styles.pickerOptionActive]} onPress={() => setForm(f => ({ ...f, reason: r }))}>
                          <Text style={[styles.pickerOptionText, form.reason === r && styles.pickerOptionTextActive]}>{REASON_LABELS[r]}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </FormField>
              </View>
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Reference No.">
                  <FormInput value={form.referenceNo} onChangeText={v => setForm(f => ({ ...f, referenceNo: v }))} placeholder="e.g. INV-456" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Notes">
                  <FormInput value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional" />
                </FormField>
              </View>
            </View>

            <View style={styles.notice}>
              <Text style={styles.noticeText}>⚠️  This will be <Text style={{ fontWeight: '700' }}>Pending</Text> until a manager approves. {form.wastageType === 'FINISHED_PRODUCT' ? 'Deducts from Finished Goods.' : 'Deducts from Raw Materials.'}</Text>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <PrimaryButton label="Cancel" onPress={() => setModalOpen(false)} outline style={{ flex: 1 }} />
            <PrimaryButton label={saving ? 'Logging...' : 'Log Wastage'} onPress={handleSubmit} loading={saving} danger style={{ flex: 1 }} />
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
  dangerBtn:   { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#fecaca' },
  dangerBtnText:{ fontSize: Typography.sm, fontWeight: '600', color: Colors.danger },
  statsRow:    { flexDirection: 'row', gap: 8, padding: Spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statCard:    { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statIcon:    { fontSize: 18, marginBottom: 4 },
  statValue:   { fontSize: Typography.lg, fontWeight: '800' },
  statLabel:   { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  filterScroll:{ backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent:{ padding: Spacing.md, flexDirection: 'row', alignItems: 'center' },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bg, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive:  { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText:    { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  list:        { padding: Spacing.md, gap: 10 },
  record:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  recordTop:   { flexDirection: 'row', gap: 10 },
  recordTypeRow:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  typeText:    { fontSize: Typography.xs, fontWeight: '700' },
  recordDate:  { fontSize: Typography.xs, color: Colors.textMuted },
  recordName:  { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  recordQty:   { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  costLoss:    { fontSize: Typography.sm, fontWeight: '700', color: Colors.danger },
  recordBy:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 6 },
  approvalRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  approveBtn:  { flex: 1, paddingVertical: 8, backgroundColor: '#f0fdf4', borderRadius: Radius.md, borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center' },
  approveBtnText:{ fontSize: Typography.sm, fontWeight: '600', color: '#15803d' },
  rejectBtn:   { flex: 1, paddingVertical: 8, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' },
  rejectBtnText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.danger },
  modal:       { flex: 1, backgroundColor: Colors.card },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:  { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  modalClose:  { fontSize: Typography.xl, color: Colors.textMuted, padding: 4 },
  modalBody:   { flex: 1, padding: Spacing.lg },
  modalFooter: { flexDirection: 'row', gap: 12, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  typeToggle:  { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  toggleBtn:   { flex: 1, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, alignItems: 'center' },
  toggleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  toggleBtnText:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  toggleBtnTextActive: { color: Colors.primary },
  row2:        { flexDirection: 'row', gap: 12 },
  pickerWrap:  { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden' },
  pickerOption:{ padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerOptionActive: { backgroundColor: Colors.primaryLight },
  pickerOptionText:   { fontSize: Typography.sm, color: Colors.text },
  pickerOptionTextActive: { color: Colors.primary, fontWeight: '600' },
  notice:      { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.sm },
  noticeText:  { fontSize: Typography.sm, color: '#92400e', lineHeight: 20 },
});
