import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Edit2, Trash2, Search, RefreshCw,
  CheckCircle, XCircle, Shield, Store, X, Save,
  AlertTriangle, ChevronDown, UserCheck,
} from 'lucide-react';
import adminService from '../../../services/adminService';
import branchService from '../../../services/branchService';

const ROLES = [
  { value:'ROLE_ADMIN',   label:'Super Admin' },
  { value:'ROLE_MANAGER', label:'Branch Manager' },
  { value:'ROLE_STAFF',   label:'Kitchen Staff' },
  { value:'ROLE_USER',    label:'Inventory Clerk' },
];

const ROLE_CFG = {
  ROLE_ADMIN:   { bg:'rgba(0,97,210,.1)', color:'#3385e0', label:'Admin' },
  ROLE_MANAGER: { bg:'rgba(0,97,210,.12)', color:'#3385e0', label:'Manager' },
  ROLE_STAFF:   { bg:'rgba(16,185,129,.12)', color:'#34d399', label:'Staff' },
  ROLE_USER:    { bg:'#e2e6ef', color:'#6b7385', label:'Clerk' },
};

const emptyForm = () => ({
  username:'', email:'', password:'', fullName:'', role:'ROLE_USER', branchId:'',
});

const UserManagement = () => {
  const [users,    setUsers]    = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modal,    setModal]    = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(emptyForm());
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, bRes] = await Promise.all([
        adminService.getAllUsers(),
        branchService.getAll(),
      ]);
      setUsers(uRes.data || []);
      setBranches(bRes.data || []);
    } catch { setError('Failed to load users'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  const openCreate = () => { setEditId(null); setForm(emptyForm()); setModal(true); };
  const openEdit   = (u) => {
    setEditId(u.id);
    setForm({ username:u.username, email:u.email, password:'', fullName:u.fullName || '',
      role:u.role, branchId: u.branchId ? String(u.branchId) : '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.username.trim() || !form.email.trim()) { setError('Username and email required'); return; }
    if (!editId && !form.password.trim()) { setError('Password required for new users'); return; }
    setSaving(true); setError(null);
    try {
      if (editId) {
        const payload = {
          fullName: form.fullName, role: form.role,
          branchId: form.branchId ? Number(form.branchId) : null,
        };
        const { data } = await adminService.updateUser(editId, payload);
        setUsers(prev => prev.map(u => u.id === editId ? data : u));
        setSuccess('User updated');
      } else {
        const payload = {
          username: form.username, email: form.email, password: form.password,
          fullName: form.fullName, role: form.role,
          branchId: form.branchId ? Number(form.branchId) : null,
        };
        const { data } = await adminService.createUser(payload);
        setUsers(prev => [data, ...prev]);
        setSuccess('User created');
      }
      setModal(false);
    } catch (e) { setError(e.response?.data || 'Save failed'); }
    finally     { setSaving(false); }
  };

  const handleDisable = async () => {
    if (!deleteId) return;
    try {
      await adminService.disableUser(deleteId);
      setUsers(prev => prev.map(u => u.id === deleteId ? { ...u, enabled: false } : u));
      setSuccess('User disabled');
    } catch (e) { setError(e.response?.data || 'Failed'); }
    finally     { setDeleteId(null); }
  };

  const handleEnable = async (id) => {
    try {
      const { data } = await adminService.enableUser(id);
      setUsers(prev => prev.map(u => u.id === id ? data : u));
      setSuccess('User re-enabled');
    } catch (e) { setError(e.response?.data || 'Failed'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search
      || u.username.toLowerCase().includes(search.toLowerCase())
      || (u.email || '').toLowerCase().includes(search.toLowerCase())
      || (u.fullName || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const branchName = (id) => branches.find(b => b.id === id)?.name || '—';

  return (
    <div className="um-page">
      <style>{css}</style>

      <div className="um-header">
        <div className="um-title-wrap">
          <div className="um-icon"><Users size={18}/></div>
          <div>
            <h2 className="um-title">User Management</h2>
            <div className="um-sub">{users.length} users across all branches</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="um-btn-outline" onClick={load}><RefreshCw size={13} className={loading ? 'spin':''}/></button>
          <button className="um-btn-primary" onClick={openCreate}><Plus size={14}/> Add User</button>
        </div>
      </div>

      {error   && <div className="um-alert error"><AlertTriangle size={13}/>{error}<button onClick={() => setError(null)}><X size={12}/></button></div>}
      {success && <div className="um-alert success"><CheckCircle size={13}/>{success}</div>}

      {/* Toolbar */}
      <div className="um-toolbar">
        <div className="um-search">
          <Search size={13}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."/>
          {search && <button onClick={() => setSearch('')}><X size={12}/></button>}
        </div>
        <div className="um-role-filters">
          {['all', ...ROLES.map(r => r.value)].map(r => (
            <button key={r}
              className={`um-filter-btn ${roleFilter === r ? 'active' : ''}`}
              onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'All Roles' : ROLE_CFG[r]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="um-table-wrap">
        {loading ? (
          <div className="um-loading"><RefreshCw size={18} className="spin"/> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="um-empty"><Users size={36}/><p>No users found</p></div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th">User</th>
                <th className="um-th">Role</th>
                <th className="um-th">Branch</th>
                <th className="um-th">Status</th>
                <th className="um-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const rc = ROLE_CFG[user.role] || ROLE_CFG.ROLE_USER;
                return (
                  <tr key={user.id} className={`um-tr ${!user.enabled ? 'disabled' : ''}`}>
                    <td className="um-td">
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="um-avatar">{(user.username || 'U').charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="um-username">{user.username}</div>
                          <div className="um-email">{user.email}</div>
                          {user.fullName && <div className="um-fullname">{user.fullName}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="um-td">
                      <span className="um-role-badge" style={{ background:rc.bg, color:rc.color }}>
                        <Shield size={10}/> {rc.label}
                      </span>
                    </td>
                    <td className="um-td">
                      {user.branchId ? (
                        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'#4b5263' }}>
                          <Store size={12}/> {user.branchName || branchName(user.branchId)}
                        </div>
                      ) : <span style={{ color:'#c8cedb', fontSize:12 }}>No branch</span>}
                    </td>
                    <td className="um-td">
                      {user.enabled ? (
                        <span className="um-status ok"><CheckCircle size={11}/> Active</span>
                      ) : (
                        <span className="um-status bad"><XCircle size={11}/> Disabled</span>
                      )}
                    </td>
                    <td className="um-td">
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="um-act-btn" onClick={() => openEdit(user)} title="Edit"><Edit2 size={13}/></button>
                        {user.enabled ? (
                          <button className="um-act-btn danger" onClick={() => setDeleteId(user.id)} title="Disable">
                            <Trash2 size={13}/>
                          </button>
                        ) : (
                          <button className="um-act-btn enable" onClick={() => handleEnable(user.id)} title="Re-enable">
                            <UserCheck size={13}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="um-overlay" onClick={() => setModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>{editId ? 'Edit User' : 'Create User'}</h3>
              <button className="um-modal-close" onClick={() => setModal(false)}><X size={15}/></button>
            </div>
            <div className="um-modal-body">
              {error && <div className="um-alert error" style={{ marginBottom:12 }}><AlertTriangle size={13}/>{error}</div>}
              <div className="um-form-grid">
                {!editId && <>
                  <div className="um-field">
                    <label>Username *</label>
                    <input className="um-input" value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value }))}/>
                  </div>
                  <div className="um-field">
                    <label>Email *</label>
                    <input className="um-input" type="email" value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/>
                  </div>
                  <div className="um-field um-full">
                    <label>Password *</label>
                    <input className="um-input" type="password" value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}/>
                  </div>
                </>}
                <div className="um-field um-full">
                  <label>Full Name</label>
                  <input className="um-input" value={form.fullName}
                    onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}/>
                </div>
                <div className="um-field">
                  <label>Role</label>
                  <div className="um-sel-wrap">
                    <select className="um-select" value={form.role}
                      onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <ChevronDown size={12} className="um-sel-icon"/>
                  </div>
                </div>
                <div className="um-field">
                  <label>Branch</label>
                  <div className="um-sel-wrap">
                    <select className="um-select" value={form.branchId}
                      onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}>
                      <option value="">— No branch —</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="um-sel-icon"/>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="um-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={13} className="spin"/> : <Save size={13}/>}
                {editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable confirm */}
      {deleteId && (
        <div className="um-overlay" onClick={() => setDeleteId(null)}>
          <div className="um-confirm" onClick={e => e.stopPropagation()}>
            <Trash2 size={28} style={{ color:'#f87171', margin:'0 auto 12px', display:'block' }}/>
            <h3>Disable User?</h3>
            <p>This user won't be able to log in. You can re-enable them later.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:16 }}>
              <button className="um-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="um-btn-danger" onClick={handleDisable}>Disable</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const css = `
  .um-page { font-family:'DM Sans',sans-serif; color:#1f2937; }
  .um-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:10px; }
  .um-title-wrap { display:flex; align-items:center; gap:12px; }
  .um-icon  { width:38px; height:38px; background:rgba(0,97,210,.12); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#3385e0; }
  .um-title { font-size:20px; font-weight:700; color:#1f2937; margin:0 0 2px; }
  .um-sub   { font-size:12px; color:#9aa3b4; }
  .um-btn-primary { display:flex; align-items:center; gap:6px; padding:8px 14px; background:#e8f0fd; border:1px solid #b3ccf5; border-radius:9px; color:#0052b3; font-size:13px; font-weight:600; cursor:pointer; }
  .um-btn-primary:hover:not(:disabled) { background:#d4e4fb; }
  .um-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
  .um-btn-ghost   { display:flex; align-items:center; gap:6px; padding:8px 14px; background:#f0f2f7; border:1px solid #e2e6ef; border-radius:9px; color:#374151; font-size:13px; cursor:pointer; }
  .um-btn-outline { display:flex; align-items:center; gap:6px; padding:8px 10px; background:#ffffff; border:1px solid #e2e6ef; border-radius:9px; color:#9aa3b4; cursor:pointer; }
  .um-btn-danger  { padding:8px 18px; background:#ef4444; border:none; border-radius:9px; color:#0052b3; font-size:13px; font-weight:600; cursor:pointer; }
  .um-alert { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:14px; }
  .um-alert button { background:none; border:none; cursor:pointer; margin-left:auto; opacity:.6; }
  .um-alert.error   { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.25); color:#fca5a5; }
  .um-alert.success { background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.25); color:#6ee7b7; }
  .um-toolbar { display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; align-items:center; }
  .um-search { flex:1; min-width:200px; display:flex; align-items:center; gap:8px; background:#f8f9fc; border:1px solid #e2e6ef; border-radius:9px; padding:0 12px; }
  .um-search input { background:none; border:none; outline:none; color:#1f2937; font-size:13px; width:100%; padding:9px 0; }
  .um-search input::placeholder { color:#9aa3b4; }
  .um-search button { background:none; border:none; cursor:pointer; color:#9aa3b4; display:flex; }
  .um-role-filters { display:flex; gap:5px; flex-wrap:wrap; }
  .um-filter-btn { padding:6px 11px; background:#ffffff; border:1px solid #e2e6ef; border-radius:8px; color:#9aa3b4; font-size:12px; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .um-filter-btn:hover,.um-filter-btn.active { background:rgba(0,97,210,.15); border-color:rgba(0,97,210,.3); color:#3385e0; }
  .um-table-wrap { background:#ffffff; border:1px solid #e2e6ef; border-radius:14px; overflow:hidden; overflow-x:auto; }
  .um-table { width:100%; border-collapse:collapse; min-width:640px; }
  .um-th { padding:10px 14px; font-size:11px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:#9aa3b4; text-align:left; border-bottom:1px solid #e2e6ef; background:#fafbfc; white-space:nowrap; }
  .um-td { padding:12px 14px; font-size:13px; color:#9aa3b4; border-bottom:1px solid #f0f2f7; vertical-align:middle; }
  .um-tr:last-child .um-td { border-bottom:none; }
  .um-tr:hover .um-td { background:#fafbfc; }
  .um-tr.disabled .um-td { opacity:.5; }
  .um-avatar   { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,#0061d2,#3385e0); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; color:#0052b3; flex-shrink:0; }
  .um-username { font-weight:700; color:#1f2937; }
  .um-email    { font-size:11.5px; color:#9aa3b4; }
  .um-fullname { font-size:11.5px; color:#9aa3b4; }
  .um-role-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; padding:3px 8px; border-radius:5px; }
  .um-status { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; }
  .um-status.ok  { color:#34d399; }
  .um-status.bad { color:#f87171; }
  .um-act-btn { width:28px; height:28px; background:#f8f9fc; border:1px solid #e2e6ef; border-radius:7px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#374151; transition:all .15s; }
  .um-act-btn:hover { background:#e2e6ef; color:#1f2937; }
  .um-act-btn.danger:hover { background:rgba(239,68,68,.12); color:#f87171; border-color:rgba(239,68,68,.25); }
  .um-act-btn.enable:hover { background:rgba(16,185,129,.12); color:#34d399; border-color:rgba(16,185,129,.25); }
  .um-loading,.um-empty { text-align:center; padding:40px; color:#9aa3b4; display:flex; align-items:center; justify-content:center; gap:8px; flex-direction:column; }
  .um-overlay { position:fixed; inset:0; background:rgba(0,0,0,.65); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
  .um-modal { background:#ffffff; border:1px solid #e2e6ef; border-radius:16px; width:100%; max-width:480px; overflow:hidden; }
  .um-modal-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #e2e6ef; background:#f8fafc; }
  .um-modal-header h3 { margin:0; font-size:15px; font-weight:700; color:#1f2937; }
  .um-modal-close { background:#e8f0fd; border:1px solid #b3ccf5; border-radius:7px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#0052b3; }
  .um-modal-body   { padding:18px 20px; }
  .um-modal-footer { display:flex; gap:10px; justify-content:flex-end; padding:14px 20px; border-top:1px solid #e2e6ef; background:#f8fafc; }
  .um-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .um-field { display:flex; flex-direction:column; gap:5px; }
  .um-field.um-full { grid-column:1/-1; }
  .um-field label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.4px; color:#6b7280; }
  .um-input { background:#f0f2f7; border:1px solid #e2e6ef; border-radius:9px; padding:9px 12px; color:#1f2937; font-size:13px; outline:none; font-family:inherit; width:100%; box-sizing:border-box; }
  .um-input:focus { border-color:#0061d2; }
  .um-sel-wrap { position:relative; }
  .um-select { appearance:none; background:#f0f2f7; border:1px solid #e2e6ef; border-radius:9px; padding:8px 28px 8px 12px; color:#1f2937; font-size:13px; outline:none; cursor:pointer; width:100%; }
  .um-sel-icon { position:absolute; right:8px; top:50%; transform:translateY(-50%); color:#9aa3b4; pointer-events:none; }
  .um-confirm { background:#ffffff; border:1px solid #e2e6ef; border-radius:16px; padding:28px; text-align:center; max-width:360px; width:100%; }
  .um-confirm h3 { color:#1f2937; margin:0 0 8px; font-size:17px; }
  .um-confirm p  { color:#9aa3b4; font-size:13px; margin:0; }
  .spin { animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
`;

export default UserManagement;
