// app/(app)/admin/branches.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { branchService, adminService } from '../../../src/services';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, FormField, FormInput, PrimaryButton } from '../../../src/components/common';

const TYPES = ['HQ', 'BRANCH'];

export default function BranchManagementScreen() {
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [summary, setSummary]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);
  const [form, setForm] = useState({ name: '', city: '', address: '', phone: '', type: 'BRANCH' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([branchService.getAll(), adminService.getBranchSummary()]);
      setBranches(bRes.data || []);
      setSummary(sRes.data || []);
    } catch { setError('Failed to load branches'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const openCreate = () => { setEditId(null); setForm({ name: '', city: '', address: '', phone: '', type: 'BRANCH' }); setError(null); setModalOpen(true); };
  const openEdit   = (b) => { setEditId(b.id); setForm({ name: b.name || '', city: b.city || '', address: b.address || '', phone: b.phone || '', type: b.type || 'BRANCH' }); setError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim()) { setError('Name and city are required'); return; }
    setSaving(true);
    try {
      if (editId) { await branchService.update(editId, form); setSuccess('Branch updated'); }
      else         { await branchService.create(form); setSuccess('Branch created'); }
      setModalOpen(false);
      load();
    } catch (e) { setError(e.response?.data || 'Failed'); }
    finally { setSaving(false); }
  };

  const getUserCount = (id) => (summary.find(s => s.id === id) || {}).userCount || 0;
  const filtered = branches.filter(b => !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.city?.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}><Text style={{ fontSize: 18 }}>←</Text></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={S.headerTitle}>🏪 Branch Management</Text><Text style={S.headerSub}>{branches.length} branches</Text></View>
        <TouchableOpacity style={S.addBtn} onPress={openCreate}><Text style={S.addBtnText}>+ New</Text></TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.sm }}>
        {[
          { label: 'Total', val: branches.length, icon: '🏪' },
          { label: 'HQ', val: branches.filter(b => b.type === 'HQ').length, icon: '🏢' },
          { label: 'Branches', val: branches.filter(b => b.type === 'BRANCH').length, icon: '🏬' },
          { label: 'Users', val: summary.reduce((s, b) => s + (b.userCount || 0), 0), icon: '👥' },
        ].map((s, i) => (
          <View key={i} style={[S.stat, Shadow.sm]}>
            <Text style={{ fontSize: 16 }}>{s.icon}</Text>
            <Text style={S.statVal}>{s.val}</Text>
            <Text style={S.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search branches..." />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          renderItem={({ item: b }) => (
            <View style={[S.card, Shadow.sm]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={S.branchName}>{b.name}</Text>
                    <View style={[S.typeBadge, { backgroundColor: b.type === 'HQ' ? '#7c3aed18' : Colors.primaryLight }]}>
                      <Text style={[S.typeText, { color: b.type === 'HQ' ? '#7c3aed' : Colors.primary }]}>{b.type}</Text>
                    </View>
                  </View>
                  <Text style={S.metaText}>📍 {b.city}{b.address ? ` · ${b.address}` : ''}</Text>
                  {b.phone && <Text style={S.metaText}>📞 {b.phone}</Text>}
                  <Text style={S.metaText}>👥 {getUserCount(b.id)} users · {b.active ? '✅ Active' : '❌ Inactive'}</Text>
                </View>
                <TouchableOpacity style={S.editBtn} onPress={() => openEdit(b)}>
                  <Text style={S.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )} />}

      {/* Create/Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}><Text style={S.mTitle}>{editId ? 'Edit Branch' : 'New Branch'}</Text><TouchableOpacity onPress={() => setModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Branch Name *"><FormInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Mumbai Central" /></FormField>
            <FormField label="City *"><FormInput value={form.city} onChangeText={v => setForm(f => ({ ...f, city: v }))} placeholder="e.g. Mumbai" /></FormField>
            <FormField label="Address"><FormInput value={form.address} onChangeText={v => setForm(f => ({ ...f, address: v }))} placeholder="Street address" /></FormField>
            <FormField label="Phone"><FormInput value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="+91 XXXXXXXXXX" keyboardType="phone-pad" /></FormField>
            <FormField label="Type">
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TYPES.map(t => (
                  <TouchableOpacity key={t} onPress={() => setForm(f => ({ ...f, type: t }))}
                    style={[S.typeBtn, form.type === t && S.typeBtnActive]}>
                    <Text style={[S.typeBtnText, form.type === t && S.typeBtnTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormField>
            <PrimaryButton label={editId ? 'Update Branch' : 'Create Branch'} onPress={handleSave} loading={saving} style={{ marginTop: 8, marginBottom: 32 }} />
          </ScrollView>
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
  stat:      { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 8, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.border },
  statVal:   { fontSize: Typography.sm, fontWeight: '800', color: Colors.text },
  statLbl:   { fontSize: 9, color: Colors.textMuted },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  card:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  branchName:{ fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  metaText:  { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 3 },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  typeText:  { fontSize: Typography.xs, fontWeight: '700' },
  editBtn:   { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  editBtnText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.primary },
  mHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:    { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  mClose:    { fontSize: Typography.xl, color: Colors.textMuted },
  typeBtn:   { flex: 1, paddingVertical: 10, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  typeBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  typeBtnText:   { fontSize: Typography.sm, color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.primary, fontWeight: '700' },
});
