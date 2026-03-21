// app/(app)/procurement/suppliers.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { procurementService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, LoadingScreen, EmptyState, PrimaryButton, FormField, FormInput } from '../../../src/components/common';

const emptyForm = () => ({ name: '', contactPerson: '', phone: '', email: '', address: '', category: '', notes: '' });

export default function SupplierManagement() {
  const router = useRouter();
  const { branchId }   = useBranch();
  const { canApprove } = usePermission();

  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(emptyForm());
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!branchId) return;
    if (!silent) setLoading(true);
    try {
      const { data } = await procurementService.getSuppliers(branchId);
      setSuppliers(data || []);
    } catch { setError('Failed to load suppliers'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const filtered = suppliers.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditId(null); setForm(emptyForm()); setModal(true); };
  const openEdit   = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, contactPerson: s.contactPerson || '', phone: s.phone || '', email: s.email || '', address: s.address || '', category: s.category || '', notes: s.notes || '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Supplier name is required'); return; }
    setSaving(true);
    try {
      if (editId) {
        const { data } = await procurementService.updateSupplier(editId, form);
        setSuppliers(prev => prev.map(s => s.id === editId ? data : s));
        setSuccess('Supplier updated');
      } else {
        const { data } = await procurementService.createSupplier(form, branchId);
        setSuppliers(prev => [...prev, data]);
        setSuccess('Supplier added');
      }
      setModal(false);
    } catch (e) { setError(e.response?.data || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await procurementService.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      setSuccess('Supplier removed');
    } catch (e) { setError(e.response?.data || 'Failed'); }
  };

  if (loading) return <LoadingScreen message="Loading suppliers..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🤝  Suppliers</Text>
          <Text style={styles.sub}>{suppliers.length} suppliers</Text>
        </View>
        {canApprove && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />

      <View style={styles.searchWrap}>
        <Text>🔍</Text>
        <FormInput value={search} onChangeText={setSearch} placeholder="Search suppliers..." style={{ flex: 1, borderWidth: 0, paddingVertical: 2, marginBottom: 0 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="🤝" title="No suppliers found" subtitle="Add your first supplier" action={canApprove ? openCreate : null} actionLabel="+ Add Supplier" />
        ) : filtered.map(s => (
          <View key={s.id} style={[styles.supplierCard, Shadow.sm]}>
            <View style={styles.supplierTop}>
              <View style={styles.supplierIcon}>
                <Text style={styles.supplierIconText}>{s.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.supplierNameRow}>
                  <Text style={styles.supplierName}>{s.name}</Text>
                  {s.approved && (
                    <View style={styles.approvedBadge}>
                      <Text style={styles.approvedText}>✓ Approved</Text>
                    </View>
                  )}
                </View>
                {s.category && <Text style={styles.supplierCategory}>{s.category}</Text>}
              </View>
            </View>

            <View style={styles.supplierInfo}>
              {s.contactPerson && <Text style={styles.infoItem}>👤 {s.contactPerson}</Text>}
              {s.phone         && <Text style={styles.infoItem}>📞 {s.phone}</Text>}
              {s.email         && <Text style={styles.infoItem}>✉️ {s.email}</Text>}
              {s.address       && <Text style={styles.infoItem}>📍 {s.address}</Text>}
            </View>

            {canApprove && (
              <View style={styles.supplierActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(s)}>
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(s.id)}>
                  <Text style={styles.deleteBtnText}>🗑 Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Supplier' : 'Add Supplier'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Supplier Name *"><FormInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Fresh Farms Ltd" /></FormField>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Contact Person"><FormInput value={form.contactPerson} onChangeText={v => setForm(f => ({ ...f, contactPerson: v }))} placeholder="Name" /></FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Category"><FormInput value={form.category} onChangeText={v => setForm(f => ({ ...f, category: v }))} placeholder="e.g. Vegetables" /></FormField>
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Phone"><FormInput value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="Phone number" keyboardType="phone-pad" /></FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Email"><FormInput value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="Email" keyboardType="email-address" /></FormField>
              </View>
            </View>
            <FormField label="Address"><FormInput value={form.address} onChangeText={v => setForm(f => ({ ...f, address: v }))} placeholder="Full address" multiline /></FormField>
            <FormField label="Notes"><FormInput value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Additional notes" multiline /></FormField>
          </ScrollView>
          <View style={styles.modalFooter}>
            <PrimaryButton label="Cancel" onPress={() => setModal(false)} outline style={{ flex: 1 }} />
            <PrimaryButton label={saving ? 'Saving...' : 'Save'} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
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
  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, paddingHorizontal: Spacing.lg, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  list:         { padding: Spacing.md, gap: 10 },
  supplierCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  supplierTop:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  supplierIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  supplierIconText:{ fontSize: Typography.xl, fontWeight: '700', color: Colors.primary },
  supplierNameRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  supplierName: { fontSize: Typography.md, fontWeight: '700', color: Colors.text, flex: 1 },
  approvedBadge:{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f0fdf4', borderRadius: Radius.full, borderWidth: 1, borderColor: '#bbf7d0' },
  approvedText: { fontSize: Typography.xs, fontWeight: '700', color: '#15803d' },
  supplierCategory:{ fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  supplierInfo: { gap: 4, marginBottom: 8 },
  infoItem:     { fontSize: Typography.sm, color: Colors.textSecondary },
  supplierActions:{ flexDirection: 'row', gap: 8 },
  editBtn:      { flex: 1, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg, alignItems: 'center' },
  editBtnText:  { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  deleteBtn:    { flex: 1, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: '#fecaca', backgroundColor: Colors.dangerLight, alignItems: 'center' },
  deleteBtnText:{ fontSize: Typography.xs, fontWeight: '600', color: Colors.danger },
  row2:         { flexDirection: 'row', gap: 12 },
  modal:        { flex: 1, backgroundColor: Colors.card },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:   { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  modalClose:   { fontSize: Typography.xl, color: Colors.textMuted, padding: 4 },
  modalBody:    { flex: 1, padding: Spacing.lg },
  modalFooter:  { flexDirection: 'row', gap: 12, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
});
