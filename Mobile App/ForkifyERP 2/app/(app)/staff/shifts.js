// app/(app)/staff/shifts.js — Shift Scheduler
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shiftService } from '../../../src/services';
import { useBranch, usePermission } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, FormField, FormInput, PrimaryButton } from '../../../src/components/common';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ShiftsScreen() {
  const router = useRouter();
  const { branchId } = useBranch();
  const { canApprove, user } = usePermission();
  const [shifts, setShifts]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState({ staffName: '', date: '', startTime: '09:00', endTime: '17:00', role: '', notes: '' });

  const getWeekDates = (offset) => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const weekDates = getWeekDates(weekOffset);
  const fromDate  = weekDates[0];
  const toDate    = weekDates[6];

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const { data } = canApprove
        ? await shiftService.getAll(branchId, fromDate, toDate)
        : await shiftService.getMy(fromDate, toDate);
      setShifts(data || []);
    } catch { setError('Failed to load shifts'); }
    finally  { setLoading(false); }
  }, [branchId, fromDate, toDate, canApprove]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const handleCreate = async () => {
    if (!form.date || !form.startTime) { setError('Date and start time required'); return; }
    setSaving(true);
    try {
      await shiftService.create({ ...form, branchId });
      setSuccess('Shift scheduled');
      setModalOpen(false);
      setForm({ staffName: '', date: '', startTime: '09:00', endTime: '17:00', role: '', notes: '' });
      load();
    } catch (e) { setError(e.response?.data || 'Failed to create shift'); }
    finally { setSaving(false); }
  };

  const handleClockIn  = async (id) => { try { await shiftService.clockIn(id); setSuccess('Clocked in'); load(); } catch (e) { setError(e.response?.data || 'Failed'); } };
  const handleClockOut = async (id) => { try { await shiftService.clockOut(id); setSuccess('Clocked out'); load(); } catch (e) { setError(e.response?.data || 'Failed'); } };

  const shiftsForDay = (date) => shifts.filter(s => s.date === date);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}><Text style={{ fontSize: 18 }}>←</Text></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={S.headerTitle}>📅 Shift Scheduler</Text><Text style={S.headerSub}>{fromDate} – {toDate}</Text></View>
        {canApprove && <TouchableOpacity style={S.addBtn} onPress={() => setModalOpen(true)}><Text style={S.addBtnText}>+ Shift</Text></TouchableOpacity>}
      </View>

      {/* Week nav */}
      <View style={S.weekNav}>
        <TouchableOpacity style={S.weekBtn} onPress={() => setWeekOffset(w => w - 1)}><Text style={S.weekBtnText}>◀ Prev</Text></TouchableOpacity>
        <Text style={S.weekLabel}>{weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`}</Text>
        <TouchableOpacity style={S.weekBtn} onPress={() => setWeekOffset(w => w + 1)}><Text style={S.weekBtnText}>Next ▶</Text></TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}>
          {weekDates.map((date, i) => {
            const dayShifts = shiftsForDay(date);
            return (
              <View key={date} style={S.dayBlock}>
                <View style={S.dayHeader}>
                  <Text style={S.dayName}>{DAYS[i]}</Text>
                  <Text style={S.dayDate}>{date.slice(5)}</Text>
                  <View style={[S.shiftCount, { backgroundColor: dayShifts.length > 0 ? Colors.primaryLight : Colors.bg }]}>
                    <Text style={[S.shiftCountText, { color: dayShifts.length > 0 ? Colors.primary : Colors.textMuted }]}>{dayShifts.length}</Text>
                  </View>
                </View>
                {dayShifts.length === 0
                  ? <Text style={S.noShift}>No shifts scheduled</Text>
                  : dayShifts.map(shift => (
                    <View key={shift.id} style={[S.shiftCard, Shadow.sm]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View>
                          <Text style={S.staffName}>{shift.staffName || shift.username}</Text>
                          <Text style={S.shiftTime}>⏰ {shift.startTime} – {shift.endTime}</Text>
                          {shift.role && <Text style={S.shiftRole}>{shift.role}</Text>}
                        </View>
                        <View style={{ gap: 4 }}>
                          {!shift.clockInTime && <TouchableOpacity style={S.clockBtn} onPress={() => handleClockIn(shift.id)}><Text style={S.clockBtnText}>Clock In</Text></TouchableOpacity>}
                          {shift.clockInTime && !shift.clockOutTime && <TouchableOpacity style={[S.clockBtn, S.clockOutBtn]} onPress={() => handleClockOut(shift.id)}><Text style={[S.clockBtnText, { color: '#c10000' }]}>Clock Out</Text></TouchableOpacity>}
                          {shift.clockOutTime && <Text style={S.completed}>✓ Done</Text>}
                        </View>
                      </View>
                      {(shift.clockInTime || shift.clockOutTime) && (
                        <Text style={S.clockMeta}>In: {shift.clockInTime || '—'}  Out: {shift.clockOutTime || '—'}</Text>
                      )}
                    </View>
                  ))}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Create Shift Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}><Text style={S.mTitle}>Schedule Shift</Text><TouchableOpacity onPress={() => setModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Staff Name *"><FormInput value={form.staffName} onChangeText={v => setForm(f => ({ ...f, staffName: v }))} placeholder="Staff member name" /></FormField>
            <FormField label="Date (YYYY-MM-DD) *"><FormInput value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="e.g. 2026-03-20" /></FormField>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><FormField label="Start Time"><FormInput value={form.startTime} onChangeText={v => setForm(f => ({ ...f, startTime: v }))} placeholder="09:00" /></FormField></View>
              <View style={{ flex: 1 }}><FormField label="End Time"><FormInput value={form.endTime} onChangeText={v => setForm(f => ({ ...f, endTime: v }))} placeholder="17:00" /></FormField></View>
            </View>
            <FormField label="Role / Position"><FormInput value={form.role} onChangeText={v => setForm(f => ({ ...f, role: v }))} placeholder="e.g. Chef, Server" /></FormField>
            <FormField label="Notes"><FormInput value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional" multiline /></FormField>
            <PrimaryButton label="Schedule Shift" onPress={handleCreate} loading={saving} style={{ marginTop: 8, marginBottom: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  weekNav:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  weekBtn:     { paddingHorizontal: 12, paddingVertical: 6 },
  weekBtnText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.primary },
  weekLabel:   { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  dayBlock:    { marginBottom: Spacing.md },
  dayHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingTop: Spacing.md },
  dayName:     { fontSize: Typography.base, fontWeight: '700', color: Colors.text, width: 36 },
  dayDate:     { fontSize: Typography.sm, color: Colors.textMuted },
  shiftCount:  { marginLeft: 'auto', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  shiftCountText: { fontSize: Typography.xs, fontWeight: '700' },
  noShift:     { fontSize: Typography.xs, color: Colors.textMuted, fontStyle: 'italic', paddingLeft: 4 },
  shiftCard:   { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  staffName:   { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  shiftTime:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  shiftRole:   { fontSize: Typography.xs, color: Colors.primary, marginTop: 2 },
  clockBtn:    { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.successLight, borderRadius: Radius.sm, borderWidth: 1, borderColor: '#bbf7d0' },
  clockOutBtn: { backgroundColor: Colors.dangerLight, borderColor: '#fecaca' },
  clockBtnText:{ fontSize: Typography.xs, fontWeight: '700', color: '#15803d' },
  completed:   { fontSize: Typography.xs, color: '#15803d', fontWeight: '700' },
  clockMeta:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },
  mHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:      { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  mClose:      { fontSize: Typography.xl, color: Colors.textMuted },
});
