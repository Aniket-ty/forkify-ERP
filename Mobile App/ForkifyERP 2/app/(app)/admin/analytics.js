// app/(app)/admin/analytics.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsService } from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, ProgressBar } from '../../../src/components/common';

const PERIODS = [7, 14, 30, 90];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { branchId } = useBranch();
  const [overview, setOverview] = useState(null);
  const [foodCost, setFoodCost] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [days, setDays]         = useState(30);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, fRes] = await Promise.all([
        analyticsService.getOverview(branchId, days),
        analyticsService.getFoodCost(branchId, days),
      ]);
      setOverview(oRes.data);
      setFoodCost(fRes.data);
    } catch { setError('Failed to load analytics'); }
    finally  { setLoading(false); }
  }, [branchId, days]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}><Text style={{ fontSize: 18 }}>←</Text></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={S.headerTitle}>📈 Analytics</Text><Text style={S.headerSub}>Business performance overview</Text></View>
      </View>

      {/* Period selector */}
      <View style={S.periodRow}>
        {PERIODS.map(d => (
          <TouchableOpacity key={d} onPress={() => setDays(d)} style={[S.periodBtn, days === d && S.periodBtnActive]}>
            <Text style={[S.periodBtnText, days === d && S.periodBtnTextActive]}>{d}d</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.lg }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
          {/* Revenue KPIs */}
          {overview && (
            <View style={[S.section, Shadow.sm]}>
              <Text style={S.sectionTitle}>💰 Revenue Overview</Text>
              <View style={S.kpiGrid}>
                {[
                  { label: 'Total Revenue', val: `₹${Number(overview.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰' },
                  { label: 'Avg Daily', val: `₹${Number(overview.avgDailyRevenue || 0).toFixed(0)}`, icon: '📊' },
                  { label: 'Total Orders', val: overview.totalOrders || 0, icon: '🛒' },
                  { label: 'Avg Order Value', val: `₹${Number(overview.avgOrderValue || 0).toFixed(0)}`, icon: '🎫' },
                ].map((k, i) => (
                  <View key={i} style={S.kpiCard}>
                    <Text style={S.kpiIcon}>{k.icon}</Text>
                    <Text style={S.kpiVal}>{k.val}</Text>
                    <Text style={S.kpiLabel}>{k.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Food Cost */}
          {foodCost && (
            <View style={[S.section, Shadow.sm]}>
              <Text style={S.sectionTitle}>🍽 Food Cost Analysis</Text>
              <View style={S.costRow}>
                <View style={S.costCard}>
                  <Text style={S.costVal}>{Number(foodCost.foodCostPercent || 0).toFixed(1)}%</Text>
                  <Text style={S.costLabel}>Food Cost %</Text>
                </View>
                <View style={S.costCard}>
                  <Text style={S.costVal}>₹{Number(foodCost.totalFoodCost || 0).toFixed(0)}</Text>
                  <Text style={S.costLabel}>Total Cost</Text>
                </View>
                <View style={S.costCard}>
                  <Text style={[S.costVal, { color: foodCost.grossMarginPercent > 60 ? Colors.success : Colors.warning }]}>
                    {Number(foodCost.grossMarginPercent || 0).toFixed(1)}%
                  </Text>
                  <Text style={S.costLabel}>Gross Margin</Text>
                </View>
              </View>

              <View style={{ marginTop: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={S.progressLabel}>Food Cost</Text>
                  <Text style={S.progressVal}>{Number(foodCost.foodCostPercent || 0).toFixed(1)}%</Text>
                </View>
                <ProgressBar
                  percent={Number(foodCost.foodCostPercent || 0)}
                  color={foodCost.foodCostPercent > 35 ? Colors.danger : foodCost.foodCostPercent > 28 ? Colors.warning : Colors.success}
                />
                <Text style={S.benchmark}>Industry benchmark: 28–35%</Text>
              </View>
            </View>
          )}

          {/* Top performing recipes */}
          {overview?.topRecipes && overview.topRecipes.length > 0 && (
            <View style={[S.section, Shadow.sm]}>
              <Text style={S.sectionTitle}>⭐ Top Recipes</Text>
              {overview.topRecipes.slice(0, 5).map((r, i) => (
                <View key={i} style={S.recipeRow}>
                  <View style={S.rankBadge}><Text style={S.rankText}>#{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.recipeName}>{r.recipeName}</Text>
                    <Text style={S.recipeMeta}>{r.quantitySold} sold</Text>
                  </View>
                  <Text style={S.recipeRev}>₹{Number(r.revenue || 0).toFixed(0)}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub:   { fontSize: Typography.xs, color: Colors.textMuted },
  periodRow:   { flexDirection: 'row', gap: 8, padding: Spacing.lg, paddingVertical: Spacing.md },
  periodBtn:   { flex: 1, paddingVertical: 7, backgroundColor: Colors.card, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  periodBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  periodBtnText:   { fontSize: Typography.sm, color: Colors.textSecondary },
  periodBtnTextActive: { color: Colors.primary, fontWeight: '700' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section:     { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionTitle:{ fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  kpiGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiCard:     { flex: 1, minWidth: '45%', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: 4 },
  kpiIcon:     { fontSize: 20 },
  kpiVal:      { fontSize: Typography.md, fontWeight: '800', color: Colors.text },
  kpiLabel:    { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
  costRow:     { flexDirection: 'row', gap: Spacing.sm },
  costCard:    { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  costVal:     { fontSize: Typography.xl, fontWeight: '800', color: Colors.text },
  costLabel:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  progressLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  progressVal: { fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
  benchmark:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },
  recipeRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rankBadge:   { width: 28, height: 28, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  rankText:    { fontSize: Typography.xs, fontWeight: '700', color: Colors.primary },
  recipeName:  { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  recipeMeta:  { fontSize: Typography.xs, color: Colors.textMuted },
  recipeRev:   { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },
});
