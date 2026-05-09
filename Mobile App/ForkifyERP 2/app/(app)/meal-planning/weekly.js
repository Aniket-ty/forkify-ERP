// app/(app)/meal-planning/weekly.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mealPlanService, recipeService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import {
  Banner, FormInput, PrimaryButton, ScreenHeader,
} from '../../../src/components/common';

const DAYS       = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEAL_TYPES = ['BREAKFAST','LUNCH','DINNER','SNACK'];

const MEAL_COLORS = {
  BREAKFAST:{ bg:'#fef9c3', color:'#a16207' },
  LUNCH:    { bg:'#dcfce7', color:'#15803d' },
  DINNER:   { bg:'#eff6ff', color:'#1d4ed8' },
  SNACK:    { bg:'#fdf4ff', color:'#7e22ce' },
};

const getISOWeek = (d) => {
  const date = new Date(d); date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - ((date.getDay()+6)%7));
  const w1 = new Date(date.getFullYear(),0,4);
  return 1 + Math.round(((date-w1)/86400000 - 3 + ((w1.getDay()+6)%7))/7);
};

export default function MealPlanScreen() {
  const { branchId }    = useBranch();
  const { canApprove }  = usePermission();

  const [week,        setWeek]        = useState(getISOWeek(new Date()));
  const [year,        setYear]        = useState(new Date().getFullYear());
  const [plans,       setPlans]       = useState([]);
  const [activePlan,  setActivePlan]  = useState(null);
  const [recipes,     setRecipes]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [planName,    setPlanName]    = useState('');
  const [addModal,    setAddModal]    = useState(null); // {day, mealType}
  const [recipeSearch,setRecipeSearch]= useState('');
  const [covers,      setCovers]      = useState('10');

  // Stable ref so async saves always read latest plan
  const activePlanRef = useRef(activePlan);
  useEffect(() => { activePlanRef.current = activePlan; }, [activePlan]);

  // ── Load recipes once ──────────────────────────────────────────────────────
  useEffect(() => {
    recipeService.getAll({ status: 'ACTIVE' })
      .then(({ data }) => setRecipes(data || []))
      .catch(() => {});
  }, []);

  // ── Load plans for current week/year ───────────────────────────────────────
  const loadPlans = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await mealPlanService.getAll({ week, year, branchId });
      const list = data || [];
      setPlans(list);
      setActivePlan(prev => {
        if (!prev) return list[0] || null;
        const still = list.find(p => p.id === prev.id);
        return still || list[0] || null;
      });
    } catch { setError('Failed to load meal plans'); }
    finally { setLoading(false); }
  }, [week, year, branchId]);

  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getSlotItems = (day, mealType) =>
    (activePlan?.items || []).filter(i => i.day === day && i.mealType === mealType);

  const filteredRecipes = recipes.filter(r =>
    !recipeSearch ||
    r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
    r.category?.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  // ── Create plan ────────────────────────────────────────────────────────────
  const handleCreatePlan = async () => {
    if (!planName.trim()) { setError('Plan name is required'); return; }
    setSaving(true);
    try {
      const { data } = await mealPlanService.create(
        { planName: planName.trim(), weekNumber: week, year, status: 'DRAFT', items: [] },
        branchId
      );
      setPlans(prev => [data, ...prev]);
      setActivePlan(data);
      activePlanRef.current = data;
      setCreateModal(false); setPlanName('');
      setSuccess('Meal plan created');
    } catch (e) { setError(e.response?.data || 'Failed to create plan'); }
    finally { setSaving(false); }
  };

  // ── Core save — sends full item list, handles dedup ────────────────────────
  const savePlan = useCallback(async (plan, newItems) => {
    setSaving(true);
    const prevPlan = plan;

    // Optimistic update
    const optimistic = { ...plan, items: newItems };
    setActivePlan(optimistic);
    activePlanRef.current = optimistic;
    setPlans(prev => prev.map(p => p.id === plan.id ? optimistic : p));

    try {
      const { data } = await mealPlanService.update(plan.id, {
        planName:   plan.planName,
        weekNumber: plan.weekNumber,
        year:       plan.year,
        status:     plan.status,
        items: newItems.map(i => ({
          recipeId:       i.recipeId,
          day:            i.day,
          mealType:       i.mealType,
          expectedCovers: parseInt(i.expectedCovers) || 10,
          displayName:    i.displayName || i.recipeName,
          notes:          i.notes || null,
        })),
      });

      // Dedup server response — guards against Hibernate cascade double-insert
      const seen = new Set();
      const clean = {
        ...data,
        items: (data.items || []).filter(item => {
          const k = `${item.recipeId}:${item.day}:${item.mealType}`;
          return seen.has(k) ? false : (seen.add(k), true);
        }),
      };
      setActivePlan(clean);
      activePlanRef.current = clean;
      setPlans(prev => prev.map(p => p.id === clean.id ? clean : p));
    } catch (e) {
      setActivePlan(prevPlan);
      activePlanRef.current = prevPlan;
      setPlans(prev => prev.map(p => p.id === prevPlan.id ? prevPlan : p));
      setError(e.response?.data || 'Failed to save');
    } finally { setSaving(false); }
  }, []);

  // ── Add item ───────────────────────────────────────────────────────────────
  const handleAddItem = async (recipe) => {
    const plan = activePlanRef.current;
    if (!plan || !addModal) return;
    const newItems = [
      ...(plan.items || []),
      {
        recipeId:       recipe.id,
        recipeName:     recipe.name,
        recipeCategory: recipe.category,
        day:            addModal.day,
        mealType:       addModal.mealType,
        expectedCovers: parseInt(covers) || 10,
        displayName:    recipe.name,
      },
    ];
    setAddModal(null); setRecipeSearch(''); setCovers('10');
    await savePlan(plan, newItems);
  };

  // ── Remove item ────────────────────────────────────────────────────────────
  const handleRemoveItem = (item) => {
    const plan = activePlanRef.current;
    if (!plan) return;
    Alert.alert('Remove', `Remove ${item.displayName || item.recipeName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const newItems = (plan.items || []).filter(
            i => !(i.recipeId === item.recipeId && i.day === item.day && i.mealType === item.mealType)
          );
          await savePlan(plan, newItems);
        },
      },
    ]);
  };

  // ── Delete plan ────────────────────────────────────────────────────────────
  const handleDeletePlan = () => {
    if (!activePlan) return;
    Alert.alert('Delete Plan', `Delete "${activePlan.planName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await mealPlanService.delete(activePlan.id);
            const remaining = plans.filter(p => p.id !== activePlan.id);
            setPlans(remaining);
            setActivePlan(remaining[0] || null);
            setSuccess('Plan deleted');
          } catch (e) { setError(e.response?.data || 'Failed to delete'); }
          finally { setSaving(false); }
        },
      },
    ]);
  };

  const totalItems  = (activePlan?.items || []).length;
  const totalCovers = (activePlan?.items || []).reduce((s, i) => s + (parseInt(i.expectedCovers) || 0), 0);

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <ScreenHeader
        title="🥗 Meal Planner"
        subtitle={`Week ${week}, ${year}`}
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={S.weekBtn} onPress={() => setWeek(w => w > 1 ? w - 1 : (setYear(y => y - 1), 52))}>
              <Text style={S.weekBtnTxt}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.weekBtn} onPress={() => setWeek(w => w < 52 ? w + 1 : (setYear(y => y + 1), 1))}>
              <Text style={S.weekBtnTxt}>›</Text>
            </TouchableOpacity>
            {canApprove && (
              <TouchableOpacity style={S.addBtn} onPress={() => setCreateModal(true)}>
                <Text style={S.addBtnTxt}>+ New</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Banners */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
        <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        {saving && <Banner type="info" message="Saving..." />}
      </View>

      {/* Plan selector */}
      {plans.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={S.planTabsScroll} contentContainerStyle={S.planTabsContent}>
          {plans.map(p => (
            <TouchableOpacity key={p.id}
              style={[S.planTab, activePlan?.id === p.id && S.planTabActive]}
              onPress={() => setActivePlan(p)}>
              <Text style={[S.planTabTxt, activePlan?.id === p.id && S.planTabTxtActive]}>
                {p.planName}
              </Text>
              <View style={[S.statusPill, { backgroundColor: p.status === 'ACTIVE' ? '#dcfce7' : '#f3f4f6' }]}>
                <Text style={[S.statusPillTxt, { color: p.status === 'ACTIVE' ? '#15803d' : '#9ca3af' }]}>
                  {p.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Stats bar */}
      {activePlan && (
        <View style={S.statsBar}>
          <View style={S.statItem}>
            <Text style={S.statVal}>{totalItems}</Text>
            <Text style={S.statLbl}>Meals</Text>
          </View>
          <View style={S.statItem}>
            <Text style={S.statVal}>{totalCovers}</Text>
            <Text style={S.statLbl}>Covers</Text>
          </View>
          <View style={S.statItem}>
            <Text style={S.statVal}>{activePlan.status}</Text>
            <Text style={S.statLbl}>Status</Text>
          </View>
          <TouchableOpacity style={S.deleteBtn} onPress={handleDeletePlan}>
            <Text style={S.deleteBtnTxt}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={S.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={S.loadingTxt}>Loading plans...</Text>
        </View>
      )}

      {!loading && plans.length === 0 && (
        <View style={S.centered}>
          <Text style={{ fontSize: 48 }}>🥗</Text>
          <Text style={S.emptyTitle}>No plans for Week {week}, {year}</Text>
          <Text style={S.emptySub}>Create a meal plan to start scheduling</Text>
          {canApprove && (
            <TouchableOpacity style={S.addBtn} onPress={() => setCreateModal(true)}>
              <Text style={S.addBtnTxt}>+ Create Meal Plan</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Weekly grid */}
      {activePlan && !loading && (
        <ScrollView horizontal showsHorizontalScrollIndicator style={S.gridScroll}>
          <View>
            {/* Header row */}
            <View style={S.gridHeaderRow}>
              <View style={S.gridLabelCell}><Text style={S.gridHeaderTxt}>MEAL</Text></View>
              {DAYS.map(d => (
                <View key={d} style={S.gridDayCell}>
                  <Text style={S.gridHeaderTxt}>{d.slice(0,3).toUpperCase()}</Text>
                </View>
              ))}
            </View>

            {/* Data rows */}
            {MEAL_TYPES.map(mealType => {
              const cfg = MEAL_COLORS[mealType];
              return (
                <View key={mealType} style={S.gridDataRow}>
                  <View style={[S.gridLabelCell, { borderLeftWidth: 3, borderLeftColor: cfg.color }]}>
                    <Text style={[S.mealTypeTxt, { color: cfg.color }]}>{mealType}</Text>
                  </View>
                  {DAYS.map((_, di) => {
                    const dayNum = di + 1;
                    const items  = getSlotItems(dayNum, mealType);
                    return (
                      <View key={dayNum} style={S.gridDayCell}>
                        {items.map((item, idx) => (
                          <TouchableOpacity
                            key={`${item.recipeId}-${idx}`}
                            style={[S.mealChip, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}
                            onLongPress={() => handleRemoveItem(item)}
                            activeOpacity={0.7}
                          >
                            <Text style={[S.mealChipName, { color: cfg.color }]} numberOfLines={2}>
                              {item.displayName || item.recipeName}
                            </Text>
                            <Text style={[S.mealChipCovers, { color: cfg.color + 'aa' }]}>
                              👥 {item.expectedCovers}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={S.addCellBtn}
                          onPress={() => setAddModal({ day: dayNum, mealType })}
                        >
                          <Text style={S.addCellTxt}>+</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {activePlan && (
        <Text style={S.hint}>Long-press a meal chip to remove it</Text>
      )}

      {/* ── Create Plan Modal ── */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => setCreateModal(false)}>
        <SafeAreaView style={S.modalContainer} edges={['top']}>
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>New Meal Plan — Week {week}, {year}</Text>
            <TouchableOpacity onPress={() => setCreateModal(false)}>
              <Text style={S.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={S.modalBody}>
            <Text style={S.fieldLabel}>PLAN NAME</Text>
            <FormInput
              value={planName}
              onChangeText={setPlanName}
              placeholder={`Week ${week} Menu`}
              autoFocus
            />
          </View>
          <View style={S.modalFooter}>
            <TouchableOpacity style={S.cancelBtn} onPress={() => setCreateModal(false)}>
              <Text style={S.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
            <PrimaryButton
              label={saving ? 'Creating...' : 'Create Plan'}
              onPress={handleCreatePlan}
              loading={saving}
              disabled={!planName.trim()}
              small
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Add Recipe Modal ── */}
      <Modal visible={!!addModal} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => { setAddModal(null); setRecipeSearch(''); setCovers('10'); }}>
        <SafeAreaView style={S.modalContainer} edges={['top']}>
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>
              Add {addModal?.mealType} — {DAYS[(addModal?.day || 1) - 1]}
            </Text>
            <TouchableOpacity onPress={() => { setAddModal(null); setRecipeSearch(''); setCovers('10'); }}>
              <Text style={S.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={S.modalBody}>
            {/* Covers */}
            <View style={S.coversRow}>
              <Text style={S.fieldLabel}>EXPECTED COVERS:</Text>
              <FormInput
                value={covers}
                onChangeText={setCovers}
                keyboardType="number-pad"
                style={{ width: 80, marginBottom: 0 }}
              />
            </View>

            {/* Search */}
            <View style={S.searchWrap}>
              <Text>🔍</Text>
              <FormInput
                value={recipeSearch}
                onChangeText={setRecipeSearch}
                placeholder="Search recipes..."
                style={{ flex: 1, marginBottom: 0 }}
                autoFocus
              />
              {!!recipeSearch && (
                <TouchableOpacity onPress={() => setRecipeSearch('')}>
                  <Text style={{ color: Colors.textMuted }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {filteredRecipes.length === 0 ? (
              <View style={S.centered}>
                <Text style={S.emptySub}>No recipes found</Text>
              </View>
            ) : filteredRecipes.map(r => (
              <TouchableOpacity key={r.id} style={S.recipeRow} onPress={() => handleAddItem(r)}>
                <View style={{ flex: 1 }}>
                  <Text style={S.recipeRowName}>{r.name}</Text>
                  <Text style={S.recipeRowMeta}>
                    {r.category}{(r.prepTime + r.cookTime) > 0 ? ` · ${r.prepTime + r.cookTime}m` : ''}
                    {r.costPerServing ? ` · ₹${Number(r.costPerServing).toFixed(0)}/srv` : ''}
                  </Text>
                </View>
                <Text style={S.recipeRowAdd}>＋</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  weekBtn:         { width: 32, height: 32, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  weekBtnTxt:      { fontSize: 18, color: Colors.textSecondary, lineHeight: 22 },
  addBtn:          { paddingHorizontal: 13, paddingVertical: 7, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: '#b3ccf5' },
  addBtnTxt:       { fontSize: Typography.sm, fontWeight: '600', color: Colors.primaryDark },
  planTabsScroll:  { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: Colors.border },
  planTabsContent: { paddingHorizontal: Spacing.lg, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  planTab:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.card, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  planTabActive:   { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  planTabTxt:      { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  planTabTxtActive:{ color: Colors.primary },
  statusPill:      { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.full },
  statusPillTxt:   { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  statsBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 10, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 20 },
  statItem:        { alignItems: 'center' },
  statVal:         { fontSize: Typography.md, fontWeight: '800', color: Colors.text },
  statLbl:         { fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn:       { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fef2f2', borderRadius: Radius.md, borderWidth: 1, borderColor: '#fecaca' },
  deleteBtnTxt:    { fontSize: Typography.xs, fontWeight: '600', color: Colors.danger },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: Spacing.xxl },
  loadingTxt:      { fontSize: Typography.sm, color: Colors.textMuted },
  emptyTitle:      { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  emptySub:        { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  hint:            { textAlign: 'center', fontSize: 10, color: Colors.textMuted, paddingVertical: 6 },
  gridScroll:      { flex: 1 },
  gridHeaderRow:   { flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  gridDataRow:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  gridLabelCell:   { width: 80, paddingHorizontal: 8, paddingVertical: 10, justifyContent: 'center', backgroundColor: Colors.card, borderRightWidth: 1, borderRightColor: Colors.borderLight },
  gridDayCell:     { width: 120, paddingHorizontal: 4, paddingVertical: 6, borderRightWidth: 1, borderRightColor: Colors.borderLight, gap: 4 },
  gridHeaderTxt:   { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textAlign: 'center', letterSpacing: 0.5 },
  mealTypeTxt:     { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  mealChip:        { borderRadius: Radius.sm, borderWidth: 1, padding: 5 },
  mealChipName:    { fontSize: 10, fontWeight: '700', lineHeight: 14 },
  mealChipCovers:  { fontSize: 9, marginTop: 2 },
  addCellBtn:      { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.borderLight, borderRadius: Radius.sm, alignItems: 'center', paddingVertical: 4 },
  addCellTxt:      { fontSize: Typography.sm, color: Colors.textMuted },
  modalContainer:  { flex: 1, backgroundColor: Colors.card },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:      { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, flex: 1 },
  modalClose:      { fontSize: Typography.xl, color: Colors.textMuted, padding: 4 },
  modalBody:       { padding: Spacing.lg },
  modalFooter:     { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  fieldLabel:      { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  cancelBtn:       { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center' },
  cancelBtnTxt:    { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  coversRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  searchWrap:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  recipeRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  recipeRowName:   { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  recipeRowMeta:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  recipeRowAdd:    { fontSize: 22, color: Colors.primary, fontWeight: '300', paddingLeft: 8 },
});