// app/(app)/admin/audit.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService } from '../../../src/services';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, ScreenHeader} from '../../../src/components/common';
import { Ionicons } from '@expo/vector-icons';

const ACTION_COLORS = {
  CREATE: { bg: Colors.successLight, color: '#15803d' },
  UPDATE: { bg: Colors.primaryLight, color: Colors.primary },
  DELETE: { bg: Colors.dangerLight,  color: Colors.danger },
  LOGIN:  { bg: Colors.warningLight, color: '#a16207' },
  LOGOUT: { bg: '#f1f5f9',           color: '#64748b' },
};

export default function AuditLogsScreen() {
  const router = useRouter();
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(0);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const { data } = await adminService.getAuditLogs({ page: p, size: 50 });
      if (p === 0) setLogs(data?.content || data || []);
      else setLogs(prev => [...prev, ...(data?.content || data || [])]);
      setPage(p);
    } catch { setError('Failed to load audit logs'); }
    finally  { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(0); }, [load]);

  const filtered = logs.filter(l => !search ||
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.entityType || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.performedBy || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScreenHeader
          title="📝 Audit Logs"
          subtitle={`${logs.length} entries`}
        />

      <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search by action, entity, user..." />
      </View>

      {loading && logs.length === 0 ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : filtered.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>📝</Text><Text style={S.emptyT}>No audit logs</Text></View>
      : <FlatList data={filtered} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(0); }} />}
          renderItem={({ item: log }) => {
            const ac = ACTION_COLORS[log.action] || ACTION_COLORS.UPDATE;
            return (
              <View style={[S.card, Shadow.sm]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={[S.actionBadge, { backgroundColor: ac.bg }]}>
                    <Text style={[S.actionText, { color: ac.color }]}>{log.action}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.entity}>{log.entityType}{log.entityId ? ` #${log.entityId}` : ''}</Text>
                    {log.description && <Text style={S.desc}>{log.description}</Text>}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <Text style={S.meta}>👤 {log.performedBy || 'System'}</Text>
                      <Text style={S.meta}>📍 {log.branchName || 'HQ'}</Text>
                    </View>
                  </View>
                  <Text style={S.time}>{log.createdAt ? new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                </View>
                <Text style={S.date}>{log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-IN') : ''}</Text>
              </View>
            );
          }} />}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:    { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle:{ fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub:  { fontSize: Typography.xs, color: Colors.textMuted },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:     { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  card:       { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  actionBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  actionText: { fontSize: Typography.xs, fontWeight: '700' },
  entity:     { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  desc:       { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  meta:       { fontSize: Typography.xs, color: Colors.textMuted },
  time:       { fontSize: Typography.xs, color: Colors.textMuted },
  date:       { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },
});
