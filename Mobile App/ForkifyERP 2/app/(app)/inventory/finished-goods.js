// app/(app)/inventory/finished-goods.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../src/services/api';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, ScreenHeader} from '../../../src/components/common';
import { Ionicons } from '@expo/vector-icons';

export default function FinishedGoodsScreen() {
  const router = useRouter();
  const { branchId } = useBranch();
  const [stock, setStock]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const { data } = await api.get('/production/stock', { params: { branchId } });
      setStock(data || []);
    } catch { setError('Failed to load finished goods'); }
    finally  { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  const filtered = stock.filter(s => !search || s.recipeName?.toLowerCase().includes(search.toLowerCase()));
  const totalValue = stock.reduce((sum, s) => sum + (parseFloat(s.costPerServing || 0) * (s.availableServings || 0)), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScreenHeader
          title="🍽 Finished Goods"
          subtitle="Produced dishes in stock"
        />

      {/* Summary */}
      <View style={{ flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.sm }}>
        {[
          { label: 'Dish Types', val: stock.length, icon: '🍽' },
          { label: 'Total Value', val: `₹${totalValue.toFixed(0)}`, icon: '💰' },
          { label: 'Total Servings', val: stock.reduce((s, i) => s + (i.availableServings || 0), 0), icon: '🍴' },
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
        <SearchBar value={search} onChange={setSearch} placeholder="Search dishes..." />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : filtered.length === 0 ? (
        <View style={S.centered}>
          <Text style={{ fontSize: 48 }}>🍽</Text>
          <Text style={S.emptyT}>No finished goods in stock</Text>
          <Text style={S.emptyS}>Log production from the Recipes screen</Text>
          <TouchableOpacity style={S.actionBtn} onPress={() => router.push('/(app)/(tabs)/recipes')}>
            <Text style={S.actionBtnText}>→ Go to Recipes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.recipeId)}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => {
            const totalVal = parseFloat(item.costPerServing || 0) * (item.availableServings || 0);
            const isLow = item.availableServings <= 5;
            return (
              <View style={[S.card, Shadow.sm, isLow && S.cardLow]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={S.recipeName}>{item.recipeName}</Text>
                    <Text style={S.recipeCategory}>{item.category}</Text>
                  </View>
                  <View style={[S.servingsBadge, { backgroundColor: isLow ? Colors.dangerLight : Colors.successLight }]}>
                    <Text style={[S.servingsNum, { color: isLow ? Colors.danger : '#15803d' }]}>{item.availableServings}</Text>
                    <Text style={[S.servingsLbl, { color: isLow ? Colors.danger : '#15803d' }]}>servings</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View>
                    <Text style={S.metaLabel}>Cost/serving</Text>
                    <Text style={S.metaVal}>₹{parseFloat(item.costPerServing || 0).toFixed(2)}</Text>
                  </View>
                  <View>
                    <Text style={S.metaLabel}>Total value</Text>
                    <Text style={[S.metaVal, { color: Colors.primary }]}>₹{totalVal.toFixed(2)}</Text>
                  </View>
                  {item.lastProducedDate && (
                    <View>
                      <Text style={S.metaLabel}>Last produced</Text>
                      <Text style={S.metaVal}>{item.lastProducedDate}</Text>
                    </View>
                  )}
                </View>
                {isLow && (
                  <View style={S.lowAlert}>
                    <Text style={S.lowAlertText}>⚠️ Low stock — consider logging production</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
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
  actionBtn:   { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  actionBtnText:{ fontSize: Typography.base, fontWeight: '600', color: Colors.primary },
  card:        { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  cardLow:     { borderColor: '#fecaca', backgroundColor: '#fff9f9' },
  recipeName:  { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  recipeCategory: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  servingsBadge:{ alignItems: 'center', padding: 8, borderRadius: Radius.md, minWidth: 64 },
  servingsNum: { fontSize: Typography.xl, fontWeight: '800' },
  servingsLbl: { fontSize: Typography.xs, fontWeight: '500' },
  metaLabel:   { fontSize: Typography.xs, color: Colors.textMuted },
  metaVal:     { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  lowAlert:    { marginTop: 8, padding: 8, backgroundColor: Colors.dangerLight, borderRadius: Radius.sm },
  lowAlertText:{ fontSize: Typography.xs, color: Colors.danger },
});
