// app/(app)/recipes/versions.js — Recipe Version History
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { recipeVersionService, recipeService } from '../../../src/services';
import { usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { LoadingScreen, Banner, EmptyState, ScreenHeader, PrimaryButton } from '../../../src/components/common';

export default function RecipeVersionHistory() {
  const { id: recipeId } = useLocalSearchParams();
  const { canEditMasterData } = usePermission();

  const [versions,  setVersions]  = useState([]);
  const [recipe,    setRecipe]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(null);
  const [snapModal, setSnapModal] = useState(false);
  const [summary,   setSummary]   = useState('');

  const load = useCallback(async () => {
    if (!recipeId) return;
    setLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([
        recipeVersionService.getVersions(recipeId),
        recipeService.getById(recipeId),
      ]);
      setVersions(vRes.data || []);
      setRecipe(rRes.data);
    } catch { setError('Failed to load version history'); }
    finally  { setLoading(false); }
  }, [recipeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  const handleSnapshot = async () => {
    if (!summary.trim()) { setError('Please enter a version summary'); return; }
    setSaving(true);
    try {
      await recipeVersionService.saveSnapshot(recipeId, summary.trim());
      setSuccess('Version snapshot saved');
      setSummary('');
      setSnapModal(false);
      load();
    } catch { setError('Failed to save snapshot'); }
    finally  { setSaving(false); }
  };

  const handleRestore = (version) => {
    Alert.alert(
      'Restore Version',
      `Restore recipe to version ${version.versionNumber}? This will overwrite the current version.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              await recipeVersionService.restore(recipeId, version.versionNumber);
              setSuccess(`Restored to version ${version.versionNumber}`);
              load();
            } catch { setError('Failed to restore version'); }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen message="Loading version history..." />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Version History"
        subtitle={recipe?.name || 'Recipe'}
        right={
          canEditMasterData && (
            <TouchableOpacity style={styles.snapBtn} onPress={() => setSnapModal(true)}>
              <Ionicons name="camera-outline" size={16} color={Colors.primary} />
              <Text style={styles.snapBtnText}>Snapshot</Text>
            </TouchableOpacity>
          )
        }
      />

      <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
      <Banner type="success" message={success} />

      {versions.length === 0
        ? (
          <EmptyState
            icon="📋"
            title="No versions yet"
            subtitle="Save a snapshot to start tracking changes"
            action={canEditMasterData ? () => setSnapModal(true) : null}
            actionLabel="Save First Snapshot"
          />
        ) : (
          <FlatList
            data={versions}
            keyExtractor={v => String(v.id || v.versionNumber)}
            contentContainerStyle={{ padding: Spacing.lg }}
            renderItem={({ item, index }) => (
              <View style={[styles.vCard, Shadow.sm, index === 0 && styles.vCardLatest]}>
                <View style={styles.vHeader}>
                  <View style={styles.vBadge}>
                    <Text style={styles.vBadgeText}>v{item.versionNumber}</Text>
                  </View>
                  {index === 0 && (
                    <View style={styles.latestBadge}>
                      <Text style={styles.latestText}>Latest</Text>
                    </View>
                  )}
                  <Text style={styles.vDate}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </Text>
                </View>

                {item.summary && (
                  <Text style={styles.vSummary}>{item.summary}</Text>
                )}

                <View style={styles.vMeta}>
                  {item.servings    && <Text style={styles.vMetaItem}>👥 {item.servings} servings</Text>}
                  {item.costPerServing && <Text style={styles.vMetaItem}>₹{Number(item.costPerServing).toFixed(2)}/serving</Text>}
                  {item.createdBy   && <Text style={styles.vMetaItem}>👤 {item.createdBy}</Text>}
                </View>

                {canEditMasterData && index !== 0 && (
                  <TouchableOpacity style={styles.restoreBtn} onPress={() => handleRestore(item)}>
                    <Ionicons name="refresh-outline" size={14} color={Colors.primary} />
                    <Text style={styles.restoreText}>Restore this version</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )
      }

      {/* Snapshot Modal */}
      <Modal visible={snapModal} transparent animationType="slide" onRequestClose={() => setSnapModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Version Snapshot</Text>
              <TouchableOpacity onPress={() => setSnapModal(false)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Describe what changed in this version</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Reduced salt, added turmeric..."
              value={summary}
              onChangeText={setSummary}
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textMuted}
            />
            <PrimaryButton label="Save Snapshot" onPress={handleSnapshot} loading={saving} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  snapBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  snapBtnText:  { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
  vCard:        { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  vCardLatest:  { borderColor: Colors.primary, borderWidth: 1.5 },
  vHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  vBadge:       { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  vBadgeText:   { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },
  latestBadge:  { backgroundColor: Colors.successLight, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  latestText:   { fontSize: Typography.xs, fontWeight: '700', color: Colors.success },
  vDate:        { marginLeft: 'auto', fontSize: Typography.xs, color: Colors.textMuted },
  vSummary:     { fontSize: Typography.base, color: Colors.text, marginBottom: 10, lineHeight: 20 },
  vMeta:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vMetaItem:    { fontSize: Typography.xs, color: Colors.textMuted },
  restoreBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start', backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  restoreText:  { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: Colors.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 36 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle:   { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  modalSub:     { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
  modalInput:   { backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: Typography.base, color: Colors.text, marginBottom: Spacing.lg, minHeight: 80, textAlignVertical: 'top' },
});
