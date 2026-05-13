// app/(app)/recipes/ingredients.js — Ingredient Management
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { recipeService } from '../../../src/services';
import { usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, EmptyState, ScreenHeader, PrimaryButton, FormField, FormInput } from '../../../src/components/common';

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'cup', 'tbsp', 'tsp', 'oz', 'lb'];

const emptyForm = () => ({
  name: '', category: '', unit: 'kg', costPerUnit: '', calories: '',
  protein: '', carbs: '', fat: '', allergens: '', description: '',
});

export default function IngredientManagement() {
  const { canEditMasterData } = usePermission();
  const [ingredients, setIngredients] = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('all');
  const [modal,       setModal]       = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, cRes] = await Promise.all([
        recipeService.getAllIngredients(),
        recipeService.getIngredientCategories(),
      ]);
      setIngredients(iRes.data || []);
      setCategories(cRes.data || []);
    } catch { setError('Failed to load ingredients'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setModal(true); };
  const openEdit = (item) => {
    setForm({
      name: item.name || '', category: item.category || '', unit: item.unit || 'kg',
      costPerUnit: String(item.costPerUnit || ''), calories: String(item.calories || ''),
      protein: String(item.protein || ''), carbs: String(item.carbs || ''),
      fat: String(item.fat || ''), allergens: item.allergens || '', description: item.description || '',
    });
    setEditId(item.id);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Ingredient name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        costPerUnit: parseFloat(form.costPerUnit) || 0,
        calories:    parseFloat(form.calories)    || 0,
        protein:     parseFloat(form.protein)     || 0,
        carbs:       parseFloat(form.carbs)       || 0,
        fat:         parseFloat(form.fat)         || 0,
      };
      if (editId) {
        await recipeService.updateIngredient(editId, payload);
        setSuccess(`"${form.name}" updated`);
      } else {
        await recipeService.createIngredient(payload);
        setSuccess(`"${form.name}" added`);
      }
      setModal(false);
      load();
    } catch (e) { setError(e.response?.data || 'Failed to save ingredient'); }
    finally  { setSaving(false); }
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Ingredient', `Delete "${item.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await recipeService.deleteIngredient(item.id);
            setSuccess(`"${item.name}" removed`);
            load();
          } catch { setError('Failed to delete ingredient'); }
        },
      },
    ]);
  };

  const filtered = ingredients.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || i.category === catFilter;
    return matchSearch && matchCat;
  });

  if (loading) return <LoadingScreen message="Loading ingredients..." />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Ingredients"
        subtitle={`${ingredients.length} total`}
        right={
          canEditMasterData && (
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          )
        }
      />

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} />

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={15} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ingredients..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Category filter */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8, flexDirection: 'row' }}>
          {['all', ...categories].map(c => (
            <TouchableOpacity key={c} style={[styles.catPill, catFilter === c && styles.catPillActive]} onPress={() => setCatFilter(c)}>
              <Text style={[styles.catPillText, catFilter === c && styles.catPillTextActive]}>{c === 'all' ? 'All' : c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {filtered.length === 0
        ? <EmptyState icon="🥕" title="No ingredients" subtitle="Add your first ingredient" action={canEditMasterData ? openAdd : null} actionLabel="+ Add Ingredient" />
        : (
          <FlatList
            data={filtered}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={{ padding: Spacing.lg }}
            renderItem={({ item }) => (
              <View style={[styles.card, Shadow.sm]}>
                <View style={styles.cardRow}>
                  <View style={styles.icon}>
                    <Text style={{ fontSize: 20 }}>🥕</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.sub}>{item.category || 'Uncategorised'} · {item.unit}</Text>
                  </View>
                  <View style={styles.costBadge}>
                    <Text style={styles.costText}>₹{Number(item.costPerUnit || 0).toFixed(2)}</Text>
                    <Text style={styles.costUnit}>/{item.unit}</Text>
                  </View>
                </View>
                {(item.calories || item.protein || item.allergens) ? (
                  <View style={styles.metaRow}>
                    {item.calories  ? <Text style={styles.metaChip}>🔥 {item.calories} kcal</Text>  : null}
                    {item.protein   ? <Text style={styles.metaChip}>💪 {item.protein}g protein</Text> : null}
                    {item.allergens ? <Text style={[styles.metaChip, { backgroundColor: '#fef3c7', color: '#92400e' }]}>⚠️ {item.allergens}</Text> : null}
                  </View>
                ) : null}
                {canEditMasterData && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                      <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.dangerLight }]} onPress={() => handleDelete(item)}>
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

      {/* Add / Edit Modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <ScrollView>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editId ? 'Edit Ingredient' : 'Add Ingredient'}</Text>
                <TouchableOpacity onPress={() => setModal(false)}>
                  <Ionicons name="close" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <FormField label="Name *">
                <FormInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Basmati Rice" />
              </FormField>
              <FormField label="Category">
                <FormInput value={form.category} onChangeText={v => setForm(f => ({ ...f, category: v }))} placeholder="e.g. Grains" />
              </FormField>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormField label="Unit">
                    <FormInput value={form.unit} onChangeText={v => setForm(f => ({ ...f, unit: v }))} placeholder="kg" />
                  </FormField>
                </View>
                <View style={{ flex: 1 }}>
                  <FormField label="Cost per Unit (₹)">
                    <FormInput value={form.costPerUnit} onChangeText={v => setForm(f => ({ ...f, costPerUnit: v }))} keyboardType="decimal-pad" placeholder="0.00" />
                  </FormField>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Nutrition (per 100g)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {[['calories','Calories (kcal)'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)']].map(([k, lbl]) => (
                  <View key={k} style={{ width: '47%' }}>
                    <FormField label={lbl}>
                      <FormInput value={form[k]} onChangeText={v => setForm(f => ({ ...f, [k]: v }))} keyboardType="decimal-pad" placeholder="0" />
                    </FormField>
                  </View>
                ))}
              </View>

              <FormField label="Allergens (comma-separated)">
                <FormInput value={form.allergens} onChangeText={v => setForm(f => ({ ...f, allergens: v }))} placeholder="e.g. Gluten, Dairy" />
              </FormField>
              <FormField label="Notes">
                <FormInput value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional notes..." multiline />
              </FormField>

              <PrimaryButton label={editId ? 'Update Ingredient' : 'Add Ingredient'} onPress={handleSave} loading={saving} style={{ marginTop: 8 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  addBtn:          { width: 34, height: 34, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  searchWrap:      { flexDirection: 'row', alignItems: 'center', gap: 8, margin: Spacing.lg, marginBottom: 0, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 10 },
  searchInput:     { flex: 1, fontSize: Typography.base, color: Colors.text },
  catScroll:       { marginTop: Spacing.sm, maxHeight: 44 },
  catPill:         { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  catPillActive:   { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  catPillText:     { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '500' },
  catPillTextActive:{ color: Colors.primary, fontWeight: '700' },
  card:            { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  icon:            { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  name:            { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  sub:             { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },
  costBadge:       { alignItems: 'flex-end' },
  costText:        { fontSize: Typography.md, fontWeight: '700', color: Colors.primary },
  costUnit:        { fontSize: Typography.xs, color: Colors.textMuted },
  metaRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  metaChip:        { fontSize: Typography.xs, backgroundColor: Colors.bg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, color: Colors.textSecondary, fontWeight: '500' },
  actions:         { flexDirection: 'row', gap: 8 },
  actionBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  actionText:      { fontSize: Typography.xs, color: Colors.primary, fontWeight: '600' },
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:       { backgroundColor: Colors.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40 },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle:      { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  sectionLabel:    { fontSize: Typography.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, marginTop: 4 },
});
