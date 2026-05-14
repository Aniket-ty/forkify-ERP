import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitBranch, RefreshCw, ArrowLeft, RotateCcw, Clock, IndianRupee, ChefHat, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { recipeVersionService } from '../../../services/newServices';
import recipeService from '../../../services/recipeService';

export default function RecipeVersionHistory() {
  const { id: recipeId } = useParams();
  const navigate = useNavigate();
  const [versions,  setVersions]  = useState([]);
  const [recipe,    setRecipe]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(null);
  const [selected,  setSelected]  = useState(null); // expanded version
  const [saving,    setSaving]    = useState(false);
  const [snapModal, setSnapModal] = useState(false);
  const [summary,   setSummary]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([
        recipeVersionService.getVersions(recipeId),
        recipeService.getById(recipeId),
      ]);
      setVersions(vRes.data || []);
      setRecipe(rRes.data);
    } catch { setError('Failed to load version history'); }
    finally { setLoading(false); }
  }, [recipeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t=setTimeout(()=>setSuccess(null),3000); return ()=>clearTimeout(t); } }, [success]);

  const handleSnapshot = async () => {
    setSaving(true);
    try {
      await recipeVersionService.saveSnapshot(recipeId, summary || `Version ${versions.length + 1}`);
      setSuccess('Version snapshot saved');
      setSnapModal(false); setSummary('');
      load();
    } catch (e) { setError(e.response?.data || 'Failed to save snapshot'); }
    finally { setSaving(false); }
  };

  const handleRestore = async (version) => {
    if (!window.confirm(`Restore recipe to Version ${version}? Current changes will be overwritten.`)) return;
    setSaving(true);
    try {
      await recipeVersionService.restore(recipeId, version);
      setSuccess(`Recipe restored to Version ${version}`);
      load();
    } catch (e) { setError(e.response?.data || 'Failed to restore'); }
    finally { setSaving(false); }
  };

  const parseSnap = (json) => { try { return JSON.parse(json); } catch { return null; } };

  return (
    <div className="rv-page">
      <div className="rv-header">
        <button className="rv-back" onClick={() => navigate(`/fooderp/recipes/${recipeId}`)}>
          <ArrowLeft size={15}/> Back
        </button>
        <div className="rv-title-wrap">
          <div className="rv-icon"><GitBranch size={18}/></div>
          <div>
            <h2 className="rv-title">Version History</h2>
            <p className="rv-sub">{recipe?.name || 'Recipe'} · {versions.length} snapshots</p>
          </div>
        </div>
        <button className="rv-btn-primary" onClick={()=>setSnapModal(true)}>
          <GitBranch size={14}/> Save Snapshot
        </button>
      </div>

      {error   && <div className="rv-banner error"><AlertTriangle size={14}/>{error}<button onClick={()=>setError(null)}>✕</button></div>}
      {success && <div className="rv-banner success"><CheckCircle size={14}/>{success}</div>}

      {loading ? (
        <div className="rv-loading"><RefreshCw size={22} className="rv-spin"/><p>Loading versions...</p></div>
      ) : versions.length === 0 ? (
        <div className="rv-empty">
          <GitBranch size={48}/>
          <h3>No versions saved yet</h3>
          <p>Save a snapshot to record the current state of this recipe</p>
          <button className="rv-btn-primary" onClick={()=>setSnapModal(true)}>
            <GitBranch size={14}/> Save First Snapshot
          </button>
        </div>
      ) : (
        <div className="rv-timeline">
          {versions.map((v, i) => {
            const snap = parseSnap(v.snapshotJson);
            const isLatest = i === 0;
            const isOpen = selected === v.id;
            return (
              <div key={v.id} className={`rv-item ${isLatest?'rv-item-latest':''}`}>
                <div className="rv-item-dot">{isLatest && <div className="rv-dot-pulse"/>}</div>
                <div className="rv-item-card">
                  <div className="rv-item-header" onClick={()=>setSelected(isOpen?null:v.id)}>
                    <div className="rv-item-left">
                      <span className="rv-version-badge">v{v.version}</span>
                      {isLatest && <span className="rv-latest-badge">Latest</span>}
                      <span className="rv-change-summary">{v.changeSummary}</span>
                    </div>
                    <div className="rv-item-right">
                      {v.costPerServing && (
                        <span className="rv-cost"><IndianRupee size={11}/>₹{Number(v.costPerServing).toFixed(2)}/serving</span>
                      )}
                      <span className="rv-time"><Clock size={11}/>{v.createdAt?.split('T')[0]}</span>
                      <span className="rv-author">{v.createdBy || 'System'}</span>
                    </div>
                  </div>

                  {isOpen && snap && (
                    <div className="rv-snap-detail">
                      <div className="rv-snap-grid">
                        <div><span className="rv-snap-label">Servings</span><span className="rv-snap-val">{snap.servings}</span></div>
                        <div><span className="rv-snap-label">Prep Time</span><span className="rv-snap-val">{snap.prepTime} min</span></div>
                        <div><span className="rv-snap-label">Cook Time</span><span className="rv-snap-val">{snap.cookTime} min</span></div>
                        <div><span className="rv-snap-label">Category</span><span className="rv-snap-val">{snap.category}</span></div>
                        {v.costPerServing && <div><span className="rv-snap-label">Cost/Serving</span><span className="rv-snap-val" style={{color:'#0061d2'}}>₹{Number(v.costPerServing).toFixed(2)}</span></div>}
                        {snap.allergens && <div><span className="rv-snap-label">Allergens</span><span className="rv-snap-val">{snap.allergens}</span></div>}
                      </div>

                      {snap.ingredients?.length > 0 && (
                        <div className="rv-ing-section">
                          <div className="rv-ing-title"><ChefHat size={13}/> Ingredients ({snap.ingredients.length})</div>
                          <div className="rv-ing-list">
                            {snap.ingredients.map((ing, j) => (
                              <div key={j} className="rv-ing-row">
                                <span className="rv-ing-name">{ing.ingredientName}</span>
                                <span className="rv-ing-qty">{ing.quantity} {ing.unit}</span>
                                <span className="rv-ing-cost">₹{Number(ing.costPerUnit||0).toFixed(2)}/{ing.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isLatest && (
                        <div className="rv-snap-actions">
                          <button className="rv-restore-btn" onClick={()=>handleRestore(v.version)} disabled={saving}>
                            <RotateCcw size={13}/> {saving?'Restoring...':'Restore this version'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Snapshot modal */}
      {snapModal && (
        <div className="rv-overlay" onClick={()=>setSnapModal(false)}>
          <div className="rv-modal" onClick={e=>e.stopPropagation()}>
            <div className="rv-modal-header">
              <h3>Save Snapshot</h3>
              <button className="rv-modal-close" onClick={()=>setSnapModal(false)}><X size={15}/></button>
            </div>
            <div className="rv-modal-body">
              <p style={{fontSize:13,color:'#6b7280',margin:'0 0 12px'}}>
                This will save the current state of the recipe as a new version that can be restored later.
              </p>
              <label className="rv-label">Change Summary (optional)</label>
              <input className="rv-input" placeholder="e.g. Reduced chicken from 200g to 180g"
                value={summary} onChange={e=>setSummary(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleSnapshot()}/>
            </div>
            <div className="rv-modal-footer">
              <button className="rv-btn-ghost" onClick={()=>setSnapModal(false)}>Cancel</button>
              <button className="rv-btn-primary" onClick={handleSnapshot} disabled={saving}>
                {saving?<RefreshCw size={13} className="rv-spin"/>:<GitBranch size={13}/>}
                Save Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rv-page{max-width:760px;font-family:'DM Sans',sans-serif;}
        .rv-header{display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;}
        .rv-back{display:flex;align-items:center;gap:6px;padding:7px 12px;background:#f0f2f7;border:1px solid #e2e6ef;border-radius:8px;font-size:13px;cursor:pointer;color:#374151;}
        .rv-title-wrap{display:flex;align-items:center;gap:10px;flex:1;}
        .rv-icon{width:36px;height:36px;background:#f0fdf4;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#15803d;}
        .rv-title{font-size:18px;font-weight:700;color:#1f2937;margin:0 0 2px;}
        .rv-sub{font-size:12px;color:#9ca3af;margin:0;}
        .rv-btn-primary{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#e8f0fd;border:1px solid #b3ccf5;color:#0052b3;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;}
        .rv-btn-ghost{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#f0f2f7;border:1px solid #e2e6ef;border-radius:9px;font-size:13px;color:#374151;cursor:pointer;}
        .rv-banner{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;font-size:13px;margin-bottom:12px;}
        .rv-banner button{margin-left:auto;background:none;border:none;cursor:pointer;font-size:15px;}
        .rv-banner.error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;}
        .rv-banner.success{background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;}
        .rv-loading,.rv-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:48px;color:#9ca3af;text-align:center;}
        .rv-empty h3{font-size:16px;color:#374151;font-weight:600;margin:0;}
        .rv-empty p{font-size:13px;margin:0;}
        .rv-timeline{display:flex;flex-direction:column;gap:0;position:relative;}
        .rv-timeline::before{content:'';position:absolute;left:15px;top:24px;bottom:24px;width:2px;background:#e5e7eb;}
        .rv-item{display:flex;gap:14px;position:relative;padding-bottom:16px;}
        .rv-item-dot{width:32px;flex-shrink:0;display:flex;justify-content:center;padding-top:16px;position:relative;z-index:1;}
        .rv-item-dot::before{content:'';width:12px;height:12px;border-radius:50%;background:#e5e7eb;border:2px solid #fff;box-shadow:0 0 0 2px #e5e7eb;display:block;}
        .rv-item-latest .rv-item-dot::before{background:#15803d;box-shadow:0 0 0 2px #bbf7d0;}
        .rv-dot-pulse{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:20px;height:20px;border-radius:50%;background:rgba(21,128,61,.15);animation:rv-pulse 2s ease infinite;}
        @keyframes rv-pulse{0%,100%{transform:translateX(-50%) scale(1);opacity:.6}50%{transform:translateX(-50%) scale(1.4);opacity:0}}
        .rv-item-card{flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-top:8px;}
        .rv-item-latest .rv-item-card{border-color:#bbf7d0;}
        .rv-item-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;cursor:pointer;gap:12px;flex-wrap:wrap;}
        .rv-item-header:hover{background:#fafafa;}
        .rv-item-left{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .rv-version-badge{font-size:11px;font-weight:700;padding:3px 8px;background:#f1f5f9;color:#374151;border-radius:20px;}
        .rv-latest-badge{font-size:10px;font-weight:700;padding:2px 7px;background:#f0fdf4;color:#15803d;border-radius:20px;text-transform:uppercase;letter-spacing:.4px;}
        .rv-change-summary{font-size:13px;color:#1f2937;font-weight:500;}
        .rv-item-right{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
        .rv-cost{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#0061d2;}
        .rv-time,.rv-author{display:flex;align-items:center;gap:4px;font-size:11px;color:#9ca3af;}
        .rv-snap-detail{padding:16px;border-top:1px solid #f1f5f9;background:#fafafa;}
        .rv-snap-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
        .rv-snap-label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:3px;}
        .rv-snap-val{font-size:13px;font-weight:600;color:#1f2937;}
        .rv-ing-section{margin-bottom:12px;}
        .rv-ing-title{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;}
        .rv-ing-list{display:flex;flex-direction:column;gap:4px;}
        .rv-ing-row{display:flex;align-items:center;gap:10px;padding:6px 10px;background:#fff;border-radius:7px;font-size:12px;}
        .rv-ing-name{flex:1;font-weight:500;color:#1f2937;}
        .rv-ing-qty{color:#374151;font-weight:600;}
        .rv-ing-cost{color:#9ca3af;font-size:11px;}
        .rv-snap-actions{display:flex;justify-content:flex-end;margin-top:12px;}
        .rv-restore-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#374151;transition:all .15s;}
        .rv-restore-btn:hover{border-color:#0061d2;color:#0061d2;}
        .rv-restore-btn:disabled{opacity:.4;cursor:not-allowed;}
        .rv-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
        .rv-modal{background:#fff;border-radius:14px;width:100%;max-width:440px;overflow:hidden;}
        .rv-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e5e7eb;}
        .rv-modal-header h3{margin:0;font-size:15px;font-weight:700;color:#1f2937;}
        .rv-modal-close{background:#e8f0fd;border:1px solid #b3ccf5;border-radius:7px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#0052b3;color:#6b7280;}
        .rv-modal-body{padding:18px 20px;}
        .rv-modal-footer{display:flex;gap:10px;justify-content:flex-end;padding:14px 20px;border-top:1px solid #e5e7eb;}
        .rv-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:6px;}
        .rv-input{width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;outline:none;font-family:inherit;box-sizing:border-box;}
        .rv-input:focus{border-color:#0061d2;}
        .rv-spin{animation:rv-spin .8s linear infinite;}
        @keyframes rv-spin{to{transform:rotate(360deg);}}
      `}</style>
    </div>
  );
}