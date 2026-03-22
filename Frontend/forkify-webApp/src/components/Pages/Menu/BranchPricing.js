import React, { useState, useEffect, useCallback } from 'react';
import { Tag, RefreshCw, AlertTriangle, CheckCircle, ChevronDown, Save, X } from 'lucide-react';
import menuService from '../../../services/menuService';
import useBranch   from '../../../hooks/useBranch';

const BranchPricing = () => {
  const { branchId, branchName } = useBranch();

  const [menus,   setMenus]   = useState([]);
  const [menuId,  setMenuId]  = useState('');
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(null);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);
  const [edits,   setEdits]   = useState({});

  // Load menus
  useEffect(() => {
    menuService.getAll(false)
      .then(({ data }) => { setMenus(data || []); if (data?.length) setMenuId(String(data[0].id)); })
      .catch(() => setError('Failed to load menus'));
  }, []);

  // Load pricing when menu or branch changes
  const loadPricing = useCallback(async () => {
    if (!menuId || !branchId) return;
    setLoading(true); setError(null); setEdits({});
    try {
      const { data } = await menuService.getBranchPricing(menuId, branchId);
      setPricing(data || []);
    } catch { setError('Failed to load pricing'); }
    finally { setLoading(false); }
  }, [menuId, branchId]);

  useEffect(() => { loadPricing(); }, [loadPricing]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const handleEdit = (itemId, field, val) => {
    setEdits(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), [field]: val } }));
  };

  const handleSave = async (item) => {
    const edit = edits[item.menuItemId] || {};
    const price = edit.customPrice !== undefined ? edit.customPrice : item.customPrice;
    const available = edit.available !== undefined ? edit.available : item.availableAtBranch;
    setSaving(item.menuItemId); setError(null);
    try {
      await menuService.saveBranchPrice(
        item.menuItemId, branchId,
        price !== '' && price != null ? Number(price) : null,
        available !== false,
      );
      setSuccess(`Price saved for ${item.displayName || item.recipeName}`);
      setEdits(prev => { const n = { ...prev }; delete n[item.menuItemId]; return n; });
      loadPricing();
    } catch (e) { setError(e.response?.data || 'Save failed'); }
    finally { setSaving(null); }
  };

  const activeMenu = menus.find(m => String(m.id) === menuId);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:'#0d1017' }}>
      <style>{`.bp-spin{animation:spin .8s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, color:'#fbbf24' }}>
          <Tag size={20}/>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:'#0d1017' }}>Branch Pricing</h2>
            <p style={{ margin:0, fontSize:12, color:'#9aa3b4' }}>Override menu prices for {branchName}</p>
          </div>
        </div>
        <button onClick={loadPricing} style={btnGhost}><RefreshCw size={13} className={loading?'bp-spin':''}/></button>
      </div>

      {error   && <div style={alertStyle('error')}><AlertTriangle size={13}/>{error}<button onClick={()=>setError(null)} style={{ background:'none',border:'none',cursor:'pointer',marginLeft:'auto',opacity:.6,color:'inherit' }}>✕</button></div>}
      {success && <div style={alertStyle('success')}><CheckCircle size={13}/>{success}</div>}

      {/* Menu selector */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <label style={{ fontSize:12, fontWeight:600, color:'#9aa3b4', textTransform:'uppercase', letterSpacing:.4, whiteSpace:'nowrap' }}>Menu</label>
        <div style={{ position:'relative', flex:1, maxWidth:340 }}>
          <select style={selectStyle} value={menuId} onChange={e => setMenuId(e.target.value)}>
            <option value="">— Select menu —</option>
            {menus.map(m => <option key={m.id} value={m.id}>{m.name} {m.active ? '(active)' : ''}</option>)}
          </select>
          <ChevronDown size={12} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#9aa3b4', pointerEvents:'none' }}/>
        </div>
      </div>

      {/* Info banner */}
      {activeMenu && (
        <div style={{ background:'rgba(251,191,36,.06)', border:'1px solid rgba(251,191,36,.2)', borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#4b5263' }}>
          <strong style={{ color:'#fbbf24' }}>{activeMenu.name}</strong> — Set custom prices for {branchName}. Leave blank to use the base price. Toggle availability to hide items from this branch.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'#9aa3b4', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><RefreshCw size={18} className="bp-spin"/> Loading...</div>
      ) : pricing.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#9aa3b4' }}>
          <Tag size={36} style={{ opacity:.3, marginBottom:12 }}/>
          <p>{menuId ? 'No items in this menu yet.' : 'Select a menu to manage pricing.'}</p>
        </div>
      ) : (
        <div style={{ background:'#ffffff', border:'1px solid #e2e6ef', borderRadius:14, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Item', 'Category', 'Base Price', 'Branch Price', 'Available', 'Action'].map(h => (
                <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700, letterSpacing:.5, textTransform:'uppercase', color:'#9aa3b4', textAlign:'left', borderBottom:'1px solid #e2e6ef', background:'rgba(255,255,255,.02)', whiteSpace:'nowrap' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {pricing.map(item => {
                const edit = edits[item.menuItemId] || {};
                const isDirty = Object.keys(edit).length > 0;
                const displayPrice = edit.customPrice !== undefined ? edit.customPrice : (item.customPrice ?? '');
                const isAvailable  = edit.available  !== undefined ? edit.available  : item.availableAtBranch;
                return (
                  <tr key={item.menuItemId} style={{ background: isDirty ? 'rgba(251,191,36,.03)' : 'transparent' }}>
                    <td style={td}><strong style={{ color:'#0d1017' }}>{item.displayName || item.recipeName}</strong></td>
                    <td style={td}>{item.menuCategory
                      ? <span style={{ fontSize:10.5, fontWeight:600, padding:'2px 7px', background:'#e2e6ef', borderRadius:4, color:'#6b7385' }}>{item.menuCategory}</span>
                      : <span style={{ color:'#c8cedb' }}>—</span>}
                    </td>
                    <td style={{ ...td, color:'#6b7385' }}>₹{Number(item.basePrice || 0).toFixed(2)}</td>
                    <td style={td}>
                      <input
                        type="number" min="0" step="0.01"
                        value={displayPrice}
                        onChange={e => handleEdit(item.menuItemId, 'customPrice', e.target.value)}
                        placeholder={`₹${Number(item.basePrice||0).toFixed(2)}`}
                        style={{ background:'#f0f2f7', border:`1px solid ${isDirty?'rgba(251,191,36,.4)':'#e2e6ef'}`, borderRadius:8, padding:'7px 10px', color:'#0d1017', fontSize:13, outline:'none', width:110 }}
                      />
                    </td>
                    <td style={td}>
                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                        <input
                          type="checkbox" checked={isAvailable}
                          onChange={e => handleEdit(item.menuItemId, 'available', e.target.checked)}
                          style={{ accentColor:'#0061d2', width:15, height:15 }}
                        />
                        <span style={{ fontSize:12, color: isAvailable ? '#34d399' : '#f87171' }}>{isAvailable ? 'Available' : 'Hidden'}</span>
                      </label>
                    </td>
                    <td style={td}>
                      {isDirty && (
                        <div style={{ display:'flex', gap:5 }}>
                          <button onClick={() => handleSave(item)} disabled={saving === item.menuItemId} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', background:'rgba(16,185,129,.15)', border:'1px solid rgba(16,185,129,.3)', borderRadius:7, color:'#34d399', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            {saving === item.menuItemId ? <RefreshCw size={11} className="bp-spin"/> : <Save size={11}/>} Save
                          </button>
                          <button onClick={() => setEdits(prev => { const n={...prev}; delete n[item.menuItemId]; return n; })} style={{ display:'flex', alignItems:'center', padding:6, background:'#f8f9fc', border:'1px solid #e2e6ef', borderRadius:7, color:'#6b7385', cursor:'pointer' }}>
                            <X size={11}/>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const btnGhost   = { display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:'#f8f9fc', border:'1px solid #e2e6ef', borderRadius:8, color:'#4b5263', fontSize:12, cursor:'pointer' };
const selectStyle= { appearance:'none', background:'#f0f2f7', border:'1px solid #e2e6ef', borderRadius:9, padding:'9px 28px 9px 12px', color:'#0d1017', fontSize:13, outline:'none', cursor:'pointer', width:'100%' };
const alertStyle = (t) => ({ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, fontSize:13, marginBottom:14, ...(t==='error' ? { background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#fca5a5' } : { background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', color:'#6ee7b7' }) });
const td         = { padding:'11px 14px', fontSize:13, color:'#2e3344', borderBottom:'1px solid #ffffff', verticalAlign:'middle' };

export default BranchPricing;
