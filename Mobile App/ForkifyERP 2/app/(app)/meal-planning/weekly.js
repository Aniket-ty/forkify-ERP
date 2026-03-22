// app/(app)/meal-planning/weekly.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mealPlanService, recipeService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, FormField, FormInput, PrimaryButton, SearchBar, ScreenHeader} from '../../../src/components/common';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function MealPlanScreen() {
  const router = useRouter();
  const { branchId } = useBranch();
  const { canApprove } = usePermission();
  const [plans, setPlans]         = useState([]);
  const [recipes, setRecipes]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [form, setForm] = useState({ name: '', weekStartDate: '', targetServings: '100' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        mealPlanService.getAll({ branchId }),
        recipeService.getAll({ status: 'ACTIVE' }),
      ]);
      setPlans(pRes.data || []);
      setRecipes(rRes.data || []);
    } catch { setError('Failed to load meal plans'); }
    finally  { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = async () => {
    if (!form.name || !form.weekStartDate) { setError('Name and start date required'); return; }
    setSaving(true);
    try {
      await mealPlanService.create({ name: form.name, weekStartDate: form.weekStartDate, targetServings: parseInt(form.targetServings) || 100 }, branchId);
      setSuccess('Meal plan created');
      setModalOpen(false);
      setForm({ name: '', weekStartDate: '', targetServings: '100' });
      load();
    } catch (e) { setError(e.response?.data || 'Failed to create meal plan'); }
    finally { setSaving(false); }
  };

  const filtered = plans.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScreenHeader title="🥗 Meal Planning"
          subtitle={`${plans.length} plans`}
          right={canApprove && <TouchableOpacity style={S.addBtn} onPress={() => setModalOpen(true)}><Text style={S.addBtnText}>+ New Plan</Text></TouchableOpacity>}
        />

      <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search meal plans..." />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : filtered.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>🥗</Text><Text style={S.emptyT}>No meal plans yet</Text><Text style={S.emptyS}>Create weekly meal plans to forecast ingredient needs</Text></View>
      : <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          renderItem={({ item: plan }) => (
            <TouchableOpacity style={[S.card, Shadow.sm]} onPress={() => setDetailPlan(plan)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={S.planName}>{plan.name}</Text>
                  <Text style={S.metaText}>📅 Week of {plan.weekStartDate}</Text>
                  <Text style={S.metaText}>🍴 {plan.targetServings || '—'} servings · {(plan.meals || []).length} meal slots</Text>
                </View>
                <View style={S.chevron}><Text style={S.chevronText}>›</Text></View>
              </View>
            </TouchableOpacity>
          )} />}

      {/* Create Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}><Text style={S.mTitle}>New Meal Plan</Text><TouchableOpacity onPress={() => setModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Plan Name *"><FormInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Week 12 Menu" /></FormField>
            <FormField label="Week Start Date (YYYY-MM-DD) *"><FormInput value={form.weekStartDate} onChangeText={v => setForm(f => ({ ...f, weekStartDate: v }))} placeholder="e.g. 2026-03-23" /></FormField>
            <FormField label="Target Servings per Day"><FormInput value={form.targetServings} onChangeText={v => setForm(f => ({ ...f, targetServings: v }))} keyboardType="number-pad" placeholder="100" /></FormField>
            <PrimaryButton label="Create Meal Plan" onPress={handleCreate} loading={saving} style={{ marginTop: 8, marginBottom: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Detail Modal */}
      {detailPlan && (
        <Modal visible animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
            <View style={S.mHeader}><Text style={S.mTitle}>{detailPlan.name}</Text><TouchableOpacity onPress={() => setDetailPlan(null)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
            <ScrollView style={{ padding: Spacing.lg }}>
              <Text style={S.metaText}>📅 Week of {detailPlan.weekStartDate} · 🍴 {detailPlan.targetServings} servings/day</Text>
              {DAYS.map(day => {
                const dayMeals = (detailPlan.meals || []).filter(m => m.dayOfWeek === day);
                return (
                  <View key={day} style={S.daySection}>
                    <Text style={S.dayTitle}>{day}</Text>
                    {MEALS.map(meal => {
                      const mealItems = dayMeals.filter(m => m.mealType === meal);
                      return (
                        <View key={meal} style={S.mealRow}>
                          <Text style={S.mealType}>{meal}</Text>
                          {mealItems.length === 0
                            ? <Text style={S.noItem}>—</Text>
                            : mealItems.map((it, idx) => <Text key={idx} style={S.mealItem}>{it.recipeName}</Text>)}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub:   { fontSize: Typography.xs, color: Colors.textMuted },
  addBtn:      { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.primary },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:      { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptyS:      { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  card:        { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  planName:    { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  metaText:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  chevron:     { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  chevronText: { fontSize: 20, color: Colors.textMuted },
  mHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:      { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, flex: 1 },
  mClose:      { fontSize: Typography.xl, color: Colors.textMuted },
  daySection:  { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  dayTitle:    { fontSize: Typography.base, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  mealRow:     { flexDirection: 'row', gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  mealType:    { width: 80, fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  noItem:      { fontSize: Typography.xs, color: Colors.textMuted },
  mealItem:    { flex: 1, fontSize: Typography.xs, color: Colors.text },
});
