// app/(app)/recipes/nutrition.js — Recipe Nutrition Viewer
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { recipeService } from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, EmptyState, ScreenHeader } from '../../../src/components/common';

const NUT_FIELDS = [
  { key: 'calories',      label: 'Calories',      unit: 'kcal', icon: '🔥', color: '#ef4444' },
  { key: 'protein',       label: 'Protein',        unit: 'g',    icon: '💪', color: '#3b82f6' },
  { key: 'carbs',         label: 'Carbs',          unit: 'g',    icon: '🌾', color: '#f59e0b' },
  { key: 'fat',           label: 'Fat',            unit: 'g',    icon: '🫒', color: '#10b981' },
  { key: 'fiber',         label: 'Fiber',          unit: 'g',    icon: '🥦', color: '#059669' },
  { key: 'sodium',        label: 'Sodium',         unit: 'mg',   icon: '🧂', color: '#8b5cf6' },
  { key: 'costPerServing',label: 'Cost/Serving',   unit: '₹',    icon: '₹',  color: '#0061d2' },
];

export default function RecipeNutrition() {
  const { branchId } = useBranch();
  const [recipes,  setRecipes]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [servings, setServings] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recipeService.getAll({ status: 'ACTIVE' });
      setRecipes(data || []);
    } catch { setError('Failed to load recipes'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = recipes.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const scale = (val, base) => {
    const s = parseFloat(servings) || (selected?.servings || 1);
    const b = base || selected?.servings || 1;
    return ((parseFloat(val) || 0) / b * s).toFixed(1);
  };

  if (loading) return <LoadingScreen message="Loading recipes..." />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="Recipe Nutrition" subtitle="Nutritional info per serving" />

      <Banner type="error" message={error} onDismiss={() => setError(null)} />

      {!selected ? (
        <>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {filtered.length === 0
            ? <EmptyState icon="🥗" title="No recipes found" subtitle="Try a different search" />
            : (
              <FlatList
                data={filtered}
                keyExtractor={r => String(r.id)}
                contentContainerStyle={{ padding: Spacing.lg }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.recipeCard, Shadow.sm]}
                    onPress={() => { setSelected(item); setServings(String(item.servings || 1)); }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardRow}>
                      <View style={styles.cardIcon}>
                        <Text style={{ fontSize: 22 }}>🍽️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardName}>{item.name}</Text>
                        <Text style={styles.cardSub}>{item.category} · {item.servings} servings</Text>
                      </View>
                      <View style={styles.calBadge}>
                        <Text style={styles.calText}>{item.calories || '—'}</Text>
                        <Text style={styles.calUnit}>kcal</Text>
                      </View>
                    </View>
                    <View style={styles.nutRow}>
                      {['protein', 'carbs', 'fat'].map(k => (
                        <View key={k} style={styles.nutChip}>
                          <Text style={styles.nutVal}>{item[k] ? `${item[k]}g` : '—'}</Text>
                          <Text style={styles.nutLbl}>{k}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )
          }
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            <Text style={styles.backText}>All Recipes</Text>
          </TouchableOpacity>

          <View style={[styles.detailCard, Shadow.sm]}>
            <Text style={styles.detailName}>{selected.name}</Text>
            <Text style={styles.detailCat}>{selected.category}</Text>

            {/* Serving scaler */}
            <View style={styles.scalerRow}>
              <Text style={styles.scalerLabel}>Scale to servings:</Text>
              <TouchableOpacity
                style={styles.scalerBtn}
                onPress={() => setServings(s => String(Math.max(1, parseInt(s || 1) - 1)))}
              >
                <Ionicons name="remove" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.scalerInput}
                value={servings}
                onChangeText={setServings}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.scalerBtn}
                onPress={() => setServings(s => String(parseInt(s || 1) + 1))}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Nutrition grid */}
            <View style={styles.nutGrid}>
              {NUT_FIELDS.map(f => {
                const val = f.key === 'costPerServing'
                  ? `₹${scale(selected[f.key], selected.servings)}`
                  : `${scale(selected[f.key], selected.servings)} ${f.unit}`;
                return (
                  <View key={f.key} style={[styles.nutCard, { borderLeftColor: f.color }]}>
                    <Text style={styles.nutCardVal}>{val}</Text>
                    <Text style={styles.nutCardLbl}>{f.label}</Text>
                  </View>
                );
              })}
            </View>

            {/* Allergens */}
            {selected.allergens ? (
              <View style={styles.allergenWrap}>
                <Text style={styles.allergenTitle}>⚠️ Allergens</Text>
                <View style={styles.allergenRow}>
                  {String(selected.allergens).split(',').map(a => a.trim()).filter(Boolean).map(a => (
                    <View key={a} style={styles.allergenChip}>
                      <Text style={styles.allergenText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  searchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 8, margin: Spacing.lg, marginBottom: 0, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 10 },
  searchInput:   { flex: 1, fontSize: Typography.base, color: Colors.text },
  recipeCard:    { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIcon:      { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardName:      { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  cardSub:       { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },
  calBadge:      { alignItems: 'center' },
  calText:       { fontSize: Typography.lg, fontWeight: '800', color: '#ef4444' },
  calUnit:       { fontSize: Typography.xs, color: Colors.textMuted },
  nutRow:        { flexDirection: 'row', gap: 8 },
  nutChip:       { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.sm, padding: 6, alignItems: 'center' },
  nutVal:        { fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
  nutLbl:        { fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'capitalize' },
  backBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  backText:      { fontSize: Typography.base, color: Colors.primary, fontWeight: '600' },
  detailCard:    { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  detailName:    { fontSize: Typography.xl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  detailCat:     { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
  scalerRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.lg, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md },
  scalerLabel:   { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  scalerBtn:     { width: 32, height: 32, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  scalerInput:   { width: 44, textAlign: 'center', fontSize: Typography.lg, fontWeight: '700', color: Colors.text, borderBottomWidth: 1, borderBottomColor: Colors.border },
  nutGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  nutCard:       { width: '47%', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3 },
  nutCardVal:    { fontSize: Typography.lg, fontWeight: '800', color: Colors.text },
  nutCardLbl:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  allergenWrap:  { backgroundColor: '#fffbeb', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#fde68a' },
  allergenTitle: { fontSize: Typography.sm, fontWeight: '700', color: '#92400e', marginBottom: 8 },
  allergenRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergenChip:  { backgroundColor: '#fef3c7', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  allergenText:  { fontSize: Typography.xs, color: '#92400e', fontWeight: '600' },
});
