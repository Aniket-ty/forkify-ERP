// app/(app)/menu/pricing.js — Branch Pricing Overrides
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { menuService } from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, EmptyState, ScreenHeader, PrimaryButton } from '../../../src/components/common';

export default function BranchPricing() {
  const { branchId } = useBranch();
  const [menus,       setMenus]       = useState([]);
  const [selectedMenu,setSelectedMenu]= useState(null);
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingItems,setLoadingItems]= useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);
  const [editItem,    setEditItem]    = useState(null);
  const [editPrice,   setEditPrice]   = useState('');
  const [editAvail,   setEditAvail]   = useState(true);

  const loadMenus = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await menuService.getAll(false);
      setMenus(data || []);
    } catch { setError('Failed to load menus'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { loadMenus(); }, [loadMenus]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  const loadPricing = useCallback(async (menuId) => {
    if (!menuId || !branchId) return;
    setLoadingItems(true);
    try {
      const { data } = await menuService.getBranchPricing(menuId, branchId);
      setItems(data || []);
    } catch { setError('Failed to load pricing data'); }
    finally  { setLoadingItems(false); }
  }, [branchId]);

  const selectMenu = (menu) => {
    setSelectedMenu(menu);
    loadPricing(menu.id);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditPrice(String(item.branchPrice ?? item.basePrice ?? ''));
    setEditAvail(item.available !== false);
  };

  const handleSave = async () => {
    if (!editItem) return;
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) { setError('Enter a valid price'); return; }
    setSaving(true);
    try {
      await menuService.saveBranchPrice(editItem.id, branchId, price, editAvail);
      setSuccess('Price updated');
      setEditItem(null);
      loadPricing(selectedMenu.id);
    } catch { setError('Failed to save price'); }
    finally  { setSaving(false); }
  };

  if (loading) return <LoadingScreen message="Loading menus..." />;

  if (!selectedMenu) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScreenHeader title="Branch Pricing" subtitle="Select a menu to manage prices" />
        <Banner type="error" message={error} onDismiss={() => setError(null)} />

        {menus.length === 0
          ? <EmptyState icon="🏷️" title="No menus found" subtitle="Create menus first" />
          : (
            <FlatList
              data={menus}
              keyExtractor={m => String(m.id)}
              contentContainerStyle={{ padding: Spacing.lg }}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.menuCard, Shadow.sm]} onPress={() => selectMenu(item)} activeOpacity={0.8}>
                  <View style={styles.menuIcon}>
                    <Text style={{ fontSize: 22 }}>🍽️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    {item.season && <Text style={styles.menuSub}>{item.season}</Text>}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.active ? Colors.successLight : Colors.bg }]}>
                    <Text style={[styles.statusText, { color: item.active ? Colors.success : Colors.textMuted }]}>
                      {item.active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            />
          )
        }
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Branch Pricing"
        subtitle={selectedMenu.name}
        left={
          <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectedMenu(null); setItems([]); }}>
            <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} />

      {loadingItems
        ? <LoadingScreen message="Loading prices..." />
        : items.length === 0
          ? <EmptyState icon="🏷️" title="No items" subtitle="This menu has no items yet" />
          : (
            <FlatList
              data={items}
              keyExtractor={i => String(i.id)}
              contentContainerStyle={{ padding: Spacing.lg }}
              renderItem={({ item }) => (
                <View style={[styles.itemCard, Shadow.sm]}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.name || item.recipeName}</Text>
                      <Text style={styles.itemSub}>Base: ₹{Number(item.basePrice || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={styles.branchPrice}>₹{Number(item.branchPrice ?? item.basePrice ?? 0).toFixed(2)}</Text>
                      <Text style={styles.branchPriceLbl}>branch price</Text>
                    </View>
                    <View style={[styles.availBadge, { backgroundColor: item.available !== false ? Colors.successLight : Colors.dangerLight }]}>
                      <Text style={[styles.availText, { color: item.available !== false ? Colors.success : Colors.danger }]}>
                        {item.available !== false ? 'On' : 'Off'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                    <Ionicons name="pencil-outline" size={13} color={Colors.primary} />
                    <Text style={styles.editBtnText}>Set Price</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )
      }

      {/* Edit Price Modal */}
      <Modal visible={!!editItem} transparent animationType="slide" onRequestClose={() => setEditItem(null)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Branch Price</Text>
              <TouchableOpacity onPress={() => setEditItem(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.itemLabel}>{editItem?.name || editItem?.recipeName}</Text>
            <Text style={styles.baseNote}>Base price: ₹{Number(editItem?.basePrice || 0).toFixed(2)}</Text>

            <Text style={styles.fieldLabel}>Branch Price (₹)</Text>
            <TextInput
              style={styles.priceInput}
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity
              style={[styles.toggleRow, editAvail && styles.toggleRowActive]}
              onPress={() => setEditAvail(v => !v)}
            >
              <Ionicons name={editAvail ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={editAvail ? Colors.success : Colors.textMuted} />
              <Text style={[styles.toggleText, editAvail && { color: Colors.success }]}>Available at this branch</Text>
            </TouchableOpacity>

            <PrimaryButton label="Save Price" onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  backBtn:       { marginRight: 8 },
  menuCard:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon:      { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuName:      { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  menuSub:       { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText:    { fontSize: Typography.xs, fontWeight: '700' },
  itemCard:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  itemRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  itemName:      { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  itemSub:       { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  priceCol:      { alignItems: 'flex-end' },
  branchPrice:   { fontSize: Typography.md, fontWeight: '800', color: Colors.primary },
  branchPriceLbl:{ fontSize: Typography.xs, color: Colors.textMuted },
  availBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginLeft: 4 },
  availText:     { fontSize: Typography.xs, fontWeight: '700' },
  editBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  editBtnText:   { fontSize: Typography.xs, color: Colors.primary, fontWeight: '600' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: Colors.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle:    { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  itemLabel:     { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  baseNote:      { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
  fieldLabel:    { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  priceInput:    { backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: Typography.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  toggleRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  toggleRowActive:{ borderColor: Colors.success },
  toggleText:    { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '500' },
});
