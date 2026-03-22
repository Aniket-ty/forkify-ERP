import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Plus, Edit2, Trash2, Search, RefreshCw,
  CheckCircle, XCircle, Globe, MapPin, Phone,
  AlertTriangle, X, Save, ChevronDown, Users,
} from 'lucide-react';
import branchService from '../../../services/branchService';
import adminService  from '../../../services/adminService';

const TYPE_CFG = {
  HQ:     { bg: 'rgba(0,97,210,.12)', color: '#3385e0', label: 'HQ' },
  BRANCH: { bg: 'rgba(0,97,210,.1)', color: '#3385e0', label: 'Branch' },
};

const emptyForm = () => ({
  name: '', city: '', address: '', phone: '', type: 'BRANCH',
});

const BranchManagement = () => {
  const [branches,  setBranches]  = useState([]);
  const [summary,   setSummary]   = useState([]);  // branch summary with user counts
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(emptyForm());
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);

  // ── Load branches + summary ────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [branchRes, summaryRes] = await Promise.all([
        branchService.getAll(),
        adminService.getBranchSummary(),
      ]);
      setBranches(branchRes.data || []);
      setSummary(summaryRes.data || []);
    } catch {
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // ── Open modals ────────────────────────────────────────────────────────────
  const openCreate = () => { setEditId(null); setForm(emptyForm()); setError(null); setModal(true); };
  const openEdit   = (b) => {
    setEditId(b.id);
    setForm({ name: b.name || '', city: b.city || '', address: b.address || '', phone: b.phone || '', type: b.type || 'BRANCH' });
    setError(null);
    setModal(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { setError('Branch name is required'); return; }
    if (!form.city.trim()) { setError('City is required'); return; }
    setSaving(true);
    setError(null);
    try {
      if (editId) {
        const { data } = await branchService.update(editId, form);
        setBranches(prev => prev.map(b => b.id === editId ? data : b));
        setSuccess('Branch updated successfully');
      } else {
        const { data } = await branchService.create(form);
        setBranches(prev => [...prev, data]);
        setSuccess('Branch created successfully');
      }
      setModal(false);
    } catch (e) {
      setError(e.response?.data || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Deactivate ─────────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!deleteId) return;
    try {
      await branchService.deactivate(deleteId);
      setBranches(prev => prev.filter(b => b.id !== deleteId));
      setSuccess('Branch deactivated');
    } catch (e) {
      setError(e.response?.data || 'Deactivation failed');
    } finally {
      setDeleteId(null);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filtered = branches.filter(b =>
    !search
    || b.name.toLowerCase().includes(search.toLowerCase())
    || (b.city || '').toLowerCase().includes(search.toLowerCase())
  );

  // Merge userCount from summary into branch list
  const getUserCount = (id) => {
    const s = summary.find(s => s.id === id);
    return s ? s.userCount : 0;
  };

  const hqCount     = branches.filter(b => b.type === 'HQ').length;
  const branchCount = branches.filter(b => b.type === 'BRANCH').length;

  return (
    <div className="bm-page">
      <style>{css}</style>

      {/* ── Header ── */}
      <div className="bm-header">
        <div className="bm-title-wrap">
          <div className="bm-icon"><Store size={18} /></div>
          <div>
            <h2 className="bm-title">Branch Management</h2>
            <div className="bm-sub">{branches.length} total — {hqCount} HQ, {branchCount} franchise branches</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="bm-btn-outline" onClick={load}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
          <button className="bm-btn-primary" onClick={openCreate}>
            <Plus size={14} /> New Branch
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error   && (
        <div className="bm-alert error">
          <AlertTriangle size={13} />{error}
          <button onClick={() => setError(null)}><X size={12} /></button>
        </div>
      )}
      {success && (
        <div className="bm-alert success">
          <CheckCircle size={13} />{success}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="bm-stats">
        <div className="bm-stat">
          <div className="bm-stat-val">{branches.length}</div>
          <div className="bm-stat-label">Total Branches</div>
        </div>
        <div className="bm-stat">
          <div className="bm-stat-val">{hqCount}</div>
          <div className="bm-stat-label">HQ Offices</div>
        </div>
        <div className="bm-stat">
          <div className="bm-stat-val">{branchCount}</div>
          <div className="bm-stat-label">Franchise Branches</div>
        </div>
        <div className="bm-stat">
          <div className="bm-stat-val">
            {summary.reduce((s, b) => s + (b.userCount || 0), 0)}
          </div>
          <div className="bm-stat-label">Total Users</div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="bm-toolbar">
        <div className="bm-search">
          <Search size={13} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or city..."
          />
          {search && <button onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="bm-loading"><RefreshCw size={18} className="spin" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bm-empty"><Store size={36} /><p>No branches found</p></div>
      ) : (
        <div className="bm-table-wrap">
          <table className="bm-table">
            <thead>
              <tr>
                <th className="bm-th">Branch</th>
                <th className="bm-th">City</th>
                <th className="bm-th">Type</th>
                <th className="bm-th">Phone</th>
                <th className="bm-th">Users</th>
                <th className="bm-th">Status</th>
                <th className="bm-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const tc = TYPE_CFG[b.type] || TYPE_CFG.BRANCH;
                return (
                  <tr key={b.id} className="bm-tr">
                    <td className="bm-td">
                      <div className="bm-branch-name">
                        {b.type === 'HQ' ? <Globe size={13} style={{ color: '#3385e0' }} /> : <Store size={13} style={{ color: '#3385e0' }} />}
                        {b.name}
                      </div>
                      {b.address && <div className="bm-address"><MapPin size={10} />{b.address}</div>}
                    </td>
                    <td className="bm-td bm-muted">{b.city}</td>
                    <td className="bm-td">
                      <span className="bm-badge" style={{ background: tc.bg, color: tc.color }}>
                        {tc.label}
                      </span>
                    </td>
                    <td className="bm-td bm-muted">
                      {b.phone ? <span className="bm-phone"><Phone size={11} />{b.phone}</span> : '—'}
                    </td>
                    <td className="bm-td">
                      <span className="bm-user-count">
                        <Users size={11} />{getUserCount(b.id)}
                      </span>
                    </td>
                    <td className="bm-td">
                      <span className={`bm-status ${b.active ? 'active' : 'inactive'}`}>
                        {b.active ? <><CheckCircle size={10} /> Active</> : <><XCircle size={10} /> Inactive</>}
                      </span>
                    </td>
                    <td className="bm-td">
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="bm-act-btn" onClick={() => openEdit(b)} title="Edit">
                          <Edit2 size={13} />
                        </button>
                        {b.type !== 'HQ' && b.active && (
                          <button className="bm-act-btn danger" onClick={() => setDeleteId(b.id)} title="Deactivate">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <div className="bm-overlay" onClick={() => setModal(false)}>
          <div className="bm-modal" onClick={e => e.stopPropagation()}>
            <div className="bm-modal-header">
              <h3>{editId ? 'Edit Branch' : 'Create New Branch'}</h3>
              <button className="bm-modal-close" onClick={() => setModal(false)}><X size={15} /></button>
            </div>
            <div className="bm-modal-body">
              {error && (
                <div className="bm-alert error" style={{ marginBottom: 12 }}>
                  <AlertTriangle size={13} />{error}
                </div>
              )}
              <div className="bm-form-grid">
                <div className="bm-field bm-full">
                  <label>Branch Name *</label>
                  <input
                    className="bm-input"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Mumbai Central"
                  />
                </div>
                <div className="bm-field">
                  <label>City *</label>
                  <input
                    className="bm-input"
                    value={form.city}
                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div className="bm-field">
                  <label>Type</label>
                  <div className="bm-sel-wrap">
                    <select
                      className="bm-select bm-input"
                      value={form.type}
                      onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    >
                      <option value="BRANCH">Franchise Branch</option>
                      <option value="HQ">Head Office</option>
                    </select>
                    <ChevronDown size={12} className="bm-sel-icon" />
                  </div>
                </div>
                <div className="bm-field">
                  <label>Phone</label>
                  <input
                    className="bm-input"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="bm-field bm-full">
                  <label>Address</label>
                  <input
                    className="bm-input"
                    value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>
            <div className="bm-modal-footer">
              <button className="bm-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="bm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                {editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate confirm ── */}
      {deleteId && (
        <div className="bm-overlay" onClick={() => setDeleteId(null)}>
          <div className="bm-confirm" onClick={e => e.stopPropagation()}>
            <Trash2 size={28} style={{ color: '#f87171', margin: '0 auto 12px', display: 'block' }} />
            <h3>Deactivate Branch?</h3>
            <p>
              This branch will be marked inactive. Existing data is preserved.
              Users assigned to this branch will still exist but won't be able to log in.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <button className="bm-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="bm-btn-danger" onClick={handleDeactivate}>Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const css = `
  .bm-page { font-family:'DM Sans',sans-serif; color:#1f2937; }

  .bm-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:10px; }
  .bm-title-wrap { display:flex; align-items:center; gap:12px; }
  .bm-icon  { width:38px; height:38px; background:rgba(0,97,210,.1); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#3385e0; }
  .bm-title { font-size:20px; font-weight:700; color:#1f2937; margin:0 0 2px; }
  .bm-sub   { font-size:12px; color:#9aa3b4; }

  .bm-btn-primary { display:flex; align-items:center; gap:6px; padding:8px 14px; background:#e8f0fd; border:1px solid #b3ccf5; border-radius:9px; color:#0052b3; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; }
  .bm-btn-primary:hover:not(:disabled) { background:#d4e4fb; }
  .bm-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
  .bm-btn-ghost  { display:flex; align-items:center; gap:6px; padding:8px 14px; background:#f8f9fc; border:1px solid #e2e6ef; border-radius:9px; color:#374151; font-size:13px; cursor:pointer; transition:background .15s; }
  .bm-btn-ghost:hover { background:#e8ebf2; color:#1f2937; }
  .bm-btn-outline { display:flex; align-items:center; gap:6px; padding:8px 10px; background:#ffffff; border:1px solid #e2e6ef; border-radius:9px; color:#9aa3b4; cursor:pointer; }
  .bm-btn-outline:hover { background:#e2e6ef; color:#0052b3; }
  .bm-btn-danger  { padding:8px 18px; background:#ef4444; border:none; border-radius:9px; color:#0052b3; font-size:13px; font-weight:600; cursor:pointer; }

  .bm-alert { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:14px; }
  .bm-alert button { background:none; border:none; cursor:pointer; margin-left:auto; opacity:.6; }
  .bm-alert.error   { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.25); color:#fca5a5; }
  .bm-alert.success { background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.25); color:#6ee7b7; }

  .bm-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
  @media(max-width:600px){ .bm-stats { grid-template-columns:1fr 1fr; } }
  .bm-stat { background:#ffffff; border:1px solid #e2e6ef; border-radius:12px; padding:14px 18px; }
  .bm-stat-val   { font-size:24px; font-weight:800; color:#1f2937; }
  .bm-stat-label { font-size:11px; color:#9aa3b4; margin-top:3px; text-transform:uppercase; letter-spacing:.4px; font-weight:600; }

  .bm-toolbar { display:flex; gap:10px; margin-bottom:14px; }
  .bm-search { flex:1; display:flex; align-items:center; gap:8px; background:#f8f9fc; border:1px solid #e2e6ef; border-radius:9px; padding:0 12px; }
  .bm-search input { background:none; border:none; outline:none; color:#1f2937; font-size:13px; width:100%; padding:9px 0; }
  .bm-search input::placeholder { color:#9aa3b4; }
  .bm-search button { background:none; border:none; cursor:pointer; color:#9aa3b4; display:flex; }

  .bm-table-wrap { background:#ffffff; border:1px solid #e2e6ef; border-radius:14px; overflow:hidden; overflow-x:auto; }
  .bm-table { width:100%; border-collapse:collapse; min-width:700px; }
  .bm-th    { padding:10px 16px; font-size:11px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:#9aa3b4; text-align:left; border-bottom:1px solid #e2e6ef; background:#fafbfc; white-space:nowrap; }
  .bm-td    { padding:12px 16px; font-size:13px; color:#9aa3b4; border-bottom:1px solid #f0f2f7; vertical-align:middle; }
  .bm-tr:last-child .bm-td { border-bottom:none; }
  .bm-tr:hover .bm-td { background:#fafbfc; }
  .bm-branch-name { display:flex; align-items:center; gap:7px; font-weight:700; color:#1f2937; }
  .bm-address     { display:flex; align-items:center; gap:4px; font-size:11px; color:#9aa3b4; margin-top:3px; }
  .bm-muted   { color:#9aa3b4; }
  .bm-phone   { display:flex; align-items:center; gap:5px; }
  .bm-badge   { font-size:11px; font-weight:700; padding:3px 8px; border-radius:5px; white-space:nowrap; }
  .bm-user-count { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#9aa3b4; }
  .bm-status  { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; padding:3px 8px; border-radius:5px; }
  .bm-status.active   { background:rgba(16,185,129,.12); color:#34d399; }
  .bm-status.inactive { background:rgba(239,68,68,.1); color:#f87171; }
  .bm-act-btn { width:28px; height:28px; background:#f8f9fc; border:1px solid #e2e6ef; border-radius:7px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#374151; transition:all .15s; }
  .bm-act-btn:hover { background:#e2e6ef; color:#1f2937; }
  .bm-act-btn.danger:hover { background:rgba(239,68,68,.12); color:#f87171; border-color:rgba(239,68,68,.25); }

  .bm-loading { text-align:center; padding:40px; color:#9aa3b4; display:flex; align-items:center; justify-content:center; gap:8px; }
  .bm-empty   { text-align:center; padding:40px; color:#9aa3b4; display:flex; flex-direction:column; align-items:center; gap:8px; }

  .bm-overlay { position:fixed; inset:0; background:rgba(0,0,0,.65); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
  .bm-modal   { background:#ffffff; border:1px solid #e2e6ef; border-radius:16px; width:100%; max-width:520px; max-height:90vh; overflow:hidden; display:flex; flex-direction:column; }
  .bm-modal-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #e2e6ef; background:#f8fafc; }
  .bm-modal-header h3 { margin:0; font-size:15px; font-weight:700; color:#1f2937; }
  .bm-modal-close { background:#e8f0fd; border:1px solid #b3ccf5; border-radius:7px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#0052b3; }
  .bm-modal-body   { padding:18px 20px; overflow-y:auto; flex:1; }
  .bm-modal-footer { display:flex; gap:10px; justify-content:flex-end; padding:14px 20px; border-top:1px solid #e2e6ef; background:#f8fafc; }
  .bm-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .bm-field { display:flex; flex-direction:column; gap:5px; }
  .bm-field.bm-full { grid-column:1/-1; }
  .bm-field label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.4px; color:#6b7280; }
  .bm-input  { background:#ffffff; border:1px solid #e2e6ef; border-radius:9px; padding:9px 12px; color:#1f2937; font-size:13px; outline:none; font-family:inherit; width:100%; box-sizing:border-box; }
  .bm-input:focus { border-color:#0061d2; }
  .bm-sel-wrap { position:relative; }
  .bm-select  { appearance:none; padding-right:28px !important; cursor:pointer; }
  .bm-sel-icon { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#9aa3b4; pointer-events:none; }
  .bm-confirm { background:#ffffff; border:1px solid #e2e6ef; border-radius:16px; padding:28px; text-align:center; max-width:400px; width:100%; }
  .bm-confirm h3 { color:#1f2937; margin:0 0 8px; font-size:17px; }
  .bm-confirm p  { color:#9aa3b4; font-size:13px; margin:0; line-height:1.6; }

  .spin { animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
`;

export default BranchManagement;