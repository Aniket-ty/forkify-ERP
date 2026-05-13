// app/(app)/recipes/allergens.js — Allergen Matrix
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { allergenService, recipeService } from '../../../src/services';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, EmptyState, ScreenHeader } from '../../../src/components/common';

const COMMON_ALLERGENS = [
  'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts',
  'Shellfish', 'Fish', 'Soy', 'Sesame', 'Mustard',
];

export default function AllergenMatrix() {
  const [matrix,    setMatrix]    = useState([]);
  const [allergens, setAllergens] = useState(COMMON_ALLERGENS);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [matRes, listRes] = await Promise.all([
        allergenService.getMatrix(catFilter !== 'all' ? catFilter : undefined),
        allergenService.getList().catch(() => ({ data: [] })),
      ]);
      const mat = matRes.data || [];
      setMatrix(mat);
      if (listRes.data?.length) setAllergens(listRes.data);
      // derive categories
      const cats = [...new Set(mat.map(r => r.category).filter(Boolean))];
      setCategories(cats);
    } catch { setError('Failed to load allergen matrix'); }
    finally  { setLoading(false); }
  }, [catFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = matrix.filter(r =>
    !search || r.recipeName?.toLowerCase().includes(search.toLowerCase())
  );

  const hasAllergen = (row, allergen) => {
    const list = row.allergens || row.allergenList || '';
    return String(list).toLowerCase().includes(allergen.toLowerCase());
  };

  if (loading) return <LoadingScreen message="Loading allergen matrix..." />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="Allergen Matrix" subtitle="Per-recipe allergen tracking" />
      <Banner type="error" message={error} onDismiss={() => setError(null)} />

      {/* Filters */}
      <View style={styles.filterRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={14} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      {/* Category pills */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8, flexDirection: 'row' }}>
          {['all', ...categories].map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.catPill, catFilter === c && styles.catPillActive]}
              onPress={() => setCatFilter(c)}
            >
              <Text style={[styles.catPillText, catFilter === c && styles.catPillTextActive]}>
                {c === 'all' ? 'All' : c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
        <Text style={styles.legendText}>Contains allergen</Text>
        <View style={[styles.legendDot, { backgroundColor: Colors.border, marginLeft: 16 }]} />
        <Text style={styles.legendText}>Safe</Text>
      </View>

      {filtered.length === 0
        ? <EmptyState icon="✅" title="No recipes found" subtitle="Try adjusting your search or filter" />
        : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header row */}
              <View style={styles.headerRow}>
                <View style={styles.nameCol}>
                  <Text style={styles.headerText}>Recipe</Text>
                </View>
                {allergens.map(a => (
                  <View key={a} style={styles.allergenCol}>
                    <Text style={styles.allergenHeader} numberOfLines={2}>{a}</Text>
                  </View>
                ))}
              </View>

              <FlatList
                data={filtered}
                keyExtractor={r => String(r.recipeId || r.id)}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View style={[styles.matrixRow, index % 2 === 0 && { backgroundColor: Colors.bgDark }]}>
                    <View style={styles.nameCol}>
                      <Text style={styles.recipeName} numberOfLines={2}>{item.recipeName || item.name}</Text>
                      {item.category && <Text style={styles.recipeCat}>{item.category}</Text>}
                    </View>
                    {allergens.map(a => {
                      const has = hasAllergen(item, a);
                      return (
                        <View key={a} style={styles.allergenCol}>
                          <View style={[styles.dot, { backgroundColor: has ? '#ef4444' : Colors.border }]}>
                            {has && <Ionicons name="warning" size={10} color="#fff" />}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              />
            </View>
          </ScrollView>
        )
      }
    </SafeAreaView>
  );
}

const NAME_W  = 140;
const ALRG_W  = 72;

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.bg },
  filterRow:        { padding: Spacing.lg, paddingBottom: 0 },
  searchWrap:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 9 },
  searchInput:      { flex: 1, fontSize: Typography.base, color: Colors.text },
  catScroll:        { marginTop: Spacing.sm, marginBottom: 0, maxHeight: 44 },
  catPill:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  catPillActive:    { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  catPillText:      { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '500' },
  catPillTextActive:{ color: Colors.primary, fontWeight: '700' },
  legend:           { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingHorizontal: Spacing.lg },
  legendDot:        { width: 12, height: 12, borderRadius: 6 },
  legendText:       { fontSize: Typography.xs, color: Colors.textMuted, marginLeft: 6 },
  headerRow:        { flexDirection: 'row', backgroundColor: Colors.navBg, paddingVertical: 10 },
  nameCol:          { width: NAME_W, paddingHorizontal: 12, justifyContent: 'center' },
  allergenCol:      { width: ALRG_W, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  headerText:       { fontSize: Typography.sm, fontWeight: '700', color: '#fff' },
  allergenHeader:   { fontSize: Typography.xs, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  matrixRow:        { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.card },
  recipeName:       { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  recipeCat:        { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  dot:              { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
