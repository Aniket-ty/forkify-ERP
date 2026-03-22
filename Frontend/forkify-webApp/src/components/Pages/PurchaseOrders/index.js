import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Eye, Edit2, Trash2, Search,
  Filter, Truck, Calendar, DollarSign, CheckCircle,
  Clock, XCircle, RefreshCw, AlertTriangle, X,
  Package, ChevronDown, Save, ArrowLeft,
} from 'lucide-react';
import procurementService from '../../../services/procurementService';
import useBranch          from '../../../hooks/useBranch';
import usePermission      from '../../../hooks/usePermission';
import { useNavigate }    from 'react-router-dom';

const STATUS_CFG = {
  DRAFT:     { label:'Draft',     bg:'#f1f5f9', color:'#475569', icon: FileText },
  SENT:      { label:'Sent',      bg:'#eff6ff', color:'#1d4ed8', icon: Truck    },
  PARTIAL:   { label:'Partial',   bg:'#fefce8', color:'#a16207', icon: Clock    },
  RECEIVED:  { label:'Received',  bg:'#f0fdf4', color:'#15803d', icon: CheckCircle },
  CANCELLED: { label:'Cancelled', bg:'#fee2e2', color:'#b91c1c', icon: XCircle  },
};

const PurchaseOrders = () => {
  const navigate          = useNavigate();
  const { branchId }      = useBranch();
  const { canApprove }    = usePermission();
  const [pos,       setPos]       = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(null);
  const [search,    setSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId]    = useState(null);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const { data } = await procurementService.getPOs(branchId, statusFilter !== 'all' ? statusFilter : null);
      setPos(data || []);
    } catch { setError('Failed to load purchase orders'); }
    finally  { setLoading(false); }
  }, [branchId, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await procurementService.updatePOStatus(id, newStatus);
      setSuccess(`PO status updated to ${newStatus}`);
      load();
    } catch (e) { setError(e.response?.data || 'Failed to update status'); }
  };

  const filtered = pos.filter(p =>
    !search ||
    (p.poNumber||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.supplierName||'').toLowerCase().includes(search.toLowerCase())
  );

  const totalValue    = filtered.reduce((s, p) => s + parseFloat(p.totalAmount || 0), 0);
  const pendingCount  = pos.filter(p => p.status === 'SENT' || p.status === 'PARTIAL').length;
  const receivedCount = pos.filter(p => p.status === 'RECEIVED').length;

  return (
    <div className="po-page">

      <div className="po-header">
        <div className="po-header-left">
          <button className="po-back-btn" onClick={() => navigate('/fooderp/procurement/indent')}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h2 className="po-title"><FileText size={20}/> Purchase Orders</h2>
            <p className="po-sub">Track supplier orders and delivery status</p>
          </div>
        </div>
        <div className="po-header-right">
          <button className="po-btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'po-spin' : ''} />
          </button>
          <button className="po-btn-primary" onClick={() => navigate('/fooderp/procurement/indent')}>
            <Plus size={14} /> Raise Indent
          </button>
        </div>
      </div>

      {error   && <div className="po-banner error"><AlertTriangle size={14}/>{error}<button onClick={()=>setError(null)}>✕</button></div>}
      {success && <div className="po-banner success"><CheckCircle size={14}/>{success}<button onClick={()=>setSuccess(null)}>✕</button></div>}

      {/* KPIs */}
      <div className="po-kpis">
        {[
          { label:'Total Orders',    val: pos.length,          color:'#3b82f6' },
          { label:'Pending/Partial', val: pendingCount,         color:'#f59e0b', urgent: pendingCount > 0 },
          { label:'Received',        val: receivedCount,        color:'#10b981' },
          { label:'Total Value',     val: `₹${totalValue.toLocaleString('en-IN',{maximumFractionDigits:0})}`, color:'#0061d2' },
        ].map((k,i)=>(
          <div key={i} className={`po-kpi ${k.urgent ? 'urgent' : ''}`} style={{'--c':k.color}}>
            <div className="po-kpi-val" style={{color:k.color}}>{k.val}</div>
            <div className="po-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="po-filters">
        <div className="po-search">
          <Search size={13}/><input placeholder="Search PO number or supplier..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button onClick={()=>setSearch('')}><X size={11}/></button>}
        </div>
        <div className="po-status-tabs">
          {['all','DRAFT','SENT','PARTIAL','RECEIVED','CANCELLED'].map(s=>(
            <button key={s} className={`po-tab ${statusFilter===s?'active':''}`} onClick={()=>setStatusFilter(s)}>
              {s==='all' ? 'All' : STATUS_CFG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="po-loading"><RefreshCw size={22} className="po-spin"/><p>Loading...</p></div>
      ) : filtered.length === 0 ? (
        <div className="po-empty">
          <FileText size={44}/>
          <h3>No purchase orders</h3>
          <p>Raise a material indent and convert it to a PO to get started</p>
        </div>
      ) : (
        <div className="po-table-wrap">
          <table className="po-table">
            <thead>
              <tr><th>PO Number</th><th>Supplier</th><th>Date</th><th>Expected</th><th>Items</th><th>Total</th><th>Status</th>{canApprove && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {filtered.map(po => {
                const sc = STATUS_CFG[po.status] || STATUS_CFG.DRAFT;
                const isExp = expandedId === po.id;
                return (
                  <React.Fragment key={po.id}>
                    <tr className={`po-row ${po.status==='CANCELLED'?'cancelled':''}`}>
                      <td>
                        <button className="po-expand-btn" onClick={() => setExpandedId(isExp ? null : po.id)}>
                          <ChevronDown size={13} style={{transform:isExp?'rotate(180deg)':'none',transition:'transform .2s'}}/>
                        </button>
                        <strong className="po-num">{po.poNumber}</strong>
                      </td>
                      <td><div className="po-supplier"><Truck size={12}/>{po.supplierName}</div></td>
                      <td className="po-muted"><Calendar size={11}/> {po.orderDate}</td>
                      <td className="po-muted">{po.expectedDate || '—'}</td>
                      <td>{po.itemCount || (po.items||[]).length} items</td>
                      <td><span className="po-amount">₹{Number(po.totalAmount||0).toLocaleString('en-IN',{maximumFractionDigits:0})}</span></td>
                      <td><span className="po-status" style={{background:sc.bg,color:sc.color}}><sc.icon size={11}/>{sc.label}</span></td>
                      {canApprove && (
                        <td>
                          <div className="po-actions">
                            {po.status === 'DRAFT' && (
                              <button className="po-action-btn sent" onClick={()=>handleStatusUpdate(po.id,'SENT')} title="Mark as Sent">
                                <Truck size={12}/>
                              </button>
                            )}
                            {(po.status === 'SENT' || po.status === 'PARTIAL') && (
                              <button className="po-action-btn received" onClick={()=>handleStatusUpdate(po.id,'RECEIVED')} title="Mark Received">
                                <CheckCircle size={12}/>
                              </button>
                            )}
                            {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                              <button className="po-action-btn cancel" onClick={()=>handleStatusUpdate(po.id,'CANCELLED')} title="Cancel">
                                <XCircle size={12}/>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExp && (po.items||[]).length > 0 && (
                      <tr className="po-detail-row">
                        <td colSpan={canApprove ? 8 : 7}>
                          <div className="po-detail-items">
                            {(po.items||[]).map((item,j)=>(
                              <div key={j} className="po-detail-item">
                                <Package size={12}/> <strong>{item.ingredientName}</strong>
                                <span>{item.quantity} {item.unit}</span>
                                <span>@ ₹{parseFloat(item.unitCost||0).toFixed(2)}</span>
                                <span className="po-item-total">= ₹{(item.quantity * item.unitCost).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <div className="po-footer">{filtered.length} orders · Total: <strong>₹{totalValue.toLocaleString('en-IN',{maximumFractionDigits:0})}</strong></div>
        </div>
      )}

      <style>{`
        .po-page { max-width:1100px; }
        .po-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px; }
        .po-header-left { display:flex;align-items:center;gap:10px; }
        .po-header-right { display:flex;gap:8px; }
        .po-back-btn { width:32px;height:32px;background:#f0f2f7;border:1px solid #e2e6ef;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#374151; }
        .po-title { display:flex;align-items:center;gap:7px;font-size:18px;font-weight:700;color:#1f2937;margin:0 0 2px; }
        .po-sub { font-size:12px;color:#9ca3af;margin:0; }
        .po-btn-primary { display:flex;align-items:center;gap:5px;padding:7px 14px;background:#e8f0fd;border:1px solid #b3ccf5;color:#0052b3;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer; }
        .po-btn-ghost { width:32px;height:32px;background:#f0f2f7;border:1px solid #e2e6ef;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b7280; }
        .po-banner { display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;font-size:13px;margin-bottom:12px; }
        .po-banner button { margin-left:auto;background:none;border:none;cursor:pointer;font-size:15px; }
        .po-banner.error   { background:#fef2f2;border:1px solid #fecaca;color:#dc2626; }
        .po-banner.success { background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d; }
        .po-kpis { display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px; }
        @media(max-width:700px){.po-kpis{grid-template-columns:repeat(2,1fr);}}
        .po-kpi { background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:14px;text-align:center;position:relative; }
        .po-kpi.urgent { border-color:var(--c); }
        .po-kpi-val { font-size:22px;font-weight:800;margin-bottom:4px; }
        .po-kpi-lbl { font-size:11px;color:#9ca3af; }
        .po-filters { display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center; }
        .po-search { display:flex;align-items:center;gap:7px;padding:8px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;flex:1;min-width:200px; }
        .po-search:focus-within { border-color:#0061d2; }
        .po-search input { border:none;outline:none;font-size:13px;flex:1;background:transparent;color:#1f2937; }
        .po-search button { background:none;border:none;cursor:pointer;color:#9ca3af; }
        .po-status-tabs { display:flex;gap:4px;flex-wrap:wrap; }
        .po-tab { padding:5px 11px;background:#f1f5f9;border:1px solid #e5e7eb;border-radius:20px;font-size:12px;font-weight:500;color:#64748b;cursor:pointer;transition:all .15s; }
        .po-tab.active { background:#e8f0fd;border-color:#0061d2;color:#0061d2;font-weight:600; }
        .po-table-wrap { background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden; }
        .po-table { width:100%;border-collapse:collapse; }
        .po-table thead tr { background:#f8fafc;border-bottom:1px solid #e5e7eb; }
        .po-table th { padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px; }
        .po-row { border-bottom:1px solid #f1f5f9; }
        .po-row:hover { background:#fafafa; }
        .po-row.cancelled { opacity:.5; }
        .po-table td { padding:11px 14px;font-size:13px;vertical-align:middle; }
        .po-expand-btn { background:none;border:none;cursor:pointer;color:#9ca3af;margin-right:4px;padding:0;display:inline-flex;align-items:center; }
        .po-num { font-size:12px;font-family:monospace;color:#1f2937; }
        .po-supplier { display:inline-flex;align-items:center;gap:5px;font-size:13px;color:#374151; }
        .po-muted { font-size:12px;color:#9ca3af;display:inline-flex;align-items:center;gap:4px; }
        .po-amount { font-size:13px;font-weight:700;color:#0061d2; }
        .po-status { display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px; }
        .po-actions { display:flex;gap:4px; }
        .po-action-btn { width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1px solid;border-radius:6px;cursor:pointer;transition:all .15s; }
        .po-action-btn.sent     { background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.2);color:#1d4ed8; }
        .po-action-btn.received { background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.2);color:#15803d; }
        .po-action-btn.cancel   { background:rgba(239,68,68,.06);border-color:rgba(239,68,68,.15);color:#ef4444; }
        .po-detail-row td { background:#f9fafb;padding:10px 18px; }
        .po-detail-items { display:flex;flex-direction:column;gap:6px; }
        .po-detail-item { display:flex;align-items:center;gap:8px;font-size:12px;color:#6b7280; }
        .po-detail-item strong { color:#374151; }
        .po-item-total { margin-left:auto;font-weight:700;color:#0061d2; }
        .po-footer { padding:10px 14px;font-size:12px;color:#9ca3af;border-top:1px solid #f1f5f9; }
        .po-footer strong { color:#1f2937; }
        .po-loading,.po-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:48px;color:#9ca3af;text-align:center;background:#fff;border-radius:12px;border:1px solid #e5e7eb; }
        .po-empty h3 { font-size:16px;font-weight:600;color:#374151;margin:0; }
        .po-empty p { font-size:13px;margin:0; }
        .po-spin { animation:po-spin .8s linear infinite; }
        @keyframes po-spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PurchaseOrders;