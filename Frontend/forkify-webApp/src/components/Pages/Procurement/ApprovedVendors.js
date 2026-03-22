import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Star, Phone, Mail, RefreshCw, Search,
  CheckCircle, Truck, AlertTriangle, X, Package,
  TrendingUp, ChevronDown,
} from 'lucide-react';
import procurementService from '../../../services/procurementService';
import usePermission       from '../../../hooks/usePermission';

const CATEGORY_COLORS = {
  Produce:   { bg: 'rgba(16,185,129,.12)',  color: '#34d399' },
  Dairy:     { bg: 'rgba(59,130,246,.12)',   color: '#60a5fa' },
  Meat:      { bg: 'rgba(239,68,68,.12)',    color: '#f87171' },
  Seafood:   { bg: 'rgba(6,182,212,.12)',    color: '#22d3ee' },
  Grains:    { bg: 'rgba(251,191,36,.12)',   color: '#fbbf24' },
  Spices:    { bg: 'rgba(245,158,11,.12)',   color: '#f59e0b' },
  Oils:      { bg: 'rgba(0,97,210,.1)',   color: '#3385e0' },
  Beverages: { bg: 'rgba(0,97,210,.12)',   color: '#3385e0' },
  Other:     { bg: '#e2e6ef',  color: 'rgba(255,255,255,.45)' },
};

