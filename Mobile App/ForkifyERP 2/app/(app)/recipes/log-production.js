// log-production.js - full screen (see previous implementation)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { productionService, recipeService } from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Spacing, Shadow } from '../../../src/theme';
import { Banner, FormInput, PrimaryButton, LoadingScreen, ScreenHeader} from '../../../src/components/common';

export default function LogProduction() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { branchId } = useBranch();
  const [recipe,    setRecipe]    = useState(null);
  const [servings,  setServings]  = useState('');
  const [preview,   setPreview]   = useState(null);
  const [previewing,setPreviewing]= useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(null);

  useEffect(() => {
    if (id) recipeService.getById(id).then(({ data }) => { setRecipe(data); setServings(String(data.servings || 1)); }).catch(() => setError('Failed to load recipe'));
  }, [id]);

  const handlePreview = async () => {
    if (!servings || parseInt(servings) <= 0) { setError('Enter valid servings'); return; }
    setPreviewing(true); setError(null);
    try { const { data } = await productionService.preview(id, parseInt(servings), branchId); setPreview(data); }
    catch (e) { setError(e.response?.data || 'Preview failed'); }
    finally { setPreviewing(false); }
  };

  const handleProduce = async () => {
    setSaving(true); setError(null);
    try {
      await productionService.logProduction({ recipeId: parseInt(id), servings: parseInt(servings), notes: '' }, branchId);
      setSuccess(`✅ ${servings} servings of ${recipe?.name} produced!`);
      setTimeout(() => router.back(), 1500);
    } catch (e) { setError(e.response?.data || 'Production failed'); }
    finally { setSaving(false); }
  };

  if (!recipe) return <LoadingScreen message="Loading..." />;

  return (
    <View style={S.container}>
      <ScreenHeader
          title="▶  Log Production"
          subtitle={recipe.name}
        />
      <ScrollView contentContainerStyle={S.content}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <View style={[S.card, Shadow.sm]}>
          <Text style={S.recipeName}>{recipe.name}</Text>
          <Text style={S.recipeMeta}>{recipe.category} · Base: {recipe.servings} servings</Text>
        </View>
        <View style={[S.card, Shadow.sm]}>
          <Text style={S.sectionTitle}>Servings to Produce</Text>
          <View style={S.servingsRow}>
            <TouchableOpacity style={S.sBtn} onPress={() => setServings(s => String(Math.max(1, parseInt(s||1) - 1)))}><Text style={S.sBtnTxt}>−</Text></TouchableOpacity>
            <FormInput value={servings} onChangeText={setServings} keyboardType="number-pad" style={{ flex: 1, textAlign: 'center', marginBottom: 0 }} />
            <TouchableOpacity style={S.sBtn} onPress={() => setServings(s => String(parseInt(s||0) + 1))}><Text style={S.sBtnTxt}>+</Text></TouchableOpacity>
          </View>
          <PrimaryButton label={previewing ? 'Checking...' : '🔍 Preview Deductions'} onPress={handlePreview} loading={previewing} outline style={{ marginTop: 12 }} />
        </View>
        {preview && (
          <View style={[S.card, Shadow.sm]}>
            <Text style={S.sectionTitle}>📦 Ingredient Deductions</Text>
            {(preview.deductions || []).map((d, i) => {
              const ok = d.currentStock >= d.required;
              return (
                <View key={i} style={[S.deductRow, !ok && { backgroundColor: '#fff5f5' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={S.dName}>{d.ingredientName}</Text>
                    <Text style={S.dQty}>Need {d.required} {d.unit} · Have {d.currentStock} {d.unit}</Text>
                  </View>
                  <Text style={{ color: ok ? Colors.success : Colors.danger, fontSize: 18, fontWeight: '700' }}>{ok ? '✓' : '✗'}</Text>
                </View>
              );
            })}
          </View>
        )}
        <PrimaryButton label={saving ? 'Logging...' : `▶ Produce ${servings} Servings`} onPress={handleProduce} loading={saving} disabled={!preview} style={{ marginTop: 8 }} />
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header:    { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:   { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  title:     { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  sub:       { fontSize: Typography.xs, color: Colors.textMuted },
  content:   { padding: Spacing.lg, gap: Spacing.md },
  card:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  recipeName:{ fontSize: Typography.xl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  recipeMeta:{ fontSize: Typography.sm, color: Colors.textMuted },
  sectionTitle:{ fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  servingsRow:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  sBtn:      { width: 44, height: 44, backgroundColor: Colors.primaryLight, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#b3ccf5' },
  sBtnTxt:   { fontSize: 22, fontWeight: '700', color: Colors.primary, lineHeight: 24 },
  deductRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  dName:     { fontSize: Typography.sm, fontWeight: '600', color: Colors.text },
  dQty:      { fontSize: Typography.xs, color: Colors.textMuted },
});
