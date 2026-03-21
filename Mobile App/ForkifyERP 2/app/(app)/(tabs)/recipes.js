// app/(app)/(tabs)/recipes.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, RefreshControl, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecipesThunk, deleteRecipeThunk, clearRecipeError } from '../../../src/store';
import { recipeService } from '../../../src/services';
import { usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, StatusBadge, LoadingScreen, EmptyState } from '../../../src/components/common';

export default function RecipesTab() {
  const router    = useRouter();
  const dispatch  = useDispatch();
  const { canEditMasterData } = usePermission();
  const { recipes, loading, error } = useSelector(s => s.recipes);

  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('all');
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    if (category !== 'all') params.category = category;
    dispatch(fetchRecipesThunk(params));
  }, [dispatch, search, category]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    recipeService.getCategories().then(r => setCategories(r.data || [])).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    await dispatch(deleteRecipeThunk(id));
    setConfirmDel(null);
  };

  const filtered = recipes.filter(r => {
    const ms = !search || r.name.toLowerCase().includes(search.toLowerCase());
    const mc = category === 'all' || r.category === category;
    return ms && mc;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📖  Recipe Library</Text>
          <Text style={styles.sub}>{filtered.length} recipes</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/recipes/add-edit')}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <Banner type="error" message={error} onDismiss={() => dispatch(clearRecipeError())} />

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text>🔍</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search recipes..." placeholderTextColor={Colors.textMuted} style={styles.searchInput} />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><Text style={styles.clearX}>✕</Text></TouchableOpacity>}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
        {['all', ...categories].map(c => (
          <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c === 'all' ? 'All' : c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && recipes.length === 0 ? (
        <LoadingScreen message="Loading recipes..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); dispatch(fetchRecipesThunk({})).finally(() => setRefreshing(false)); }} tintColor={Colors.primary} />}
        >
          {filtered.length === 0 ? (
            <EmptyState icon="👨‍🍳" title="No recipes found" subtitle="Create your first recipe" action={() => router.push('/(app)/recipes/add-edit')} actionLabel="+ Create Recipe" />
          ) : filtered.map(recipe => {
            const statusColors = {
              ACTIVE:   { bg: '#dcfce7', color: '#15803d' },
              DRAFT:    { bg: '#fef9c3', color: '#a16207' },
              ARCHIVED: { bg: '#f1f5f9', color: '#64748b' },
            }[recipe.status] || { bg: Colors.borderLight, color: Colors.textSecondary };

            return (
              <TouchableOpacity key={recipe.id} style={[styles.recipeCard, Shadow.sm]} onPress={() => router.push({ pathname: '/(app)/recipes/detail', params: { id: recipe.id } })} activeOpacity={0.8}>
                <View style={styles.recipeTop}>
                  <View style={styles.recipeIcon}><Text style={styles.recipeIconText}>👨‍🍳</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.recipeNameRow}>
                      <Text style={styles.recipeName} numberOfLines={1}>{recipe.name}</Text>
                      {recipe.hqOwned && <Text style={styles.hqBadge}>🔒 HQ</Text>}
                    </View>
                    <Text style={styles.recipeBranch}>{recipe.branchName}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.color }]}>{recipe.status}</Text>
                  </View>
                </View>

                <View style={styles.recipeMeta}>
                  <Text style={styles.metaChip}>🏷 {recipe.category}</Text>
                  <Text style={styles.metaChip}>👥 {recipe.servings}</Text>
                  <Text style={styles.metaChip}>⏱ {(recipe.prepTime||0)+(recipe.cookTime||0)}m</Text>
                  {recipe.calories > 0 && <Text style={styles.metaChip}>🔥 {recipe.calories} kcal</Text>}
                  {recipe.costPerServing != null && <Text style={[styles.metaChip, { color: Colors.primary }]}>₹{parseFloat(recipe.costPerServing).toFixed(2)}/serve</Text>}
                </View>

                {(recipe.tags || []).length > 0 && (
                  <View style={styles.tagsRow}>
                    {recipe.tags.slice(0, 3).map((t, i) => (
                      <View key={i} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                    ))}
                    {recipe.tags.length > 3 && <Text style={styles.tagMore}>+{recipe.tags.length - 3}</Text>}
                  </View>
                )}

                <View style={styles.recipeActions}>
                  {recipe.status === 'ACTIVE' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/(app)/recipes/log-production', params: { id: recipe.id } })}>
                      <Text style={styles.actionBtnText}>▶ Produce</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/(app)/recipes/add-edit', params: { id: recipe.id } })}>
                    <Text style={styles.actionBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  {canEditMasterData && (
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => setConfirmDel(recipe)}>
                      <Text style={[styles.actionBtnText, { color: Colors.danger }]}>🗑 Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Delete confirm */}
      <Modal visible={!!confirmDel} transparent animationType="fade" onRequestClose={() => setConfirmDel(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmIcon}>🗑</Text>
            <Text style={styles.confirmTitle}>Delete Recipe</Text>
            <Text style={styles.confirmMsg}>Are you sure you want to delete <Text style={{ fontWeight: '700' }}>{confirmDel?.name}</Text>? This cannot be undone.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmDel(null)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={() => handleDelete(confirmDel?.id)}>
                <Text style={styles.confirmDeleteText}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:       { fontSize: Typography.xl, fontWeight: '800', color: Colors.text },
  sub:         { fontSize: Typography.xs, color: Colors.textMuted },
  addBtn:      { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#b3ccf5' },
  addBtnText:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.primaryDark },
  searchWrap:  { padding: Spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.text },
  clearX:      { fontSize: Typography.base, color: Colors.textMuted, paddingHorizontal: 4 },
  chipScroll:  { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chipContent: { padding: Spacing.md, flexDirection: 'row' },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bg, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive:  { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText:    { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  list:        { padding: Spacing.md, gap: 10 },
  recipeCard:  { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  recipeTop:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  recipeIcon:  { width: 40, height: 40, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  recipeIconText:{ fontSize: 18 },
  recipeNameRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  recipeName:  { fontSize: Typography.md, fontWeight: '700', color: Colors.text, flex: 1 },
  hqBadge:     { fontSize: Typography.xs, color: Colors.primary, fontWeight: '600' },
  recipeBranch:{ fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText:  { fontSize: Typography.xs, fontWeight: '700' },
  recipeMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  metaChip:    { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  tagsRow:     { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  tag:         { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: Colors.borderLight, borderRadius: Radius.full },
  tagText:     { fontSize: 10, color: Colors.textSecondary },
  tagMore:     { fontSize: 10, color: Colors.textMuted },
  recipeActions:{ flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn:   { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bg, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  actionBtnText:{ fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  actionBtnDanger:{ borderColor: '#fecaca', backgroundColor: Colors.dangerLight },
  confirmOverlay:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  confirmBox:  { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xxl, width: '100%', maxWidth: 360, alignItems: 'center' },
  confirmIcon: { fontSize: 48, marginBottom: 12 },
  confirmTitle:{ fontSize: Typography.xl, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  confirmMsg:  { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  confirmActions:{ flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancel:{ flex: 1, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  confirmCancelText:{ fontSize: Typography.base, fontWeight: '600', color: Colors.textSecondary },
  confirmDelete:{ flex: 1, paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.danger, alignItems: 'center' },
  confirmDeleteText:{ fontSize: Typography.base, fontWeight: '700', color: '#fff' },
});