const ApprovedVendors = () => {
  const { isHQ } = usePermission();

  const [vendors,   setVendors]   = useState([]);
  const [all,       setAll]       = useState([]);   // all suppliers (for approve modal)
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(null);
  const [approving, setApproving] = useState(null); // id being approved

  // ── Load approved vendors ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [approvedRes, allRes] = await Promise.all([
        procurementService.getApprovedVendors(),
        isHQ ? procurementService.getSuppliers(null) : Promise.resolve({ data: [] }),
      ]);
      setVendors(approvedRes.data || []);
      setAll(allRes.data || []);
    } catch {
      setError('Failed to load approved vendors');
    } finally {
      setLoading(false);
    }
  }, [isHQ]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3500);
      return () => clearTimeout(t);
    }
  }, [success]);

  // ── Approve a vendor ───────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await procurementService.approveVendor(id);
      setSuccess('Vendor approved — now visible to all branches');
      load();
    } catch (e) {
      setError(e.response?.data || 'Approval failed');
    } finally {
      setApproving(null);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filtered = vendors.filter(v => {
    const matchSearch = !search
      || v.name.toLowerCase().includes(search.toLowerCase())
      || (v.contactPerson || '').toLowerCase().includes(search.toLowerCase())
      || (v.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || v.category === catFilter;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(vendors.map(v => v.category).filter(Boolean))];

  // Suppliers not yet approved (for the "pending" section shown to HQ)
  const unapproved = all.filter(s => !s.hqApproved && s.status === 'ACTIVE');

  const catStyle = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;

  return (
    <div className="av-page">
      <style>{css}</style>

      {/* ── Header ── */}
      <div className="av-header">
        <div className="av-title-wrap">
          <div className="av-icon"><Shield size={18} /></div>
          <div>
            <h2 className="av-title">Approved Vendors</h2>
            <div className="av-sub">
              {vendors.length} HQ-approved supplier{vendors.length !== 1 ? 's' : ''} — visible to all branches
            </div>
          </div>
        </div>
        <button className="av-btn-outline" onClick={load}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* ── Alerts ── */}
      {error   && (
        <div className="av-alert error">
          <AlertTriangle size={13} />{error}
          <button onClick={() => setError(null)}><X size={12} /></button>
        </div>
      )}
      {success && (
        <div className="av-alert success">
          <CheckCircle size={13} />{success}
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="av-stats">
        <div className="av-stat">
          <div className="av-stat-val">{vendors.length}</div>
          <div className="av-stat-label">Approved Vendors</div>
        </div>
        <div className="av-stat">
          <div className="av-stat-val">{categories.length}</div>
          <div className="av-stat-label">Categories</div>
        </div>
        <div className="av-stat">
          <div className="av-stat-val">
            {vendors.length > 0
              ? (vendors.reduce((s, v) => s + Number(v.rating || 0), 0) / vendors.length).toFixed(1)
              : '—'}
          </div>
          <div className="av-stat-label">Avg Rating</div>
        </div>
        {isHQ && (
          <div className="av-stat warning">
            <div className="av-stat-val">{unapproved.length}</div>
            <div className="av-stat-label">Pending Approval</div>
          </div>
        )}
      </div>

      {/* ── Pending Approval Section (HQ only) ── */}
      {isHQ && unapproved.length > 0 && (
        <div className="av-pending-section">
          <div className="av-section-title">
            <AlertTriangle size={14} style={{ color: '#fbbf24' }} />
            Suppliers Pending HQ Approval ({unapproved.length})
          </div>
          <div className="av-pending-list">
            {unapproved.map(s => (
              <div key={s.id} className="av-pending-row">
                <div className="av-pending-info">
                  <div className="av-pending-name">{s.name}</div>
                  <div className="av-pending-meta">
                    {s.category && <span className="av-chip" style={catStyle(s.category)}>{s.category}</span>}
                    {s.branchName && <span className="av-pending-branch">{s.branchName}</span>}
                  </div>
                </div>
                <button
                  className="av-approve-btn"
                  onClick={() => handleApprove(s.id)}
                  disabled={approving === s.id}
                >
                  {approving === s.id
                    ? <RefreshCw size={12} className="spin" />
                    : <CheckCircle size={12} />}
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search + Filter ── */}
      <div className="av-toolbar">
        <div className="av-search">
          <Search size={13} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors..."
          />
          {search && <button onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
        {categories.length > 1 && (
          <div className="av-sel-wrap">
            <select className="av-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="av-sel-icon" />
          </div>
        )}
      </div>

      {/* ── Vendor Grid ── */}
      {loading ? (
        <div className="av-loading"><RefreshCw size={20} className="spin" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="av-empty">
          <Shield size={44} />
          <p>{vendors.length === 0 ? 'No HQ-approved vendors yet.' : 'No vendors match your search.'}</p>
          {isHQ && vendors.length === 0 && (
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Go to Suppliers and click the ✓ approve button on any supplier to add them here.
            </p>
          )}
        </div>
      ) : (
        <div className="av-grid">
          {filtered.map(v => {
            const cs = catStyle(v.category);
            return (
              <div key={v.id} className="av-card">
                {/* Card header */}
                <div className="av-card-header">
                  <div className="av-card-icon"><Truck size={16} /></div>
                  <div className="av-card-meta">
                    <div className="av-card-name">{v.name}</div>
                    <div className="av-card-chips">
                      {v.category && (
                        <span className="av-chip" style={{ background: cs.bg, color: cs.color }}>
                          {v.category}
                        </span>
                      )}
                      <span className="av-chip hq">
                        <Shield size={9} /> HQ Approved
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="av-card-body">
                  {v.contactPerson && (
                    <div className="av-info-row"><Package size={11} /><span>{v.contactPerson}</span></div>
                  )}
                  {v.phone && (
                    <div className="av-info-row"><Phone size={11} /><span>{v.phone}</span></div>
                  )}
                  {v.email && (
                    <div className="av-info-row"><Mail size={11} /><span>{v.email}</span></div>
                  )}
                  {v.paymentTerms && (
                    <div className="av-info-row">
                      <TrendingUp size={11} />
                      <span>Payment: {v.paymentTerms}</span>
                    </div>
                  )}
                </div>

                {/* Footer stats */}
                <div className="av-card-footer">
                  <div className="av-stat-cell">
                    <div className="av-stat-cell-val">{v.totalOrders || 0}</div>
                    <div className="av-stat-cell-label">Orders</div>
                  </div>
                  <div className="av-stat-cell">
                    <div className="av-stat-cell-val" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Star size={11} style={{ color: '#fbbf24' }} />
                      {Number(v.rating || 0).toFixed(1)}
                    </div>
                    <div className="av-stat-cell-label">Rating</div>
                  </div>
                  <div className="av-stat-cell">
                    <div className="av-stat-cell-val" style={{ color: '#34d399' }}>
                      <CheckCircle size={13} />
                    </div>
                    <div className="av-stat-cell-label">Active</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const css = `
  .av-page { font-family:'DM Sans',sans-serif; color:#1f2937; }

  .av-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:10px; }
  .av-title-wrap { display:flex; align-items:center; gap:12px; }
  .av-icon  { width:38px; height:38px; background:rgba(0,97,210,.12); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#3385e0; }
  .av-title { font-size:20px; font-weight:700; color:#1f2937; margin:0 0 2px; }
  .av-sub   { font-size:12px; color:#9aa3b4; }

  .av-btn-outline { display:flex; align-items:center; gap:6px; padding:8px 10px; background:#ffffff; border:1px solid #e2e6ef; border-radius:9px; color:#9aa3b4; cursor:pointer; transition:all .15s; }
  .av-btn-outline:hover { background:#e2e6ef; color:#0052b3; }

  .av-alert { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:14px; }
  .av-alert button { background:none; border:none; cursor:pointer; margin-left:auto; opacity:.6; }
  .av-alert.error   { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.25); color:#fca5a5; }
  .av-alert.success { background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.25); color:#6ee7b7; }

  .av-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
  @media(max-width:600px){ .av-stats { grid-template-columns:1fr 1fr; } }
  .av-stat { background:#ffffff; border:1px solid #e2e6ef; border-radius:12px; padding:14px 18px; }
  .av-stat.warning { border-color:rgba(251,191,36,.2); background:rgba(251,191,36,.05); }
  .av-stat-val   { font-size:24px; font-weight:800; color:#1f2937; }
  .av-stat-label { font-size:11px; color:#9aa3b4; margin-top:3px; text-transform:uppercase; letter-spacing:.4px; font-weight:600; }

  .av-pending-section { background:rgba(251,191,36,.06); border:1px solid rgba(251,191,36,.2); border-radius:14px; padding:14px 16px; margin-bottom:18px; }
  .av-section-title { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:#fbbf24; margin-bottom:12px; }
  .av-pending-list { display:flex; flex-direction:column; gap:8px; }
  .av-pending-row { display:flex; align-items:center; justify-content:space-between; background:#ffffff; border-radius:10px; padding:10px 14px; gap:10px; flex-wrap:wrap; }
  .av-pending-info { display:flex; flex-direction:column; gap:4px; }
  .av-pending-name { font-size:14px; font-weight:700; color:#1f2937; }
  .av-pending-meta { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .av-pending-branch { font-size:11px; color:#9aa3b4; }
  .av-approve-btn { display:flex; align-items:center; gap:5px; padding:7px 14px; background:rgba(16,185,129,.15); border:1px solid rgba(16,185,129,.3); border-radius:8px; color:#34d399; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .av-approve-btn:hover:not(:disabled) { background:rgba(16,185,129,.25); }
  .av-approve-btn:disabled { opacity:.4; cursor:not-allowed; }

  .av-toolbar { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; align-items:center; }
  .av-search { flex:1; min-width:200px; display:flex; align-items:center; gap:8px; background:#f8f9fc; border:1px solid #e2e6ef; border-radius:9px; padding:0 12px; }
  .av-search input { background:none; border:none; outline:none; color:#1f2937; font-size:13px; width:100%; padding:9px 0; }
  .av-search input::placeholder { color:#9aa3b4; }
  .av-search button { background:none; border:none; cursor:pointer; color:#9aa3b4; display:flex; }
  .av-sel-wrap { position:relative; }
  .av-select { appearance:none; background:#f0f2f7; border:1px solid #e2e6ef; border-radius:9px; padding:8px 28px 8px 12px; color:#1f2937; font-size:13px; outline:none; cursor:pointer; }
  .av-sel-icon { position:absolute; right:8px; top:50%; transform:translateY(-50%); color:#9aa3b4; pointer-events:none; }

  .av-loading { text-align:center; padding:40px; color:#9aa3b4; display:flex; align-items:center; justify-content:center; gap:8px; }
  .av-empty   { text-align:center; padding:50px 20px; color:#9aa3b4; }
  .av-empty p { margin:10px 0 0; font-size:13px; }

  .av-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
  .av-card { background:#ffffff; border:1px solid #e2e6ef; border-radius:14px; overflow:hidden; transition:border-color .15s; }
  .av-card:hover { border-color:#9aa3b4; }
  .av-card-header { display:flex; align-items:flex-start; gap:10px; padding:14px 14px 10px; }
  .av-card-icon { width:34px; height:34px; background:rgba(0,97,210,.12); border-radius:9px; display:flex; align-items:center; justify-content:center; color:#3385e0; flex-shrink:0; }
  .av-card-meta { flex:1; min-width:0; }
  .av-card-name { font-size:14px; font-weight:700; color:#1f2937; margin-bottom:5px; }
  .av-card-chips { display:flex; gap:5px; flex-wrap:wrap; }
  .av-chip { font-size:10px; font-weight:600; padding:2px 7px; border-radius:4px; display:inline-flex; align-items:center; gap:3px; }
  .av-chip.hq { background:rgba(0,97,210,.15); color:#3385e0; }
  .av-card-body { padding:0 14px 10px; display:flex; flex-direction:column; gap:5px; }
  .av-info-row { display:flex; align-items:center; gap:6px; font-size:12px; color:#9aa3b4; }
  .av-card-footer { display:flex; border-top:1px solid #f0f2f7; }
  .av-stat-cell { flex:1; padding:10px; text-align:center; border-right:1px solid #f0f2f7; }
  .av-stat-cell:last-child { border-right:none; }
  .av-stat-cell-val   { font-size:14px; font-weight:700; color:#1f2937; display:flex; align-items:center; justify-content:center; }
  .av-stat-cell-label { font-size:10px; color:#9aa3b4; margin-top:2px; }

  .spin { animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
`;

export default ApprovedVendors;