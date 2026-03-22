// app/(app)/recipes/add-edit.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { recipeService } from '../../../src/services';
import { Colors, Typography, Radius, Spacing, Shadow } from '../../../src/theme';
import { Banner, FormField, FormInput, PrimaryButton, LoadingScreen, ScreenHeader} from '../../../src/components/common';
import { Ionicons } from '@expo/vector-icons';

const STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED'];
const emptyIngredientLine = () => ({ ingredientId: '', quantity: '', notes: '' });
const emptyForm = () => ({
  name: '', description: '', category: '', servings: '4',
  prepTime: '', cookTime: '', instructions: '', status: 'DRAFT',
  tags: '', calories: '', protein: '', carbs: '', fat: '', fiber: '',
  allergens: '', ingredients: [emptyIngredientLine()],
});

export default function AddEditRecipe() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isEdit = !!id;

  const [form,            setForm]           = useState(emptyForm());
  const [ingredients,     setIngredients]    = useState([]);
  const [categories,      setCategories]     = useState([]);
  const [loading,         setLoading]        = useState(!!isEdit);
  const [saving,          setSaving]         = useState(false);
  const [error,           setError]          = useState(null);
  const [success,         setSuccess]        = useState(null);
  const [ingPickerIdx,    setIngPickerIdx]   = useState(null);
  const [catPickerOpen,   setCatPickerOpen]  = useState(false);
  const [statusPickerOpen,setStatusPickerOpen]=useState(false);

  useEffect(() => {
    Promise.all([recipeService.getAllIngredients(), recipeService.getCategories()])
      .then(([ingRes, catRes]) => { setIngredients(ingRes.data || []); setCategories(catRes.data || []); })
      .catch(() => {});
    if (isEdit) {
      recipeService.getById(id).then(({ data: r }) => {
        setForm({
          name: r.name || '', description: r.description || '', category: r.category || '',
          servings: String(r.servings || 4), prepTime: String(r.prepTime || ''), cookTime: String(r.cookTime || ''),
          instructions: r.instructions || '', status: r.status || 'DRAFT',
          tags: (r.tags || []).join(', '), calories: String(r.calories || ''),
          protein: String(r.protein || ''), carbs: String(r.carbs || ''),
          fat: String(r.fat || ''), fiber: String(r.fiber || ''),
          allergens: (r.allergens || []).join(', '),
          ingredients: (r.ingredients || []).length > 0
            ? r.ingredients.map(i => ({ ingredientId: String(i.ingredientId), quantity: String(i.quantity), notes: i.notes || '' }))
            : [emptyIngredientLine()],
        });
      }).catch(() => setError('Failed to load recipe')).finally(() => setLoading(false));
    }
  }, [id]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const addIngLine    = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, emptyIngredientLine()] }));
  const removeIngLine = (idx) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  const updateIngLine = (idx, key, val) => setForm(f => ({ ...f, ingredients: f.ingredients.map((it, i) => i === idx ? { ...it, [key]: val } : it) }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Recipe name is required'); return; }
    if (!form.category.trim()) { setError('Category is required'); return; }
    const payload = {
      name: form.name.trim(), description: form.description || null, category: form.category,
      servings: parseInt(form.servings) || 4, prepTime: parseInt(form.prepTime) || 0, cookTime: parseInt(form.cookTime) || 0,
      instructions: form.instructions || null, status: form.status,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      calories: parseFloat(form.calories) || 0, protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0, fat: parseFloat(form.fat) || 0, fiber: parseFloat(form.fiber) || 0,
      allergens: form.allergens ? form.allergens.split(',').map(a => a.trim()).filter(Boolean) : [],
      ingredients: form.ingredients.filter(i => i.ingredientId && i.quantity).map(i => ({
        ingredientId: parseInt(i.ingredientId), quantity: parseFloat(i.quantity), notes: i.notes || null,
      })),
    };
    setSaving(true); setError(null);
    try {
      if (isEdit) { await recipeService.update(id, payload); setSuccess('Recipe updated!'); }
      else        { await recipeService.create(payload);     setSuccess('Recipe created!'); setTimeout(() => router.back(), 1200); }
    } catch (e) { setError(e.response?.data || 'Failed to save recipe'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen message="Loading recipe..." />;

  return (
    <View style={S.container}>
      <ScreenHeader
          title={isEdit ? '✏️  Edit Recipe' : '➕  New Recipe'}
          right={<PrimaryButton label={saving ? 'Saving...' : 'Save'} onPress={handleSave} loading={saving} small />}
        />
      <ScrollView contentContainerStyle={S.content}>
        <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />

        {/* Basic Info */}
        <View style={[S.section, Shadow.sm]}>
          <Text style={S.sectionTitle}>📌  Basic Information</Text>
          <FormField label="Recipe Name *"><FormInput value={form.name} onChangeText={v => setField('name', v)} placeholder="e.g. Butter Chicken" /></FormField>
          <FormField label="Description"><FormInput value={form.description} onChangeText={v => setField('description', v)} placeholder="Brief description" multiline /></FormField>
          <FormField label="Category *">
            <TouchableOpacity style={S.selectBtn} onPress={() => setCatPickerOpen(true)}>
              <Text style={[S.selectBtnText, !form.category && { color: Colors.textMuted }]}>{form.category || 'Select category...'}</Text>
              <Text>▾</Text>
            </TouchableOpacity>
          </FormField>
          <View style={S.row2}>
            <View style={{ flex: 1 }}><FormField label="Servings"><FormInput value={form.servings} onChangeText={v => setField('servings', v)} keyboardType="number-pad" placeholder="4" /></FormField></View>
            <View style={{ flex: 1 }}>
              <FormField label="Status">
                <TouchableOpacity style={S.selectBtn} onPress={() => setStatusPickerOpen(true)}>
                  <Text style={S.selectBtnText}>{form.status}</Text><Text>▾</Text>
                </TouchableOpacity>
              </FormField>
            </View>
          </View>
          <View style={S.row2}>
            <View style={{ flex: 1 }}><FormField label="Prep (min)"><FormInput value={form.prepTime} onChangeText={v => setField('prepTime', v)} keyboardType="number-pad" placeholder="15" /></FormField></View>
            <View style={{ flex: 1 }}><FormField label="Cook (min)"><FormInput value={form.cookTime} onChangeText={v => setField('cookTime', v)} keyboardType="number-pad" placeholder="30" /></FormField></View>
          </View>
          <FormField label="Tags (comma-separated)"><FormInput value={form.tags} onChangeText={v => setField('tags', v)} placeholder="spicy, vegetarian" /></FormField>
          <FormField label="Allergens (comma-separated)"><FormInput value={form.allergens} onChangeText={v => setField('allergens', v)} placeholder="nuts, gluten" /></FormField>
        </View>

        {/* Nutrition */}
        <View style={[S.section, Shadow.sm]}>
          <Text style={S.sectionTitle}>🔥  Nutrition (per serving)</Text>
          <View style={S.row2}>
            <View style={{ flex: 1 }}><FormField label="Calories (kcal)"><FormInput value={form.calories} onChangeText={v => setField('calories', v)} keyboardType="decimal-pad" placeholder="0" /></FormField></View>
            <View style={{ flex: 1 }}><FormField label="Protein (g)"><FormInput value={form.protein} onChangeText={v => setField('protein', v)} keyboardType="decimal-pad" placeholder="0" /></FormField></View>
          </View>
          <View style={S.row3}>
            <View style={{ flex: 1 }}><FormField label="Carbs"><FormInput value={form.carbs} onChangeText={v => setField('carbs', v)} keyboardType="decimal-pad" placeholder="0" /></FormField></View>
            <View style={{ flex: 1 }}><FormField label="Fat"><FormInput value={form.fat} onChangeText={v => setField('fat', v)} keyboardType="decimal-pad" placeholder="0" /></FormField></View>
            <View style={{ flex: 1 }}><FormField label="Fiber"><FormInput value={form.fiber} onChangeText={v => setField('fiber', v)} keyboardType="decimal-pad" placeholder="0" /></FormField></View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={[S.section, Shadow.sm]}>
          <View style={S.sectionHeaderRow}>
            <Text style={S.sectionTitle}>📦  Ingredients</Text>
            <TouchableOpacity style={S.addLineBtn} onPress={addIngLine}><Text style={S.addLineBtnText}>+ Add</Text></TouchableOpacity>
          </View>
          {form.ingredients.map((line, idx) => {
            const sel = ingredients.find(i => String(i.id) === line.ingredientId);
            return (
              <View key={idx} style={S.ingLine}>
                <TouchableOpacity style={S.ingSelectBtn} onPress={() => setIngPickerIdx(idx)}>
                  <Text style={[S.ingSelectText, !sel && { color: Colors.textMuted }]} numberOfLines={1}>{sel ? `${sel.name} (${sel.unit})` : 'Select...'}</Text>
                  <Text>▾</Text>
                </TouchableOpacity>
                <FormInput value={line.quantity} onChangeText={v => updateIngLine(idx, 'quantity', v)} keyboardType="decimal-pad" placeholder="Qty" style={{ width: 65, marginBottom: 0 }} />
                <FormInput value={line.notes} onChangeText={v => updateIngLine(idx, 'notes', v)} placeholder="Note" style={{ flex: 1, marginBottom: 0 }} />
                {form.ingredients.length > 1 && (
                  <TouchableOpacity onPress={() => removeIngLine(idx)} style={S.removeIngBtn}><Text style={S.removeIngText}>✕</Text></TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Instructions */}
        <View style={[S.section, Shadow.sm]}>
          <Text style={S.sectionTitle}>📋  Instructions</Text>
          <FormField label="Steps">
            <FormInput value={form.instructions} onChangeText={v => setField('instructions', v)} placeholder="Step-by-step instructions..." multiline style={{ height: 120 }} />
          </FormField>
        </View>

        <PrimaryButton label={saving ? 'Saving...' : isEdit ? 'Update Recipe' : 'Create Recipe'} onPress={handleSave} loading={saving} style={{ marginTop: 8 }} />
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Category Picker */}
      <Modal visible={catPickerOpen} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setCatPickerOpen(false)}>
        <View style={S.pickerModal}>
          <View style={S.pickerModalHeader}>
            <Text style={S.pickerModalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setCatPickerOpen(false)}><Text style={S.pickerModalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {[...new Set([...categories, 'Starters', 'Mains', 'Desserts', 'Beverages', 'Snacks'])].map(c => (
              <TouchableOpacity key={c} style={[S.pickerOption, form.category === c && S.pickerOptionActive]} onPress={() => { setField('category', c); setCatPickerOpen(false); }}>
                <Text style={[S.pickerOptionText, form.category === c && S.pickerOptionTextActive]}>{c}</Text>
                {form.category === c && <Text style={{ color: Colors.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Status Picker */}
      <Modal visible={statusPickerOpen} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setStatusPickerOpen(false)}>
        <View style={S.pickerModal}>
          <View style={S.pickerModalHeader}>
            <Text style={S.pickerModalTitle}>Select Status</Text>
            <TouchableOpacity onPress={() => setStatusPickerOpen(false)}><Text style={S.pickerModalClose}>✕</Text></TouchableOpacity>
          </View>
          {STATUSES.map(s => (
            <TouchableOpacity key={s} style={[S.pickerOption, form.status === s && S.pickerOptionActive]} onPress={() => { setField('status', s); setStatusPickerOpen(false); }}>
              <Text style={[S.pickerOptionText, form.status === s && S.pickerOptionTextActive]}>{s}</Text>
              {form.status === s && <Text style={{ color: Colors.primary }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Ingredient Picker */}
      <Modal visible={ingPickerIdx !== null} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setIngPickerIdx(null)}>
        <View style={S.pickerModal}>
          <View style={S.pickerModalHeader}>
            <Text style={S.pickerModalTitle}>Select Ingredient</Text>
            <TouchableOpacity onPress={() => setIngPickerIdx(null)}><Text style={S.pickerModalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {ingredients.map(ing => {
              const isSel = ingPickerIdx !== null && form.ingredients[ingPickerIdx]?.ingredientId === String(ing.id);
              return (
                <TouchableOpacity key={ing.id} style={[S.pickerOption, isSel && S.pickerOptionActive]} onPress={() => { updateIngLine(ingPickerIdx, 'ingredientId', String(ing.id)); setIngPickerIdx(null); }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.pickerOptionText, isSel && S.pickerOptionTextActive]}>{ing.name}</Text>
                    <Text style={{ fontSize: Typography.xs, color: Colors.textMuted }}>{ing.unit} · {ing.category}</Text>
                  </View>
                  {isSel && <Text style={{ color: Colors.primary }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  backIcon:     { fontSize: Typography.lg },
  title:        { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, flex: 1 },
  content:      { padding: Spacing.lg, gap: Spacing.md },
  section:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  sectionHeaderRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  addLineBtn:   { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#b3ccf5' },
  addLineBtnText:{ fontSize: Typography.xs, fontWeight: '600', color: Colors.primaryDark },
  row2:         { flexDirection: 'row', gap: 12 },
  row3:         { flexDirection: 'row', gap: 8 },
  selectBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.card },
  selectBtnText:{ fontSize: Typography.base, color: Colors.text, flex: 1 },
  ingLine:      { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  ingSelectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.card },
  ingSelectText:{ fontSize: Typography.sm, color: Colors.text, flex: 1 },
  removeIngBtn: { width: 28, height: 28, backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  removeIngText:{ fontSize: Typography.sm, color: Colors.danger, fontWeight: '700' },
  pickerModal:  { flex: 1, backgroundColor: Colors.card },
  pickerModalHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerModalTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  pickerModalClose: { fontSize: Typography.xl, color: Colors.textMuted, padding: 4 },
  pickerOption: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerOptionActive: { backgroundColor: Colors.primaryLight },
  pickerOptionText:   { fontSize: Typography.base, color: Colors.text, flex: 1 },
  pickerOptionTextActive: { color: Colors.primary, fontWeight: '600' },
});
