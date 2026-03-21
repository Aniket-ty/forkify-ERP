// app/(app)/admin/users.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService, branchService } from '../../../src/services';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, SearchBar, FormField, FormInput, PrimaryButton } from '../../../src/components/common';

const ROLES = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF', 'ROLE_USER'];
const ROLE_LABELS = { ROLE_ADMIN: 'Super Admin', ROLE_MANAGER: 'Branch Manager', ROLE_STAFF: 'Kitchen Staff', ROLE_USER: 'Inventory Clerk' };

export default function UserManagementScreen() {
  const router = useRouter();
  const [users, setUsers]         = useState([]);
  const [branches, setBranches]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', role: 'ROLE_STAFF', branchId: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, bRes] = await Promise.all([adminService.getAllUsers(), branchService.getAll()]);
      setUsers(uRes.data || []);
      setBranches(bRes.data || []);
    } catch { setError('Failed to load users'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const openCreate = () => { setEditUser(null); setForm({ fullName: '', username: '', email: '', password: '', role: 'ROLE_STAFF', branchId: '' }); setModalOpen(true); };
  const openEdit   = (u) => { setEditUser(u); setForm({ fullName: u.fullName || '', username: u.username || '', email: u.email || '', password: '', role: u.role || 'ROLE_STAFF', branchId: u.branchId || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.fullName || !form.username) { setError('Full name and username required'); return; }
    setSaving(true);
    try {
      if (editUser) {
        await adminService.updateUser(editUser.id, { fullName: form.fullName, email: form.email, role: form.role, branchId: form.branchId || null });
        setSuccess('User updated');
      } else {
        if (!form.password) { setError('Password required for new users'); setSaving(false); return; }
        await adminService.createUser({ ...form, branchId: form.branchId || null });
        setSuccess('User created');
      }
      setModalOpen(false);
      load();
    } catch (e) { setError(e.response?.data || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleToggleEnable = async (u) => {
    try {
      if (u.enabled) { await adminService.disableUser(u.id); setSuccess(`${u.username} disabled`); }
      else { await adminService.enableUser(u.id); setSuccess(`${u.username} enabled`); }
      load();
    } catch (e) { setError(e.response?.data || 'Failed'); }
  };

  const filtered = users.filter(u => !search ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = { ROLE_ADMIN: '#7c3aed', ROLE_MANAGER: Colors.primary, ROLE_STAFF: '#10b981', ROLE_USER: '#6b7280' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}><Text style={{ fontSize: 18 }}>←</Text></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={S.headerTitle}>👤 User Management</Text><Text style={S.headerSub}>{users.length} users</Text></View>
        <TouchableOpacity style={S.addBtn} onPress={openCreate}><Text style={S.addBtnText}>+ New User</Text></TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm }}>
        <Banner type="error" message={error} onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
      </View>

      {loading ? <View style={S.centered}><ActivityIndicator color={Colors.primary} /></View>
      : filtered.length === 0 ? <View style={S.centered}><Text style={{ fontSize: 48 }}>👤</Text><Text style={S.emptyT}>No users found</Text></View>
      : <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
          renderItem={({ item: u }) => (
            <View style={[S.card, Shadow.sm]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[S.avatar, { backgroundColor: (roleColor[u.role] || '#6b7280') + '22' }]}>
                  <Text style={[S.avatarText, { color: roleColor[u.role] || '#6b7280' }]}>{(u.fullName || u.username || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.userName}>{u.fullName}</Text>
                  <Text style={S.userUsername}>@{u.username}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <View style={[S.roleBadge, { backgroundColor: (roleColor[u.role] || '#6b7280') + '18' }]}>
                      <Text style={[S.roleBadgeText, { color: roleColor[u.role] || '#6b7280' }]}>{ROLE_LABELS[u.role] || u.role}</Text>
                    </View>
                    {u.branchName && <Text style={S.branchText}>📍 {u.branchName}</Text>}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Switch value={!!u.enabled} onValueChange={() => handleToggleEnable(u)} trackColor={{ true: Colors.success, false: '#d1d5db' }} />
                  <TouchableOpacity style={S.editBtn} onPress={() => openEdit(u)}>
                    <Text style={S.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )} />}

      {/* Create/Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}>
            <Text style={S.mTitle}>{editUser ? 'Edit User' : 'Create User'}</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}><Text style={S.mClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />
            <FormField label="Full Name *"><FormInput value={form.fullName} onChangeText={v => setForm(f => ({ ...f, fullName: v }))} placeholder="Full name" /></FormField>
            <FormField label="Username *"><FormInput value={form.username} onChangeText={v => setForm(f => ({ ...f, username: v }))} placeholder="Username" editable={!editUser} /></FormField>
            <FormField label="Email"><FormInput value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="Email address" keyboardType="email-address" /></FormField>
            {!editUser && <FormField label="Password *"><FormInput value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} placeholder="Min 6 characters" secureTextEntry /></FormField>}
            <FormField label="Role">
              <View style={{ gap: 6 }}>
                {ROLES.map(r => (
                  <TouchableOpacity key={r} onPress={() => setForm(f => ({ ...f, role: r }))}
                    style={[S.roleBtn, form.role === r && S.roleBtnActive]}>
                    <Text style={[S.roleBtnText, form.role === r && S.roleBtnTextActive]}>{ROLE_LABELS[r]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormField>
            <FormField label="Branch">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity onPress={() => setForm(f => ({ ...f, branchId: '' }))}
                  style={[S.branchChip, !form.branchId && S.branchChipActive]}>
                  <Text style={[S.branchChipText, !form.branchId && S.branchChipTextActive]}>HQ (No Branch)</Text>
                </TouchableOpacity>
                {branches.map(b => (
                  <TouchableOpacity key={b.id} onPress={() => setForm(f => ({ ...f, branchId: b.id }))}
                    style={[S.branchChip, String(form.branchId) === String(b.id) && S.branchChipActive]}>
                    <Text style={[S.branchChipText, String(form.branchId) === String(b.id) && S.branchChipTextActive]}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </FormField>
            <PrimaryButton label={editUser ? 'Update User' : 'Create User'} onPress={handleSave} loading={saving} style={{ marginTop: 8, marginBottom: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:       { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle:   { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub:     { fontSize: Typography.xs, color: Colors.textMuted },
  addBtn:        { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText:    { fontSize: Typography.sm, fontWeight: '600', color: Colors.primary },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyT:        { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  card:          { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  avatar:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: Typography.lg, fontWeight: '700' },
  userName:      { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  userUsername:  { fontSize: Typography.xs, color: Colors.textMuted },
  roleBadge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  roleBadgeText: { fontSize: Typography.xs, fontWeight: '700' },
  branchText:    { fontSize: Typography.xs, color: Colors.textMuted },
  editBtn:       { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  editBtnText:   { fontSize: Typography.xs, fontWeight: '600', color: Colors.primary },
  mHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:        { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  mClose:        { fontSize: Typography.xl, color: Colors.textMuted },
  roleBtn:       { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  roleBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  roleBtnText:   { fontSize: Typography.sm, color: Colors.textSecondary },
  roleBtnTextActive: { color: Colors.primary, fontWeight: '700' },
  branchChip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  branchChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  branchChipText: { fontSize: Typography.sm, color: Colors.textSecondary },
  branchChipTextActive: { color: Colors.primary, fontWeight: '600' },
});
