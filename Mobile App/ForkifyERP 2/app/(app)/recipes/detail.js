// app/(app)/recipes/detail.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecipeByIdThunk } from '../../../src/store';
import { usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, ScreenHeader} from '../../../src/components/common';
import { Ionicons } from '@expo/vector-icons';

// Backend returns tags/allergens as comma-separated string — normalise to array
const parseList = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
};


export default function RecipeDetail() {
  const { id }     = useLocalSearchParams();
  const router     = useRouter();
  const dispatch   = useDispatch();
  const { canEditMasterData } = usePermission();
  const { selected: recipe, loading, error } = useSelector(s => s.recipes);
  const [servings, setServings] = useState(null);

  useEffect(() => { if (id) dispatch(fetchRecipeByIdThunk(id)); }, [id]);
  useEffect(() => { if (recipe) setServings(recipe.servings); }, [recipe]);

  if (loading && !recipe) return <LoadingScreen message="Loading recipe..." />;
  if (!recipe) return (
    <View style={styles.container}>
      
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48 }}>👨‍🍳</Text>
        <Text style={{ fontSize: Typography.lg, fontWeight: '700', color: Colors.text, marginTop: 12 }}>Recipe not found</Text>
      </View>
    </View>
  );

  const scale = (val) => {
    if (!val || !recipe.servings) return '0';
    return ((val / recipe.servings) * servings).toFixed(1);
  };

  const statusColors = {
    ACTIVE:   { bg: '#dcfce7', color: '#15803d' },
    DRAFT:    { bg: '#fef9c3', color: '#a16207' },
    ARCHIVED: { bg: '#f1f5f9', color: '#64748b' },
  }[recipe.status] || {};

  const canEdit = !recipe.hqOwned || canEditMasterData;

  return (
    <View style={styles.container}>
      <ScreenHeader
          title={recipe.name}
          subtitle={recipe.category}
          right={
            <View style={styles.topActions}>
          {recipe.hqOwned && <Text style={styles.hqChip}>🔒 HQ Recipe</Text>}
          {recipe.status === 'ACTIVE' && (
            <TouchableOpacity style={styles.produceBtn} onPress={() => router.push({ pathname: '/(app)/recipes/log-production', params: { id: recipe.id } })}>
              <Text style={styles.produceBtnText}>▶ Produce</Text>
            </TouchableOpacity>
          )}
          {canEdit && (
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/(app)/recipes/add-edit', params: { id: recipe.id } })}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
            </View>
          }
        />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.heroCard, Shadow.sm]}>
          <View style={styles.heroIconWrap}>
            <Text style={styles.heroIcon}>👨‍🍳</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.heroMeta}>
              <Text style={styles.heroCategory}>{recipe.category}</Text>
              <View style={[styles.heroStatus, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.heroStatusText, { color: statusColors.color }]}>{recipe.status}</Text>
              </View>
            </View>
            <Text style={styles.heroName}>{recipe.name}</Text>
            {recipe.description && <Text style={styles.heroDesc}>{recipe.description}</Text>}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { icon: '⏱', label: 'Total Time', value: `${(recipe.prepTime||0)+(recipe.cookTime||0)} min` },
            { icon: '👥', label: 'Servings',   value: `${recipe.servings} base` },
            { icon: '🔥', label: 'Calories',   value: `${scale(recipe.calories)} kcal` },
            { icon: '💰', label: 'Cost',        value: recipe.costPerServing ? `₹${(parseFloat(recipe.costPerServing)*servings).toFixed(2)}` : '—' },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, Shadow.sm]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Serving adjuster */}
        <View style={[styles.servingCard, Shadow.sm]}>
          <Text style={styles.servingLabel}>👥  Adjust Servings</Text>
          <View style={styles.servingControls}>
            <TouchableOpacity style={styles.servingBtn} onPress={() => setServings(s => Math.max(1, s - 1))}>
              <Text style={styles.servingBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.servingCount}>{servings}</Text>
            <TouchableOpacity style={styles.servingBtn} onPress={() => setServings(s => s + 1)}>
              <Text style={styles.servingBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {servings !== recipe.servings && (
            <TouchableOpacity onPress={() => setServings(recipe.servings)}>
              <Text style={styles.resetText}>Reset to {recipe.servings}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Allergens */}
        {parseList(recipe.allergens).length > 0 && (
          <View style={styles.allergenCard}>
            <Text style={styles.allergenTitle}>⚠️  Allergens</Text>
            <View style={styles.allergenRow}>
              {parseList(recipe.allergens).map((a, i) => (
                <View key={i} style={styles.allergenBadge}><Text style={styles.allergenText}>{a}</Text></View>
              ))}
            </View>
          </View>
        )}

        {/* Ingredients */}
        <View style={[styles.section, Shadow.sm]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📦  Ingredients</Text>
            <Text style={styles.sectionNote}>for {servings} serving{servings !== 1 ? 's' : ''}</Text>
          </View>
          {!recipe.ingredients || recipe.ingredients.length === 0 ? (
            <Text style={styles.noData}>No ingredients added yet</Text>
          ) : recipe.ingredients.map(ing => {
            const scaledQty  = ((ing.quantity / recipe.servings) * servings).toFixed(2);
            const scaledLine = (parseFloat(ing.lineCost || 0) / recipe.servings * servings).toFixed(2);
            return (
              <View key={ing.id} style={styles.ingRow}>
                <Text style={styles.ingDot}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingName}>{ing.ingredientName}</Text>
                  {ing.notes && <Text style={styles.ingNote}>{ing.notes}</Text>}
                </View>
                <Text style={styles.ingQty}>{scaledQty} {ing.unit}</Text>
                <Text style={styles.ingCost}>₹{scaledLine}</Text>
              </View>
            );
          })}
        </View>


        {/* Cooking Steps */}
        {(recipe.steps || []).length > 0 && (
          <View style={[styles.section, Shadow.sm]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👨‍🍳  Cooking Steps</Text>
              <Text style={styles.sectionNote}>{recipe.steps.length} steps · {recipe.steps.reduce((s, st) => s + (st.durationMinutes || 0), 0)} min</Text>
            </View>
            {recipe.steps
              .slice()
              .sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0))
              .map((step, i) => (
              <View key={step.id || i} style={styles.stepRow}>
                <View style={styles.stepNumWrap}>
                  <Text style={styles.stepNum}>{step.stepNumber || i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.stepTitleRow}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    {step.durationMinutes ? (
                      <Text style={styles.stepDuration}>⏱ {step.durationMinutes}m</Text>
                    ) : null}
                  </View>
                  {step.instruction ? (
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <View style={[styles.section, Shadow.sm]}>
            <Text style={styles.sectionTitle}>📋  Instructions</Text>
            <Text style={styles.instructions}>{recipe.instructions}</Text>
          </View>
        )}

        {/* Nutrition */}
        {(recipe.calories > 0 || recipe.protein > 0) && (
          <View style={[styles.section, Shadow.sm]}>
            <Text style={styles.sectionTitle}>🔥  Nutrition (per {servings} serving{servings !== 1 ? 's' : ''})</Text>
            <View style={styles.nutritionGrid}>
              {[
                { label: 'Calories', value: `${scale(recipe.calories)} kcal` },
                { label: 'Protein',  value: `${scale(recipe.protein)}g` },
                { label: 'Carbs',    value: `${scale(recipe.carbs)}g` },
                { label: 'Fat',      value: `${scale(recipe.fat)}g` },
                { label: 'Fiber',    value: `${scale(recipe.fiber)}g` },
              ].map((n, i) => (
                <View key={i} style={styles.nutCard}>
                  <Text style={styles.nutValue}>{n.value}</Text>
                  <Text style={styles.nutLabel}>{n.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtnRow:   { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  backIcon:     { fontSize: Typography.lg, color: Colors.text },
  topActions:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hqChip:       { fontSize: Typography.xs, fontWeight: '600', color: Colors.primary, backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  produceBtn:   { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#f0fdf4', borderRadius: Radius.md, borderWidth: 1, borderColor: '#bbf7d0' },
  produceBtnText:{ fontSize: Typography.sm, fontWeight: '600', color: '#15803d' },
  editBtn:      { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  editBtnText:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  content:      { padding: Spacing.lg, gap: Spacing.md },
  heroCard:     { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: Colors.border },
  heroIconWrap: { width: 56, height: 56, backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroIcon:     { fontSize: 28 },
  heroMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  heroCategory: { fontSize: Typography.xs, fontWeight: '600', color: Colors.success, backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  heroStatus:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  heroStatusText:{ fontSize: Typography.xs, fontWeight: '700' },
  heroName:     { fontSize: Typography.xl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  heroDesc:     { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  statsRow:     { flexDirection: 'row', gap: 8 },
  statCard:     { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statIcon:     { fontSize: 18, marginBottom: 4 },
  statValue:    { fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
  statLabel:    { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  servingCard:  { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  servingLabel: { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  servingControls:{ flexDirection: 'row', alignItems: 'center', gap: 16 },
  servingBtn:   { width: 36, height: 36, backgroundColor: Colors.primaryLight, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#b3ccf5' },
  servingBtnText:{ fontSize: Typography.xl, fontWeight: '700', color: Colors.primary, lineHeight: 22 },
  servingCount: { fontSize: Typography.xl, fontWeight: '800', color: Colors.text, minWidth: 28, textAlign: 'center' },
  resetText:    { fontSize: Typography.xs, color: Colors.primary, textDecorationLine: 'underline' },
  allergenCard: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: Radius.lg, padding: Spacing.md },
  allergenTitle:{ fontSize: Typography.sm, fontWeight: '700', color: '#92400e', marginBottom: 8 },
  allergenRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergenBadge:{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#fef3c7', borderRadius: Radius.full, borderWidth: 1, borderColor: '#fde68a' },
  allergenText: { fontSize: Typography.xs, fontWeight: '600', color: '#92400e' },
  section:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  sectionNote:  { fontSize: Typography.xs, color: Colors.textMuted },
  noData:       { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  ingRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  ingDot:       { fontSize: 12, color: Colors.success },
  ingName:      { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  ingNote:      { fontSize: Typography.xs, color: Colors.textMuted, fontStyle: 'italic' },
  ingQty:       { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  ingCost:      { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary, minWidth: 50, textAlign: 'right' },
  instructions: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 22 },
  nutritionGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nutCard:      { width: '30%', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: 10, alignItems: 'center' },
  nutValue:     { fontSize: Typography.md, fontWeight: '800', color: Colors.text },
  nutLabel:     { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  stepRow:         { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, alignItems: 'flex-start' },
  stepNumWrap:     { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  stepNum:         { fontSize: Typography.sm, fontWeight: '800', color: '#fff' },
  stepTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  stepTitle:       { fontSize: Typography.base, fontWeight: '700', color: Colors.text, flex: 1 },
  stepDuration:    { fontSize: Typography.xs, fontWeight: '600', color: Colors.primary, backgroundColor: Colors.primaryLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  stepInstruction: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
});