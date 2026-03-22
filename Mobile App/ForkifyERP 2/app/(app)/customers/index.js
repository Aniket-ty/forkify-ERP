// app/(app)/customers/index.js — Customer CRM
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customerService } from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, FormField, FormInput, PrimaryButton, ScreenHeader} from '../../../src/components/common';

export default function CustomersScreen() {
  const router = useRouter();
  const { branchId } = useBranch();
  const [customers, setCustomers] = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [addPointsModal, setAddPointsModal] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', birthday: '', loyaltyTier: 'BASIC' });
  const [pointsAmt, setPointsAmt] = useState('');

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        customerService.getAll(branchId, search || undefined),
        customerService.getStats(branchId),
      ]);
      setCustomers(cRes.data || []);
      setStats(sRes.data);
    } catch { setError('Failed to load customers'); }
    finally  { setLoading(false); }
  }, [branchId, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = async () => {
    if (!form.name || !form.phone) { setError('Name and phone are required'); return; }
    setSaving(true);
    try {
      await customerService.create({ ...form, branchId });
      setSuccess('Customer added');
      setModalOpen(false);
      setForm({ name: '', phone: '', email: '', birthday: '', loyaltyTier: 'BASIC' });
      load();
    } catch (e) { setError(e.response?.data || 'Failed to add customer'); }
    finally { setSaving(false); }
  };

  const handleAddPoints = async () => {
    if (!pointsAmt || !addPointsModal) return;
    try {
      await customerService.addPoints(addPointsModal.id, parseInt(pointsAmt));
      setSuccess(`${pointsAmt} points added to ${addPointsModal.name}`);
      setAddPointsModal(null);
      setPointsAmt('');
      load();
    } catch (e) { setError(e.response?.data || 'Failed to add points'); }
  };

  const TIERS = ['BASIC', 'SILVER', 'GOLD', 'PLATINUM'];
  const tierColors = { BASIC: '#94a3b8', SILVER: '#94a3b8', GOLD: '#f59e0b', PLATINUM: '#7c3aed' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScreenHeader
          title="👥 Customer CRM"
          subtitle="Manage loyalty & relationships"
          right={
            <TouchableOpacity style={S.addBtn} onPress={() => setModalOpen(true)}><Text style={S.addBtnText}>+ Add</Text></TouchableOpacity>
          }
        />

      {/* Stats */}
      {stats && (
        <View style={{ flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingBottom: Spacing.sm }}>
          {[
            { label: 'Total', val: stats.totalCustomers || customers.length, icon: '👥' },
            { label: 'Gold+', val: stats.goldCount || 0, icon: '⭐' },
            { label: 'Visits', val: stats.totalVisits || 0, icon: '🍴' },
            { label: 'Points', val: stats.totalPoints || 0, icon: '🎁' },
          ].map((s, i) => (
            <View key={i} style={[S.stat, Shadow.sm]}>
              <Text style={{ fontSize: 16 }}>{s.icon}</Text>
              <Text style={S.statVal}>{s.val}</Text>
              <Text style={S.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or phone..." />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : customers.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>👥</Text><Text style={S.emptyT}>No customers yet</Text><Text style={S.emptyS}>Add your first loyalty customer</Text></View>
      : <FlatList data={customers} keyExtractor={i => String(i.id)} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={[S.card, Shadow.sm]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[S.avatar, { backgroundColor: (tierColors[item.loyaltyTier] || '#94a3b8') + '22' }]}>
                  <Text style={[S.avatarText, { color: tierColors[item.loyaltyTier] || '#94a3b8' }]}>
                    {(item.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={S.custName}>{item.name}</Text>
                    <View style={[S.tierBadge, { backgroundColor: (tierColors[item.loyaltyTier] || '#94a3b8') + '22' }]}>
                      <Text style={[S.tierText, { color: tierColors[item.loyaltyTier] || '#94a3b8' }]}>{item.loyaltyTier}</Text>
                    </View>
                  </View>
                  <Text style={S.metaText}>📞 {item.phone}{item.email ? `  ✉️ ${item.email}` : ''}</Text>
                  <Text style={S.metaText}>🎁 {item.loyaltyPoints || 0} pts · 🍴 {item.totalVisits || 0} visits · 💰 ₹{parseFloat(item.totalSpend || 0).toFixed(0)}</Text>
                </View>
                <TouchableOpacity style={S.pointsBtn} onPress={() => setAddPointsModal(item)}>
                  <Text style={S.pointsBtnText}>+ pts</Text>
                </TouchableOpacity>
              </View>
            </View>
          )} />}

      {/* Add Customer Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}><Text style={S.mTitle}>New Customer</Text><TouchableOpacity onPress={() => setModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Name *"><FormInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Customer name" /></FormField>
            <FormField label="Phone *"><FormInput value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="+91 XXXXXXXXXX" keyboardType="phone-pad" /></FormField>
            <FormField label="Email"><FormInput value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="Optional email" keyboardType="email-address" /></FormField>
            <FormField label="Birthday (YYYY-MM-DD)"><FormInput value={form.birthday} onChangeText={v => setForm(f => ({ ...f, birthday: v }))} placeholder="e.g. 1990-05-15" /></FormField>
            <FormField label="Loyalty Tier">
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TIERS.map(t => (
                  <TouchableOpacity key={t} onPress={() => setForm(f => ({ ...f, loyaltyTier: t }))}
                    style={[S.tierBtn, form.loyaltyTier === t && S.tierBtnActive]}>
                    <Text style={[S.tierBtnText, form.loyaltyTier === t && S.tierBtnTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormField>
            <PrimaryButton label="Add Customer" onPress={handleCreate} loading={saving} style={{ marginTop: 8, marginBottom: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Points Modal */}
      <Modal visible={!!addPointsModal} animationType="fade" transparent>
        <View style={S.overlay}>
          <View style={S.pointsModal}>
            <Text style={S.mTitle}>Add Points to {addPointsModal?.name}</Text>
            <Text style={S.metaText}>Current: {addPointsModal?.loyaltyPoints || 0} points</Text>
            <FormInput value={pointsAmt} onChangeText={setPointsAmt} keyboardType="number-pad" placeholder="Enter points to add" style={{ marginVertical: Spacing.md }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={S.cancelBtn} onPress={() => { setAddPointsModal(null); setPointsAmt(''); }}><Text style={S.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={S.confirmBtn} onPress={handleAddPoints}><Text style={S.confirmBtnText}>Add Points</Text></TouchableOpacity>
            </View>
          </View>
        </View>
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
  stat:        { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 8, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.border },
  statVal:     { fontSize: Typography.sm, fontWeight: '800', color: Colors.text },
  statLbl:     { fontSize: 9, color: Colors.textMuted },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:      { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptyS:      { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  card:        { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  avatar:      { width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: Typography.lg, fontWeight: '700' },
  custName:    { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  metaText:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  tierBadge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  tierText:    { fontSize: 10, fontWeight: '700' },
  pointsBtn:   { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary },
  pointsBtnText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.primary },
  mHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:      { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  mClose:      { fontSize: Typography.xl, color: Colors.textMuted },
  tierBtn:     { flex: 1, paddingVertical: 8, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tierBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  tierBtnText: { fontSize: Typography.xs, fontWeight: '500', color: Colors.textSecondary },
  tierBtnTextActive: { color: Colors.primary, fontWeight: '700' },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  pointsModal: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', maxWidth: 320, gap: 8 },
  cancelBtn:   { flex: 1, paddingVertical: 10, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { fontWeight: '600', color: Colors.textSecondary },
  confirmBtn:  { flex: 1, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: Radius.md, alignItems: 'center' },
  confirmBtnText: { fontWeight: '700', color: '#fff' },
});
