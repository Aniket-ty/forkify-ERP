// app/(app)/meal-planning/forecast.js — Ingredient Forecast & Shopping List
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mealPlanService } from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, EmptyState, ScreenHeader } from '../../../src/components/common';

const TABS = ['forecast', 'shopping'];

export default function IngredientForecast() {
  const { branchId } = useBranch();
  const [plans,       setPlans]       = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [tab,         setTab]         = useState('forecast');
  const [forecast,    setForecast]    = useState([]);
  const [shopping,    setShopping]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error,       setError]       = useState(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await mealPlanService.getAll({ branchId });
      setPlans(data || []);
    } catch { setError('Failed to load meal plans'); }
    finally  { setLoading(false); }
  }, [branchId]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const selectPlan = async (plan) => {
    setSelected(plan);
    setLoadingData(true);
    setForecast([]);
    setShopping([]);
    try {
      const [fRes, sRes] = await Promise.all([
        mealPlanService.getForecast(plan.id, branchId),
        mealPlanService.getShoppingList(plan.id, branchId),
      ]);
      setForecast(fRes.data || []);
      setShopping(sRes.data || []);
    } catch { setError('Failed to load forecast data'); }
    finally  { setLoadingData(false); }
  };

  if (loading) return <LoadingScreen message="Loading meal plans..." />;

  if (!selected) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScreenHeader title="Ingredient Forecast" subtitle="Select a meal plan" />
        <Banner type="error" message={error} onDismiss={() => setError(null)} />

        {plans.length === 0
          ? <EmptyState icon="📊" title="No meal plans" subtitle="Create meal plans in Weekly Planning" />
          : (
            <FlatList
              data={plans}
              keyExtractor={p => String(p.id)}
              contentContainerStyle={{ padding: Spacing.lg }}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.planCard, Shadow.sm]} onPress={() => selectPlan(item)} activeOpacity={0.8}>
                  <View style={styles.planIcon}>
                    <Text style={{ fontSize: 22 }}>📋</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{item.name || `Plan #${item.id}`}</Text>
                    {item.weekStart && (
                      <Text style={styles.planSub}>
                        Week of {new Date(item.weekStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    )}
                    {item.branch && <Text style={styles.planSub}>📍 {item.branch}</Text>}
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

  const listData = tab === 'forecast' ? forecast : shopping;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title={selected.name || `Plan #${selected.id}`}
        subtitle="Forecast & Shopping List"
        left={
          <TouchableOpacity onPress={() => { setSelected(null); setForecast([]); setShopping([]); }}>
            <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <Banner type="error" message={error} onDismiss={() => setError(null)} />

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'forecast' ? '📊 Forecast' : '🛒 Shopping List'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingData
        ? <LoadingScreen message="Loading data..." />
        : listData.length === 0
          ? <EmptyState icon={tab === 'forecast' ? '📊' : '🛒'} title="No data" subtitle="No data available for this plan" />
          : (
            <FlatList
              data={listData}
              keyExtractor={(item, i) => String(item.ingredientId || item.id || i)}
              contentContainerStyle={{ padding: Spacing.lg }}
              renderItem={({ item }) => (
                <View style={[styles.itemCard, Shadow.sm]}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.ingredientName || item.name}</Text>
                      {item.category && <Text style={styles.itemSub}>{item.category}</Text>}
                    </View>
                    <View style={styles.qtyCol}>
                      <Text style={styles.qtyText}>{Number(item.requiredQty || item.quantity || 0).toFixed(2)}</Text>
                      <Text style={styles.qtyUnit}>{item.unit || 'kg'}</Text>
                    </View>
                  </View>

                  {tab === 'forecast' && (
                    <View style={styles.metaRow}>
                      {item.currentStock != null && (
                        <Text style={styles.metaChip}>📦 Stock: {Number(item.currentStock).toFixed(2)} {item.unit}</Text>
                      )}
                      {item.shortage != null && item.shortage > 0 && (
                        <Text style={[styles.metaChip, { backgroundColor: '#fef3c7', color: '#b45309' }]}>
                          ⚠️ Short: {Number(item.shortage).toFixed(2)} {item.unit}
                        </Text>
                      )}
                    </View>
                  )}

                  {tab === 'shopping' && item.estimatedCost != null && (
                    <Text style={styles.costNote}>Est. cost: ₹{Number(item.estimatedCost).toFixed(2)}</Text>
                  )}
                </View>
              )}
              ListFooterComponent={
                tab === 'shopping' && shopping.length > 0 ? (
                  <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total Estimated Cost</Text>
                    <Text style={styles.totalValue}>
                      ₹{shopping.reduce((s, i) => s + (parseFloat(i.estimatedCost) || 0), 0).toFixed(2)}
                    </Text>
                  </View>
                ) : null
              }
            />
          )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  planCard:    { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIcon:    { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  planName:    { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  planSub:     { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  tabRow:      { flexDirection: 'row', margin: Spacing.lg, marginBottom: 0, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 4, gap: 4 },
  tabBtn:      { flex: 1, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center' },
  tabBtnActive:{ backgroundColor: Colors.primary },
  tabText:     { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive:{ color: '#fff' },
  itemCard:    { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  itemRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  itemName:    { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  itemSub:     { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  qtyCol:      { alignItems: 'flex-end' },
  qtyText:     { fontSize: Typography.md, fontWeight: '800', color: Colors.primary },
  qtyUnit:     { fontSize: Typography.xs, color: Colors.textMuted },
  metaRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  metaChip:    { fontSize: Typography.xs, backgroundColor: Colors.bg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, color: Colors.textSecondary, fontWeight: '500' },
  costNote:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 6 },
  totalCard:   { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:  { fontSize: Typography.base, fontWeight: '600', color: Colors.primary },
  totalValue:  { fontSize: Typography.xl, fontWeight: '800', color: Colors.primary },
});
