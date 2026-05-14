import React, { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, TrendingUp, TrendingDown, RefreshCw,
  Search, Download, AlertTriangle, Filter, X,
} from 'lucide-react';
import recipeService from '../../../services/recipeService';

const CostReport = () => {
  const [recipes,  setRecipes]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('all');
  const [categories,setCategories]=useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recipeService.getAll({ status: 'ACTIVE' });
      setRecipes(data || []);
      const cats = [...new Set((data||[]).map(r=>r.category))].sort();
      setCategories(cats);
    } catch { setError('Failed to load recipe cost data'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = recipes.filter(r => {
    const ms = !search || r.name.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'all' || r.category === catFilter;
    return ms && mc;
  });

  // For cost report we assume selling price isn't stored in recipe — show cost breakdown only
  const totalCost    = filtered.reduce((s, r) => s + parseFloat(r.costPerServing || 0), 0);
  const avgCost      = filtered.length > 0 ? (totalCost / filtered.length) : 0;
  const highestCost  = filtered.reduce((max, r) => parseFloat(r.costPerServing||0) > parseFloat(max.costPerServing||0) ? r : max, filtered[0]);
  const lowestCost   = filtered.reduce((min, r) => parseFloat(r.costPerServing||0) < parseFloat(min.costPerServing||0) ? r : min, filtered[0]);

  const exportCsv = () => {
    const rows = [
      ['Recipe','Category','Servings','Total Cost','Cost Per Serving','Calories','Ingredients'],
      ...filtered.map(r => [r.name, r.category, r.servings, r.costPerServing ? (parseFloat(r.costPerServing)*r.servings).toFixed(2) : 0, parseFloat(r.costPerServing||0).toFixed(2), r.calories||0, parseTags(r.tags).join(';')]),
    ];
    const csv  = rows.map(row => row.map(v=>`"${v??''}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href  = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `cost-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="cr-page">
      <div className="cr-header">
        <div>
          <h2 className="cr-title"><IndianRupee size={20}/> Cost Report</h2>
          <p className="cr-sub">Recipe ingredient cost breakdown and analysis</p>
        </div>
        <div className="cr-header-right">
          <button className="cr-btn" onClick={load} disabled={loading}><RefreshCw size={13} className={loading?'cr-spin':''}/></button>
          <button className="cr-btn" onClick={exportCsv}><Download size={13}/> Export</button>
        </div>
      </div>

      {error && <div className="cr-error"><AlertTriangle size={14}/>{error}</div>}

      <div className="cr-kpis">
        {[
          { label:'Active Recipes',   val: filtered.length,                 color:'#3b82f6' },
          { label:'Avg Cost/Serving', val: `₹${avgCost.toFixed(2)}`,        color:'#0061d2' },
          { label:'Most Expensive',   val: highestCost?.name || '—',        color:'#ef4444', sub: highestCost ? `₹${parseFloat(highestCost.costPerServing||0).toFixed(2)}/serving` : '' },
          { label:'Least Expensive',  val: lowestCost?.name  || '—',        color:'#10b981', sub: lowestCost  ? `₹${parseFloat(lowestCost.costPerServing||0).toFixed(2)}/serving`  : '' },
        ].map((k,i)=>(
          <div key={i} className="cr-kpi" style={{borderTop:`3px solid ${k.color}`}}>
            <div className="cr-kpi-val" style={{color:k.color}}>{k.val}</div>
            {k.sub && <div className="cr-kpi-sub">{k.sub}</div>}
            <div className="cr-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="cr-filters">
        <div className="cr-search">
          <Search size={13}/><input placeholder="Search recipe..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button onClick={()=>setSearch('')}><X size={11}/></button>}
        </div>
        <div className="cr-cat">
          <Filter size={13}/>
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="cr-loading"><RefreshCw size={22} className="cr-spin"/><p>Loading...</p></div>
      ) : (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr><th>Recipe</th><th>Category</th><th>Servings</th><th>Ingredients</th><th>Total Cost</th><th>Cost / Serving</th><th>Calories/Srv</th><th>Tags</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="cr-empty-row">No recipes found</td></tr>
              ) : filtered.sort((a,b)=>parseFloat(b.costPerServing||0)-parseFloat(a.costPerServing||0)).map(r => {
                const costPerServing = parseFloat(r.costPerServing || 0);
                const totalCostR = costPerServing * (r.servings || 1);
                const costLevel  = costPerServing > avgCost * 1.5 ? 'high' : costPerServing < avgCost * 0.5 ? 'low' : 'med';
                return (
                  <tr key={r.id} className="cr-row">
                    <td>
                      <div className="cr-recipe-name">{r.name}</div>
                      {r.hqOwned && <span className="cr-hq-badge">HQ</span>}
                    </td>
                    <td><span className="cr-cat-chip">{r.category}</span></td>
                    <td>{r.servings}</td>
                    <td className="cr-muted">{r.branchName}</td>
                    <td className="cr-cost">₹{totalCostR.toFixed(2)}</td>
                    <td>
                      <span className={`cr-per-serving ${costLevel}`}>
                        {costLevel === 'high' ? <TrendingUp size={11}/> : costLevel === 'low' ? <TrendingDown size={11}/> : null}
                        ₹{costPerServing.toFixed(2)}
                      </span>
                    </td>
                    <td className="cr-muted">{r.calories || 0} kcal</td>
                    <td>
                      <div className="cr-tags">
                        {parseTags(r.tags).slice(0,2).map((t,i)=><span key={i} className="cr-tag">{t}</span>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="cr-footer">{filtered.length} recipes · Avg cost/serving: <strong>₹{avgCost.toFixed(2)}</strong></div>
        </div>
      )}

      <style>{`
        .cr-page { max-width:1100px; }
        .cr-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px; }
        .cr-title { display:flex;align-items:center;gap:7px;font-size:18px;font-weight:700;color:#1f2937;margin:0 0 3px; }
        .cr-sub { font-size:12px;color:#9ca3af;margin:0; }
        .cr-header-right { display:flex;gap:8px; }
        .cr-btn { display:flex;align-items:center;gap:5px;padding:7px 12px;background:#f0f2f7;border:1px solid #e2e6ef;border-radius:8px;font-size:12px;color:#374151;cursor:pointer;white-space:nowrap; }
        .cr-error { display:flex;align-items:center;gap:8px;padding:9px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:13px;margin-bottom:12px; }
        .cr-kpis { display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px; }
        @media(max-width:700px){.cr-kpis{grid-template-columns:repeat(2,1fr);}}
        .cr-kpi { background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:14px;text-align:center; }
        .cr-kpi-val { font-size:18px;font-weight:800;margin-bottom:2px; }
        .cr-kpi-sub { font-size:11px;color:#6b7280;margin-bottom:2px; }
        .cr-kpi-lbl { font-size:11px;color:#9ca3af; }
        .cr-filters { display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap; }
        .cr-search { display:flex;align-items:center;gap:7px;padding:8px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;flex:1;min-width:180px; }
        .cr-search:focus-within { border-color:#0061d2; }
        .cr-search input { border:none;outline:none;font-size:13px;flex:1;background:transparent;color:#1f2937; }
        .cr-search button { background:none;border:none;cursor:pointer;color:#9ca3af; }
        .cr-cat { display:flex;align-items:center;gap:7px;padding:8px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;color:#6b7280; }
        .cr-cat select { border:none;outline:none;font-size:13px;color:#1f2937;background:transparent;cursor:pointer; }
        .cr-table-wrap { background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden; }
        .cr-table { width:100%;border-collapse:collapse; }
        .cr-table thead tr { background:#f8fafc;border-bottom:1px solid #e5e7eb; }
        .cr-table th { padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px; }
        .cr-row { border-bottom:1px solid #f1f5f9; }
        .cr-row:last-child { border-bottom:none; }
        .cr-row:hover { background:#fafafa; }
        .cr-table td { padding:11px 14px;font-size:13px;vertical-align:middle; }
        .cr-recipe-name { font-size:13px;font-weight:600;color:#1f2937; }
        .cr-hq-badge { font-size:9px;font-weight:700;padding:1px 5px;background:rgba(0,97,210,.1);color:#0061d2;border-radius:4px;margin-left:5px; }
        .cr-cat-chip { font-size:11px;font-weight:600;padding:2px 7px;background:#f0fdf4;color:#15803d;border-radius:20px; }
        .cr-cost { font-weight:600;color:#1f2937; }
        .cr-per-serving { display:inline-flex;align-items:center;gap:3px;font-size:13px;font-weight:700; }
        .cr-per-serving.high { color:#ef4444; }
        .cr-per-serving.med  { color:#0061d2; }
        .cr-per-serving.low  { color:#10b981; }
        .cr-tags { display:flex;gap:3px;flex-wrap:wrap; }
        .cr-tag { font-size:10px;padding:2px 6px;background:#f1f5f9;color:#64748b;border-radius:4px; }
        .cr-muted { font-size:12px;color:#9ca3af; }
        .cr-footer { padding:10px 14px;font-size:12px;color:#9ca3af;border-top:1px solid #f1f5f9; }
        .cr-footer strong { color:#1f2937; }
        .cr-empty-row { text-align:center;padding:30px;color:#9ca3af;font-size:13px; }
        .cr-loading { display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#9ca3af;background:#fff;border-radius:12px;border:1px solid #e5e7eb; }
        .cr-spin { animation:cr-spin .8s linear infinite; }
        @keyframes cr-spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

// Normalise tags: backend sends a comma-separated string, frontend expects array
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return String(tags).split(',').map(t => t.trim()).filter(Boolean);
};


export default CostReport;