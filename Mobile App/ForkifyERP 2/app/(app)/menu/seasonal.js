// app/(app)/menu/seasonal.js — Seasonal Menus
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { menuService } from '../../../src/services';
import { usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, EmptyState, ScreenHeader, PrimaryButton, FormField, FormInput } from '../../../src/components/common';

const emptyForm = () => ({ name: '', season: '', startDate: '', endDate: '', description: '' });

export default function SeasonalMenus() {
  const { canEditMasterData } = usePermission();
  const [menus,   setMenus]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await menuService.getAll(false);
      setMenus(data || []);
    } catch { setError('Failed to load menus'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Menu name is required'); return; }
    setSaving(true);
    try {
      await menuService.create({ ...form, type: 'SEASONAL' });
      setSuccess(`"${form.name}" created`);
      setModal(false);
      setForm(emptyForm());
      load();
    } catch (e) { setError(e.response?.data || 'Failed to create menu'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (menu) => {
    try {
      if (menu.active) {
        await menuService.deactivate(menu.id);
        setSuccess(`"${menu.name}" deactivated`);
      } else {
        await menuService.activate(menu.id);
        setSuccess(`"${menu.name}" activated`);
      }
      load();
    } catch { setError('Failed to update menu status'); }
  };

  const handleDelete = (menu) => {
    Alert.alert('Delete Menu', `Delete "${menu.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await menuService.delete(menu.id);
            setSuccess(`"${menu.name}" deleted`);
            load();
          } catch { setError('Failed to delete menu'); }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen message="Loading menus..." />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Seasonal Menus"
        subtitle={`${menus.length} menus`}
        right={
          canEditMasterData && (
            <TouchableOpacity style={styles.addBtn} onPress={() => { setForm(emptyForm()); setModal(true); }}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          )
        }
      />

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} />

      {menus.length === 0
        ? (
          <EmptyState
            icon="🍽️"
            title="No menus yet"
            subtitle="Create your first seasonal menu"
            action={canEditMasterData ? () => { setForm(emptyForm()); setModal(true); } : null}
            actionLabel="+ Create Menu"
          />
        ) : (
          <FlatList
            data={menus}
            keyExtractor={m => String(m.id)}
            contentContainerStyle={{ padding: Spacing.lg }}
            renderItem={({ item }) => (
              <View style={[styles.card, Shadow.sm]}>
                <View style={styles.cardTop}>
                  <View style={styles.menuIcon}>
                    <Text style={{ fontSize: 22 }}>🍽️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    {item.season && <Text style={styles.menuSub}>{item.season}</Text>}
                    {(item.startDate || item.endDate) && (
                      <Text style={styles.menuSub}>
                        {item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                        {item.startDate && item.endDate ? ' – ' : ''}
                        {item.endDate ? new Date(item.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.active ? Colors.successLight : Colors.bg }]}>
                    <Text style={[styles.statusText, { color: item.active ? Colors.success : Colors.textMuted }]}>
                      {item.active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

                {canEditMasterData && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, item.active ? { backgroundColor: '#fef3c7' } : { backgroundColor: Colors.primaryLight }]}
                      onPress={() => handleToggle(item)}
                    >
                      <Ionicons name={item.active ? 'pause-outline' : 'play-outline'} size={14} color={item.active ? '#b45309' : Colors.primary} />
                      <Text style={[styles.actionText, { color: item.active ? '#b45309' : Colors.primary }]}>
                        {item.active ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: Colors.dangerLight }]}
                      onPress={() => handleDelete(item)}
                    >
                      <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                      <Text style={[styles.actionText, { color: Colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        )
      }

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <ScrollView>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Seasonal Menu</Text>
                <TouchableOpacity onPress={() => setModal(false)}>
                  <Ionicons name="close" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <FormField label="Menu Name *">
                <FormInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Summer Specials" />
              </FormField>
              <FormField label="Season / Theme">
                <FormInput value={form.season} onChangeText={v => setForm(f => ({ ...f, season: v }))} placeholder="e.g. Summer 2025" />
              </FormField>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormField label="Start Date">
                    <FormInput value={form.startDate} onChangeText={v => setForm(f => ({ ...f, startDate: v }))} placeholder="YYYY-MM-DD" />
                  </FormField>
                </View>
                <View style={{ flex: 1 }}>
                  <FormField label="End Date">
                    <FormInput value={form.endDate} onChangeText={v => setForm(f => ({ ...f, endDate: v }))} placeholder="YYYY-MM-DD" />
                  </FormField>
                </View>
              </View>
              <FormField label="Description">
                <FormInput value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional notes..." multiline />
              </FormField>

              <PrimaryButton label="Create Menu" onPress={handleCreate} loading={saving} style={{ marginTop: 8 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  addBtn:       { width: 34, height: 34, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card:         { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardTop:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  menuIcon:     { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuName:     { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  menuSub:      { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText:   { fontSize: Typography.xs, fontWeight: '700' },
  desc:         { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  actions:      { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  actionText:   { fontSize: Typography.xs, fontWeight: '600' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: Colors.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle:   { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
});
