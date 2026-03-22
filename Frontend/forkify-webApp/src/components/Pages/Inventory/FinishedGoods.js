import React, { useState, useEffect, useCallback } from 'react';
import {
  PackageCheck, Search, RefreshCw, AlertTriangle,
  ChefHat, Calendar, X, BarChart3, ArrowLeft,
  ShoppingCart, Trash2, Play,
} from 'lucide-react';
import productionService from '../../../services/productionService';
import useBranch         from '../../../hooks/useBranch';
import { useNavigate }   from 'react-router-dom';
import api               from '../../../services/api';

const FinishedGoods = () => {
  const navigate     = useNavigate();
  const { branchId } = useBranch();
  const [tab,        setTab]       = useState('stock');
  const [stock,      setStock]     = useState([]);
  const [logs,       setLogs]      = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState(null);
  const [search,     setSearch]    = useState('');
  const [dateFilter, setDateFilter]= useState('');

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [stockRes, logRes] = await Promise.all([
        api.get('/production/stock', { params: { branchId } }),
        productionService.getHistory(branchId, dateFilter || null, null),
      ]);
      setStock(stockRes.data || []);
      setLogs(logRes.data   || []);
    } catch { setError('Failed to load finished goods'); }
    finally  { setLoading(false); }
  }, [branchId, dateFilter]);

  useEffect(() => { load(); }, [load]);

  const filteredStock = stock.filter(s =>
    !search || (s.recipeName||'').toLowerCase().includes(search.toLowerCase()));
  const filteredLogs = logs.filter(l =>
    !search || (l.recipeName||'').toLowerCase().includes(search.toLowerCase()));

  const totalAvailable = filteredStock.reduce((s, f) => s + (f.availableServings||0), 0);
  const totalProduced  = filteredStock.reduce((s, f) => s + (f.totalProduced ||0), 0);
  const totalSold      = filteredStock.reduce((s, f) => s + (f.totalSold     ||0), 0);
  const totalWasted    = filteredStock.reduce((s, f) => s + (f.totalWasted   ||0), 0);

  return (
    <div className="fg-page">
      <div className="fg-header">
        <div className="fg-header-left">
          <button className="fg-back-btn" onClick={() => navigate('/fooderp/inventory')}>
            <ArrowLeft size={15}/>
          </button>
          <div>
            <h2 className="fg-title"><PackageCheck size={20}/> Finished Goods</h2>
            <p className="fg-sub">Live stock of prepared dishes — produced · sold · wasted</p>
          </div>
        </div>
        <div className="fg-header-right">
          <button className="fg-btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading?'fg-spin':''}/>
          </button>
          <button className="fg-btn-primary" onClick={() => navigate('/fooderp/recipes/list')}>
            <Play size={14}/> Log Production
          </button>
        </div>
      </div>

      {error && <div className="fg-error"><AlertTriangle size={14}/>{error}<button onClick={()=>setError(null)}>✕</button></div>}

      {/* KPIs */}
      <div className="fg-kpis">
        {[
          { label:'Available Now',  val:totalAvailable, color:'#10b981', icon:PackageCheck },
          { label:'Total Produced', val:totalProduced,  color:'#3b82f6', icon:ChefHat },
          { label:'Total Sold',     val:totalSold,      color:'#0061d2', icon:ShoppingCart },
          { label:'Total Wasted',   val:totalWasted,    color:'#ef4444', icon:Trash2 },
        ].map((k,i)=>(
          <div key={i} className="fg-kpi" style={{borderTop:`3px solid ${k.color}`}}>
            <div className="fg-kpi-icon" style={{background:k.color+'18',color:k.color}}><k.icon size={18}/></div>
            <div>
              <div className="fg-kpi-val" style={{color:k.color}}>{k.val}</div>
              <div className="fg-kpi-lbl">{k.label} servings</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="fg-tabs">
        <button className={`fg-tab ${tab==='stock'?'active':''}`} onClick={()=>setTab('stock')}>
          <PackageCheck size={14}/> Live Stock
          {totalAvailable > 0 && <span className="fg-badge">{totalAvailable}</span>}
        </button>
        <button className={`fg-tab ${tab==='history'?'active':''}`} onClick={()=>setTab('history')}>
          <BarChart3 size={14}/> Production History
        </button>
      </div>

      {/* Filters */}
      <div className="fg-filters">
        <div className="fg-search">
          <Search size={13}/>
          <input placeholder="Search recipe..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button onClick={()=>setSearch('')}><X size={11}/></button>}
        </div>
        {tab==='history' && (
          <div className="fg-date-wrap">
            <Calendar size={13}/>
            <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}/>
            {dateFilter && <button onClick={()=>setDateFilter('')}><X size={11}/></button>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="fg-loading"><RefreshCw size={22} className="fg-spin"/><p>Loading...</p></div>
      ) : tab === 'stock' ? (
        filteredStock.length === 0 ? (
          <div className="fg-empty">
            <PackageCheck size={44}/>
            <h3>No finished goods yet</h3>
            <p>Log production from a recipe to add items to the finished goods stock</p>
            <button className="fg-btn-primary" onClick={()=>navigate('/fooderp/recipes/list')}>
              <Play size={14}/> Start Producing
            </button>
          </div>
        ) : (
          <div className="fg-stock-grid">
            {filteredStock.map(item => {
              const produced = item.totalProduced || 1;
              const soldPct  = Math.round(((item.totalSold   ||0)/produced)*100);
              const wastePct = Math.round(((item.totalWasted ||0)/produced)*100);
              const availPct = Math.round(((item.availableServings||0)/produced)*100);
              const isEmpty  = item.availableServings === 0;
              return (
                <div key={item.id} className={`fg-stock-card ${isEmpty?'empty':''}`}>
                  <div className="fg-stock-header">
                    <div className="fg-stock-recipe">
                      <div className="fg-stock-icon"><ChefHat size={16}/></div>
                      <div>
                        <div className="fg-stock-name">{item.recipeName}</div>
                        <div className="fg-stock-cat">{item.recipeCategory}</div>
                      </div>
                    </div>
                    <div className={`fg-stock-avail ${isEmpty?'zero':''}`}>
                      {item.availableServings}
                      <span>servings</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="fg-progress-wrap">
                    <div className="fg-progress-track">
                      <div className="fg-prog-sold"   style={{width:`${soldPct}%`}}/>
                      <div className="fg-prog-wasted" style={{width:`${wastePct}%`}}/>
                      <div className="fg-prog-avail"  style={{width:`${availPct}%`}}/>
                    </div>
                    <span className="fg-progress-label">{availPct}% left</span>
                  </div>

                  <div className="fg-stock-stats">
                    {[
                      { label:'Produced', val:item.totalProduced||0,   cls:'blue'   },
                      { label:'Sold',     val:item.totalSold||0,       cls:'orange' },
                      { label:'Wasted',   val:item.totalWasted||0,     cls:'red'    },
                      { label:'Cost/srv', val:`₹${parseFloat(item.costPerServing||0).toFixed(0)}`, cls:'' },
                    ].map((s,j)=>(
                      <div key={j} className="fg-stock-stat">
                        <span className="fg-stat-lbl">{s.label}</span>
                        <span className={`fg-stat-val ${s.cls}`}>{s.val}</span>
                      </div>
                    ))}
                  </div>

                  {item.lastProducedDate && (
                    <div className="fg-stock-footer">
                      <Calendar size={10}/> Last produced {item.lastProducedDate}
                    </div>
                  )}

                  <div className="fg-stock-actions">
                    <button className="fg-act-btn produce"
                      onClick={()=>navigate(`/fooderp/recipes/${item.recipeId}/produce`)}>
                      <Play size={12}/> Produce More
                    </button>
                    <button className="fg-act-btn sell"
                      onClick={()=>navigate('/fooderp/sales')}>
                      <ShoppingCart size={12}/> Log Sale
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        filteredLogs.length === 0 ? (
          <div className="fg-empty">
            <BarChart3 size={44}/><h3>No production logs</h3>
            <p>Logs appear here after logging production from a recipe</p>
          </div>
        ) : (
          <div className="fg-table-wrap">
            <table className="fg-table">
              <thead>
                <tr><th>Date</th><th>Recipe</th><th>Servings</th><th>Ingredients Used</th><th>Total Cost</th><th>Cost/Serving</th><th>By</th></tr>
              </thead>
              <tbody>
                {filteredLogs.map((log,i)=>(
                  <tr key={log.id||i} className="fg-row">
                    <td><span className="fg-date-chip"><Calendar size={11}/>{log.productionDate}</span></td>
                    <td>
                      <div className="fg-recipe-name">{log.recipeName}</div>
                      <div className="fg-recipe-cat">{log.recipeCategory}</div>
                    </td>
                    <td><span className="fg-serv-chip">{log.servingsProduced} servings</span></td>
                    <td>
                      <div className="fg-deductions">
                        {(log.deductedIngredients||[]).slice(0,3).map((d,j)=>(
                          <span key={j} className="fg-deduct-chip">{d}</span>
                        ))}
                        {(log.deductedIngredients||[]).length>3 &&
                          <span className="fg-more">+{log.deductedIngredients.length-3}</span>}
                      </div>
                    </td>
                    <td><span className="fg-cost">₹{parseFloat(log.totalCost||0).toFixed(2)}</span></td>
                    <td><span className="fg-cost-per">₹{parseFloat(log.costPerServing||0).toFixed(2)}</span></td>
                    <td className="fg-muted">{log.loggedBy||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <style>{`
        .fg-page{max-width:1200px;font-family:'DM Sans',sans-serif;}
        .fg-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;}
        .fg-header-left{display:flex;align-items:center;gap:10px;}
        .fg-header-right{display:flex;gap:8px;}
        .fg-back-btn{width:32px;height:32px;background:#f0f2f7;border:1px solid #e2e6ef;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#374151;}
        .fg-title{display:flex;align-items:center;gap:7px;font-size:18px;font-weight:700;color:#1f2937;margin:0 0 2px;}
        .fg-sub{font-size:12px;color:#9ca3af;margin:0;}
        .fg-btn-primary{display:flex;align-items:center;gap:5px;padding:7px 14px;background:#e8f0fd;border:1px solid #b3ccf5;border:1px solid #b3ccf5;color:#0052b3;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;}
        .fg-btn-ghost{width:32px;height:32px;background:#f0f2f7;border:1px solid #e2e6ef;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;}
        .fg-error{display:flex;align-items:center;gap:8px;padding:9px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:13px;margin-bottom:12px;}
        .fg-error button{margin-left:auto;background:none;border:none;cursor:pointer;}
        .fg-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
        @media(max-width:700px){.fg-kpis{grid-template-columns:repeat(2,1fr);}}
        .fg-kpi{background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:14px;display:flex;align-items:center;gap:12px;}
        .fg-kpi-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .fg-kpi-val{font-size:20px;font-weight:800;line-height:1;margin-bottom:2px;}
        .fg-kpi-lbl{font-size:11px;color:#9ca3af;}
        .fg-tabs{display:flex;gap:4px;margin-bottom:14px;background:#f8fafc;padding:4px;border-radius:10px;width:fit-content;border:1px solid #e5e7eb;}
        .fg-tab{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;font-size:13px;font-weight:500;color:#6b7280;cursor:pointer;border:none;background:transparent;}
        .fg-tab.active{background:#fff;color:#0061d2;font-weight:700;box-shadow:0 1px 4px #e2e6ef;}
        .fg-badge{font-size:10px;font-weight:700;background:#10b981;color:#0052b3;border-radius:10px;padding:1px 6px;}
        .fg-filters{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
        .fg-search{display:flex;align-items:center;gap:7px;padding:8px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;flex:1;min-width:180px;}
        .fg-search:focus-within{border-color:#0061d2;}
        .fg-search input{border:none;outline:none;font-size:13px;flex:1;background:transparent;color:#1f2937;}
        .fg-search button{background:none;border:none;cursor:pointer;color:#9ca3af;}
        .fg-date-wrap{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;color:#6b7280;}
        .fg-date-wrap input{border:none;outline:none;font-size:12px;color:#1f2937;background:transparent;}
        .fg-date-wrap button{background:none;border:none;cursor:pointer;color:#9ca3af;}
        .fg-stock-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;}
        .fg-stock-card{background:#fff;border-radius:14px;border:1px solid #e5e7eb;padding:16px;transition:box-shadow .15s;}
        .fg-stock-card:hover{box-shadow:0 4px 16px #e2e6ef;}
        .fg-stock-card.empty{opacity:.65;}
        .fg-stock-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;}
        .fg-stock-recipe{display:flex;align-items:center;gap:10px;}
        .fg-stock-icon{width:34px;height:34px;background:#e8f0fd;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#0061d2;flex-shrink:0;}
        .fg-stock-name{font-size:14px;font-weight:700;color:#1f2937;}
        .fg-stock-cat{font-size:11px;color:#9ca3af;margin-top:2px;}
        .fg-stock-avail{text-align:right;font-size:26px;font-weight:800;color:#10b981;line-height:1;}
        .fg-stock-avail span{display:block;font-size:10px;font-weight:600;color:#9ca3af;margin-top:2px;}
        .fg-stock-avail.zero{color:#d1d5db;}
        .fg-progress-wrap{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
        .fg-progress-track{flex:1;height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;display:flex;}
        .fg-prog-sold{height:100%;background:#0061d2;transition:width .4s;}
        .fg-prog-wasted{height:100%;background:#ef4444;transition:width .4s;}
        .fg-prog-avail{height:100%;background:#10b981;transition:width .4s;}
        .fg-progress-label{font-size:10px;color:#6b7280;white-space:nowrap;font-weight:700;}
        .fg-stock-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;}
        .fg-stock-stat{text-align:center;}
        .fg-stat-lbl{display:block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#9ca3af;margin-bottom:2px;}
        .fg-stat-val{font-size:14px;font-weight:800;color:#1f2937;}
        .fg-stat-val.blue{color:#3b82f6;}
        .fg-stat-val.orange{color:#0061d2;}
        .fg-stat-val.red{color:#ef4444;}
        .fg-stock-footer{display:flex;align-items:center;gap:5px;font-size:10px;color:#9ca3af;margin-bottom:10px;}
        .fg-stock-actions{display:flex;gap:8px;}
        .fg-act-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;}
        .fg-act-btn.produce{background:rgba(0,97,210,.08);border:1px solid rgba(0,97,210,.15);color:#0061d2;}
        .fg-act-btn.produce:hover{background:rgba(0,97,210,.12);}
        .fg-act-btn.sell{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:#10b981;}
        .fg-act-btn.sell:hover{background:rgba(16,185,129,.15);}
        .fg-table-wrap{background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;}
        .fg-table{width:100%;border-collapse:collapse;}
        .fg-table thead tr{background:#f8fafc;border-bottom:1px solid #e5e7eb;}
        .fg-table th{padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;}
        .fg-row{border-bottom:1px solid #f1f5f9;}
        .fg-row:last-child{border-bottom:none;}
        .fg-row:hover{background:#fafafa;}
        .fg-table td{padding:11px 14px;font-size:13px;vertical-align:middle;}
        .fg-date-chip{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#6b7280;}
        .fg-recipe-name{font-size:13px;font-weight:600;color:#1f2937;}
        .fg-recipe-cat{font-size:11px;color:#9ca3af;margin-top:1px;}
        .fg-serv-chip{font-size:13px;font-weight:600;color:#10b981;}
        .fg-deductions{display:flex;flex-wrap:wrap;gap:4px;}
        .fg-deduct-chip{font-size:10px;padding:2px 6px;background:#f1f5f9;color:#64748b;border-radius:4px;}
        .fg-more{font-size:10px;color:#9ca3af;}
        .fg-cost{font-size:13px;font-weight:700;color:#0061d2;}
        .fg-cost-per{font-size:12px;color:#6b7280;}
        .fg-muted{font-size:12px;color:#9ca3af;}
        .fg-loading,.fg-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:48px;color:#9ca3af;text-align:center;background:#fff;border-radius:12px;border:1px solid #e5e7eb;}
        .fg-empty h3{font-size:16px;font-weight:600;color:#374151;margin:0;}
        .fg-empty p{font-size:13px;margin:0;}
        .fg-spin{animation:fg-spin .8s linear infinite;}
        @keyframes fg-spin{to{transform:rotate(360deg);}}
      `}</style>
    </div>
  );
};

export default FinishedGoods;