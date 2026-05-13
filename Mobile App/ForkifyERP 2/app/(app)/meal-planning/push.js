// app/(app)/meal-planning/push.js — Push Meal Plan to Branches
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mealPlanService, branchService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, EmptyState, ScreenHeader, PrimaryButton } from '../../../src/components/common';

export default function PushToBranches() {
  const { branchId }        = useBranch();
  const { isHQ }            = usePermission();
  const [plans,    setPlans]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [branches, setBranches] = useState([]);
  const [checked,  setChecked]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [pushing,  setPushing]  = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([
        mealPlanService.getAll({ branchId }),
        branchService.getAll(),
      ]);
      setPlans(pRes.data || []);
      setBranches((bRes.data || []).filter(b => String(b.id) !== String(branchId)));
    } catch { setError('Failed to load data'); }
    finally  { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  const toggleBranch = (id) => {
    setChecked(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setChecked(branches.length === checked.length ? [] : branches.map(b => b.id));
  };

  const handlePush = () => {
    if (!checked.length) { setError('Select at least one branch'); return; }
    Alert.alert(
      'Push Meal Plan',
      `Push "${selected.name || `Plan #${selected.id}`}" to ${checked.length} branch${checked.length > 1 ? 'es' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Push',
          onPress: async () => {
            setPushing(true);
            try {
              await mealPlanService.pushToBranches(selected.id, checked);
              setSuccess(`Plan pushed to ${checked.length} branch${checked.length > 1 ? 'es' : ''}`);
              setChecked([]);
              setSelected(null);
            } catch { setError('Failed to push meal plan'); }
            finally  { setPushing(false); }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen message="Loading..." />;

  if (!isHQ) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScreenHeader title="Push to Branches" subtitle="HQ only" />
        <EmptyState icon="🔒" title="HQ Access Only" subtitle="Only HQ accounts can push meal plans to branches" />
      </SafeAreaView>
    );
  }

  if (!selected) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScreenHeader title="Push to Branches" subtitle="Select a meal plan to push" />
        <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
        <Banner type="success" message={success} />

        {plans.length === 0
          ? <EmptyState icon="📋" title="No meal plans" subtitle="Create meal plans in Weekly Planning" />
          : (
            <FlatList
              data={plans}
              keyExtractor={p => String(p.id)}
              contentContainerStyle={{ padding: Spacing.lg }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.planCard, Shadow.sm]}
                  onPress={() => { setSelected(item); setChecked([]); }}
                  activeOpacity={0.8}
                >
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Select Branches"
        subtitle={selected.name || `Plan #${selected.id}`}
        left={
          <TouchableOpacity onPress={() => { setSelected(null); setChecked([]); }}>
            <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} />

      {/* Select all */}
      <TouchableOpacity style={styles.selectAllRow} onPress={selectAll}>
        <Ionicons
          name={checked.length === branches.length && branches.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={checked.length === branches.length && branches.length > 0 ? Colors.primary : Colors.textMuted}
        />
        <Text style={styles.selectAllText}>
          {checked.length === branches.length && branches.length > 0 ? 'Deselect All' : 'Select All'}
        </Text>
        <Text style={styles.selectedCount}>{checked.length} selected</Text>
      </TouchableOpacity>

      {branches.length === 0
        ? <EmptyState icon="🏪" title="No other branches" subtitle="No branches to push to" />
        : (
          <FlatList
            data={branches}
            keyExtractor={b => String(b.id)}
            contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 120 }}
            renderItem={({ item }) => {
              const on = checked.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.branchCard, Shadow.sm, on && styles.branchCardSelected]}
                  onPress={() => toggleBranch(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.branchIcon, { backgroundColor: on ? Colors.primaryLight : Colors.bg }]}>
                    <Ionicons name={item.type === 'HQ' ? 'business' : 'storefront-outline'} size={20} color={on ? Colors.primary : Colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.branchName, on && { color: Colors.primary }]}>{item.name}</Text>
                    {item.city && <Text style={styles.branchCity}>{item.city}</Text>}
                    {item.type && <Text style={styles.branchType}>{item.type}</Text>}
                  </View>
                  <Ionicons
                    name={on ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={on ? Colors.primary : Colors.textMuted}
                  />
                </TouchableOpacity>
              );
            }}
          />
        )
      }

      {/* Push button fixed at bottom */}
      {branches.length > 0 && (
        <View style={styles.footer}>
          <PrimaryButton
            label={`Push to ${checked.length || 0} Branch${checked.length !== 1 ? 'es' : ''}`}
            onPress={handlePush}
            loading={pushing}
            disabled={checked.length === 0}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.bg },
  planCard:           { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIcon:           { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  planName:           { fontSize: Typography.md, fontWeight: '700', color: Colors.text },
  planSub:            { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  selectAllRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectAllText:      { flex: 1, fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  selectedCount:      { fontSize: Typography.sm, color: Colors.primary, fontWeight: '700' },
  branchCard:         { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  branchCardSelected: { borderColor: Colors.primary, borderWidth: 1.5 },
  branchIcon:         { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  branchName:         { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  branchCity:         { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  branchType:         { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  footer:             { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
});
