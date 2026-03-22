// app/(app)/procurement/vendors.js — Approved Vendors (Admin only)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { procurementService } from '../../../src/services';
import { usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, ScreenHeader} from '../../../src/components/common';
import { Ionicons } from '@expo/vector-icons';

export default function VendorsScreen() {
  const router = useRouter();
  const { canEditMasterData } = usePermission();
  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await procurementService.getApprovedVendors();
      setVendors(data || []);
    } catch { setError('Failed to load approved vendors'); }
    finally  { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    try {
      await procurementService.approveVendor(id);
      setSuccess('Vendor approved');
      load();
    } catch (e) { setError(e.response?.data || 'Failed to approve vendor'); }
  };

  const filtered = vendors.filter(v =>
    !search ||
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  const approved   = vendors.filter(v => v.approved);
  const unapproved = vendors.filter(v => !v.approved);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScreenHeader
          title="✅ Approved Vendors"
          subtitle="Manage vendor approval status"
        />

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.sm }}>
        {[
          { label: 'Total', val: vendors.length, icon: '🏪' },
          { label: 'Approved', val: approved.length, icon: '✅' },
          { label: 'Pending', val: unapproved.length, icon: '⏳' },
        ].map((s, i) => (
          <View key={i} style={[S.stat, Shadow.sm]}>
            <Text style={{ fontSize: 18 }}>{s.icon}</Text>
            <Text style={S.statVal}>{s.val}</Text>
            <Text style={S.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search vendors..." />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : filtered.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>✅</Text><Text style={S.emptyT}>No vendors found</Text><Text style={S.emptyS}>Add suppliers in Supplier Management</Text></View>
      : <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <View style={[S.card, Shadow.sm]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={S.vendorName}>{item.name}</Text>
                    <View style={[S.approvedBadge, { backgroundColor: item.approved ? Colors.successLight : Colors.warningLight }]}>
                      <Text style={[S.approvedBadgeText, { color: item.approved ? '#15803d' : '#a16207' }]}>
                        {item.approved ? '✓ Approved' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  {item.contactPerson && <Text style={S.metaText}>👤 {item.contactPerson}</Text>}
                  {item.phone && <Text style={S.metaText}>📞 {item.phone}</Text>}
                  {item.email && <Text style={S.metaText}>✉️ {item.email}</Text>}
                  {item.categories && item.categories.length > 0 && (
                    <View style={S.catRow}>
                      {item.categories.slice(0, 3).map((c, idx) => (
                        <View key={idx} style={S.catChip}><Text style={S.catChipText}>{c}</Text></View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              {!item.approved && canEditMasterData && (
                <TouchableOpacity style={S.approveBtn} onPress={() => handleApprove(item.id)}>
                  <Text style={S.approveBtnText}>✓ Approve Vendor</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub:   { fontSize: Typography.xs, color: Colors.textMuted },
  stat:        { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.border },
  statVal:     { fontSize: Typography.md, fontWeight: '800', color: Colors.text },
  statLbl:     { fontSize: 10, color: Colors.textMuted },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:      { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptyS:      { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  card:        { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  vendorName:  { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  metaText:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 3 },
  approvedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  approvedBadgeText: { fontSize: Typography.xs, fontWeight: '700' },
  catRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  catChip:     { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  catChipText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: '600' },
  approveBtn:  { marginTop: 10, backgroundColor: Colors.successLight, borderRadius: Radius.md, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  approveBtnText: { fontSize: Typography.sm, fontWeight: '700', color: '#15803d' },
});
