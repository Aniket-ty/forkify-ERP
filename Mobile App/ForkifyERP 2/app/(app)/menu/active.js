// app/(app)/menu/active.js — Active Menu
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { menuService } from '../../../src/services';
import { usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, StatusBadge, ScreenHeader} from '../../../src/components/common';

export default function ActiveMenuScreen() {
  const router = useRouter();
  const { canEditMasterData, canApprove } = usePermission();
  const [menus, setMenus]         = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [catFilter, setCatFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await menuService.getAll(false);
      setMenus(data || []);
    } catch { setError('Failed to load menus'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const handleToggle = async (menu) => {
    try {
      if (menu.active) {
        await menuService.deactivate(menu.id);
        setSuccess(`${menu.name} deactivated`);
      } else {
        await menuService.activate(menu.id);
        setSuccess(`${menu.name} activated`);
      }
      load();
    } catch (e) { setError(e.response?.data || 'Failed'); }
  };

  const allCategories = [...new Set(menus.flatMap(m => (m.items || []).map(i => i.category)).filter(Boolean))];
  const activeMenus   = menus.filter(m => m.active);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScreenHeader
          title="📋 Menu Management"
          subtitle={`${activeMenus.length} active menus`}
        />

      <View style={{ flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.sm }}>
        {[{ label: 'Total', val: menus.length, icon: '📋' }, { label: 'Active', val: activeMenus.length, icon: '✅' }].map((s, i) => (
          <View key={i} style={[S.stat, Shadow.sm]}>
            <Text style={{ fontSize: 20 }}>{s.icon}</Text>
            <Text style={S.statVal}>{s.val}</Text>
            <Text style={S.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search menus..." />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : menus.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>📋</Text><Text style={S.emptyT}>No menus created yet</Text><Text style={S.emptyS}>Create menus from HQ to manage offerings</Text></View>
      : <FlatList
          data={menus.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          renderItem={({ item: menu }) => (
            <TouchableOpacity style={[S.card, Shadow.sm, !menu.active && S.cardInactive]} onPress={() => setSelectedMenu(menu)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={S.menuName}>{menu.name}</Text>
                  {menu.description && <Text style={S.menuDesc}>{menu.description}</Text>}
                  <Text style={S.metaText}>{(menu.items || []).length} items · {menu.type || 'Standard'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[S.activeBadge, { backgroundColor: menu.active ? Colors.successLight : Colors.bg }]}>
                    <Text style={[S.activeBadgeText, { color: menu.active ? '#15803d' : Colors.textMuted }]}>
                      {menu.active ? '● Active' : '○ Inactive'}
                    </Text>
                  </View>
                  {canApprove && (
                    <TouchableOpacity style={[S.toggleBtn, { backgroundColor: menu.active ? Colors.dangerLight : Colors.primaryLight }]}
                      onPress={() => handleToggle(menu)}>
                      <Text style={[S.toggleBtnText, { color: menu.active ? Colors.danger : Colors.primary }]}>
                        {menu.active ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )} />}

      {/* Menu Detail Modal */}
      {selectedMenu && (
        <Modal visible animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
            <View style={S.mHeader}>
              <Text style={S.mTitle}>{selectedMenu.name}</Text>
              <TouchableOpacity onPress={() => setSelectedMenu(null)}><Text style={S.mClose}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ padding: Spacing.lg }}>
              {(selectedMenu.items || []).map((item, idx) => (
                <View key={idx} style={[S.itemCard, Shadow.sm]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={S.itemName}>{item.displayName || item.recipeName}</Text>
                      <Text style={S.itemCat}>{item.category}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={S.itemPrice}>₹{parseFloat(item.basePrice || 0).toFixed(0)}</Text>
                      <View style={[S.availBadge, { backgroundColor: item.available !== false ? Colors.successLight : Colors.dangerLight }]}>
                        <Text style={[S.availText, { color: item.available !== false ? '#15803d' : Colors.danger }]}>
                          {item.available !== false ? 'Available' : 'Unavailable'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle:  { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub:    { fontSize: Typography.xs, color: Colors.textMuted },
  stat:         { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.border },
  statVal:      { fontSize: Typography.xl, fontWeight: '800', color: Colors.text },
  statLbl:      { fontSize: Typography.xs, color: Colors.textMuted },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:       { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptyS:       { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  card:         { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  cardInactive: { opacity: 0.7 },
  menuName:     { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  menuDesc:     { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  metaText:     { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },
  activeBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  activeBadgeText: { fontSize: Typography.xs, fontWeight: '700' },
  toggleBtn:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.md },
  toggleBtnText:{ fontSize: Typography.xs, fontWeight: '700' },
  mHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:       { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, flex: 1 },
  mClose:       { fontSize: Typography.xl, color: Colors.textMuted },
  itemCard:     { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  itemName:     { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  itemCat:      { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  itemPrice:    { fontSize: Typography.md, fontWeight: '700', color: Colors.primary },
  availBadge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
  availText:    { fontSize: 10, fontWeight: '700' },
});
