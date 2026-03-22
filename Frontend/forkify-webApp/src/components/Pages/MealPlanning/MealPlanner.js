import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Plus, Trash2, RefreshCw, ChefHat,
  Save, Send, TrendingUp, AlertTriangle, CheckCircle,
  Edit2, X, Search, Users, Clock,
} from 'lucide-react';
import mealPlanService from '../../../services/mealPlanService';
import recipeService   from '../../../services/recipeService';
import usePermission   from '../../../hooks/usePermission';
import useBranch       from '../../../hooks/useBranch';
import AICalorieAssistant, { AICalorieTrigger } from '../../AI/AICalorieAssistant'; // ← NEW

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const MEAL_COLORS = {
  BREAKFAST: { bg: 'rgba(251,191,36,.12)', color: '#fbbf24', border: 'rgba(251,191,36,.25)' },
  LUNCH:     { bg: 'rgba(16,185,129,.12)',  color: '#34d399', border: 'rgba(16,185,129,.25)' },
  DINNER:    { bg: 'rgba(0,97,210,.12)',  color: '#3385e0', border: 'rgba(0,97,210,.25)' },
  SNACK:     { bg: 'rgba(0,97,210,.1)',  color: '#3385e0', border: 'rgba(0,97,210,.25)' },
};

const getISOWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

const currentYear = new Date().getFullYear();
const currentWeek = getISOWeek(new Date());

const MealPlanner = () => {
  const navigate         = useNavigate();
  const { isHQ, canApprove } = usePermission();
  const { branchId }     = useBranch();
  const [showAI,         setShowAI]         = useState(false); // ← NEW

  const [plans,       setPlans]       = useState([]);
  const [activePlan,  setActivePlan]  = useState(null);
  const [week,        setWeek]        = useState(currentWeek);
  const [year,        setYear]        = useState(currentYear);
  const [recipes,     setRecipes]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);

  // Add-item modal state
  const [addModal,    setAddModal]    = useState(null); // { day, mealType }
  const [recipeSearch, setRecipeSearch] = useState('');
  const [covers,      setCovers]      = useState(10);

  // Create plan modal
  const [createModal, setCreateModal] = useState(false);
  const [planName,    setPlanName]    = useState('');

  // Load plans for this week
  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await mealPlanService.getAll({ week, year, branchId });
      setPlans(data || []);
      // Always update active plan when week/year changes; keep current if same week reload
      if (data?.length > 0) {
        setActivePlan(prev => {
          if (!prev) return data[0];
          const still = data.find(p => p.id === prev.id);
          return still || data[0];
        });
      } else {
        setActivePlan(null);
      }
    } catch {
      setError('Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  }, [week, year, branchId]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  // Load all active recipes once
  useEffect(() => {
    recipeService.getAll({ status: 'ACTIVE' })
      .then(({ data }) => setRecipes(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getItemsForSlot = (day, mealType) => {
    if (!activePlan) return [];
    return (activePlan.items || []).filter(
      i => i.day === day && i.mealType === mealType
    );
  };

  const filteredRecipes = recipes.filter(r =>
    !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase())
      || r.category.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  // ── Create new plan ────────────────────────────────────────────────────────
  const handleCreatePlan = async () => {
    if (!planName.trim()) return;
    setSaving(true);
    try {
      const { data } = await mealPlanService.create({
        planName: planName.trim(), weekNumber: week, year, status: 'DRAFT', items: [],
      }, branchId);
      setPlans(prev => [data, ...prev]);
      setActivePlan(data);
      setCreateModal(false);
      setPlanName('');
      setSuccess('Meal plan created');
    } catch (e) {
      setError(e.response?.data || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  // ── Add recipe to slot ─────────────────────────────────────────────────────
  const handleAddItem = async (recipe) => {
    if (!activePlan || !addModal) return;
    const updatedItems = [
      ...(activePlan.items || []),
      {
        recipeId: recipe.id, recipeName: recipe.name, recipeCategory: recipe.category,
        day: addModal.day, mealType: addModal.mealType,
        expectedCovers: covers,
        displayName: recipe.name,
      },
    ];
    await savePlanItems(updatedItems);
    setAddModal(null);
    setRecipeSearch('');
    setCovers(10);
  };

  // ── Remove item from slot ──────────────────────────────────────────────────
  const handleRemoveItem = async (item) => {
    if (!activePlan) return;
    const updatedItems = (activePlan.items || []).filter(
      i => !(i.recipeId === item.recipeId && i.day === item.day && i.mealType === item.mealType)
    );
    await savePlanItems(updatedItems);
  };

  // ── Save plan with updated items ───────────────────────────────────────────
  const savePlanItems = async (items) => {
    setSaving(true);
    try {
      const payload = {
        planName:    activePlan.planName,
        weekNumber:  activePlan.weekNumber,
        year:        activePlan.year,
        status:      activePlan.status,
        items: items.map(i => ({
          recipeId:       i.recipeId,
          day:            i.day,
          mealType:       i.mealType,
          expectedCovers: i.expectedCovers || 10,
          displayName:    i.displayName,
          notes:          i.notes,
        })),
      };
      const { data } = await mealPlanService.update(activePlan.id, payload);
      setActivePlan(data);
      setPlans(prev => prev.map(p => p.id === data.id ? data : p));
    } catch (e) {
      setError(e.response?.data || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Push to branches (HQ only) ─────────────────────────────────────────────
  const handlePush = async () => {
    if (!activePlan) return;
    setSaving(true);
    try {
      await mealPlanService.pushToBranches(activePlan.id, []);
      setSuccess(`Plan pushed to all branches`);
      loadPlans();
    } catch (e) {
      setError(e.response?.data || 'Push failed');
    } finally {
      setSaving(false);
    }
  };

  const totalItems   = (activePlan?.items || []).length;
  const totalCovers  = (activePlan?.items || []).reduce((s, i) => s + (i.expectedCovers || 0), 0);

  return (
    <div className="mp-page">
      <style>{css}</style>

      {/* ── Top bar ── */}
      <div className="mp-topbar">
        <div className="mp-topbar-left">
          <div className="mp-title-icon"><Calendar size={18} /></div>
          <div>
            <h2 className="mp-title">Meal Planner</h2>
            <div className="mp-subtitle">Weekly menu scheduling</div>
          </div>
        </div>
        <div className="mp-topbar-right">
          {/* Week selector */}
          <div className="mp-week-sel">
            <button className="mp-week-btn" onClick={() => setWeek(w => Math.max(1, w - 1))}>‹</button>
            <span className="mp-week-label">Week {week}, {year}</span>
            <button className="mp-week-btn" onClick={() => setWeek(w => Math.min(52, w + 1))}>›</button>
          </div>
          <button className="mp-btn-outline" onClick={() => setCreateModal(true)}>
            <Plus size={14} /> New Plan
          </button>
          {/* ── AI Calorie Planner button ── */}
          {recipes.length > 0 && (
            <AICalorieTrigger
              onClick={() => setShowAI(true)}
              itemCount={recipes.filter(r => r.status === 'ACTIVE').length}
              label="AI Calorie Planner"
            />
          )}
          {isHQ && activePlan && (
            <button className="mp-btn-primary" onClick={handlePush} disabled={saving}>
              <Send size={14} /> Push to Branches
            </button>
          )}
        </div>
      </div>

      {/* ── Alerts ── */}
      {error   && <div className="mp-alert error"><AlertTriangle size={14} />{error}<button onClick={() => setError(null)}><X size={12}/></button></div>}
      {success && <div className="mp-alert success"><CheckCircle size={14} />{success}</div>}

      {/* ── Plan selector tabs ── */}
      {plans.length > 0 && (
        <div className="mp-plan-tabs">
          {plans.map(p => (
            <button
              key={p.id}
              className={`mp-plan-tab ${activePlan?.id === p.id ? 'active' : ''}`}
              onClick={() => setActivePlan(p)}
            >
              <span>{p.planName}</span>
              <span className={`mp-status-chip ${p.status.toLowerCase()}`}>{p.status}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Stats bar ── */}
      {activePlan && (
        <div className="mp-stats">
          <div className="mp-stat"><span className="mp-stat-val">{totalItems}</span><span className="mp-stat-label">Meals Planned</span></div>
          <div className="mp-stat"><span className="mp-stat-val">{totalCovers}</span><span className="mp-stat-label">Total Covers</span></div>
          <div className="mp-stat"><span className="mp-stat-val">{DAYS.filter((_,i) => (activePlan.items||[]).some(item => item.day === i+1)).length}/7</span><span className="mp-stat-label">Days Covered</span></div>
          <div className="mp-stat-actions">
            <button className="mp-btn-ghost" onClick={() => navigate(`/fooderp/meal-planning/forecast?planId=${activePlan.id}`)}>
              <TrendingUp size={13} /> Forecast
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="mp-loading"><RefreshCw size={20} className="spin" /> Loading...</div>
      )}

      {/* ── No plans ── */}
      {!loading && plans.length === 0 && (
        <div className="mp-empty">
          <Calendar size={48} />
          <h3>No meal plans for Week {week}</h3>
          <p>Create a meal plan to start scheduling</p>
          <button className="mp-btn-primary" onClick={() => setCreateModal(true)}>
            <Plus size={14} /> Create Meal Plan
          </button>
        </div>
      )}

      {/* ── Weekly Grid ── */}
      {activePlan && !loading && (
        <div className="mp-grid-wrap">
          <table className="mp-grid">
            <thead>
              <tr>
                <th className="mp-th mp-th-meal">Meal</th>
                {DAYS.map(d => <th key={d} className="mp-th">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map(mealType => {
                const cfg = MEAL_COLORS[mealType];
                return (
                  <tr key={mealType} className="mp-row">
                    <td className="mp-td-meal" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                      <span style={{ color: cfg.color, fontWeight: 700, fontSize: 12 }}>
                        {mealType}
                      </span>
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const dayNum = dayIdx + 1;
                      const items  = getItemsForSlot(dayNum, mealType);
                      return (
                        <td key={dayNum} className="mp-td">
                          {items.map((item, idx) => (
                            <div key={idx} className="mp-meal-chip" style={{ background: cfg.bg, borderColor: cfg.border }}>
                              <div className="mp-meal-name">{item.displayName || item.recipeName}</div>
                              <div className="mp-meal-meta">
                                <Users size={10} /> {item.expectedCovers}
                              </div>
                              <button
                                className="mp-meal-del"
                                onClick={() => handleRemoveItem(item)}
                                title="Remove"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                          <button
                            className="mp-add-btn"
                            onClick={() => setAddModal({ day: dayNum, mealType })}
                            title={`Add ${mealType} on ${DAYS[dayIdx]}`}
                          >
                            <Plus size={11} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Plan Modal ── */}
      {createModal && (
        <div className="mp-modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <div className="mp-modal-header">
              <h3>New Meal Plan</h3>
              <button className="mp-modal-close" onClick={() => setCreateModal(false)}><X size={16}/></button>
            </div>
            <div className="mp-modal-body">
              <label className="mp-label">Plan Name</label>
              <input
                className="mp-input"
                placeholder={`Week ${week} Menu`}
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreatePlan()}
              />
              <div style={{ fontSize:12, color:'#9aa3b4', marginTop:6 }}>
                Week {week}, {year}
              </div>
            </div>
            <div className="mp-modal-footer">
              <button className="mp-btn-ghost" onClick={() => setCreateModal(false)}>Cancel</button>
              <button className="mp-btn-primary" onClick={handleCreatePlan} disabled={saving || !planName.trim()}>
                {saving ? <RefreshCw size={13} className="spin" /> : <Plus size={13} />}
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Recipe Modal ── */}
      {addModal && (
        <div className="mp-modal-overlay" onClick={() => setAddModal(null)}>
          <div className="mp-modal mp-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="mp-modal-header">
              <h3>
                Add to {addModal.mealType} — {DAYS[addModal.day - 1]}
              </h3>
              <button className="mp-modal-close" onClick={() => setAddModal(null)}><X size={16}/></button>
            </div>
            <div className="mp-modal-body">
              {/* Covers input */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <label className="mp-label" style={{ marginBottom:0, whiteSpace:'nowrap' }}>
                  <Users size={13} /> Expected Covers:
                </label>
                <input
                  type="number"
                  className="mp-input"
                  style={{ width:80 }}
                  value={covers}
                  min={1}
                  onChange={e => setCovers(parseInt(e.target.value) || 1)}
                />
              </div>
              {/* Recipe search */}
              <div className="mp-recipe-search">
                <Search size={14} />
                <input
                  className="mp-search-input"
                  placeholder="Search recipes..."
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="mp-recipe-list">
                {filteredRecipes.length === 0 ? (
                  <div style={{ padding:'20px', textAlign:'center', color:'#9aa3b4', fontSize:13 }}>
                    No recipes found
                  </div>
                ) : filteredRecipes.map(r => (
                  <div
                    key={r.id}
                    className="mp-recipe-option"
                    onClick={() => handleAddItem(r)}
                  >
                    <div className="mp-recipe-option-name">
                      <ChefHat size={13} style={{ color:'#0061d2', flexShrink:0 }} />
                      {r.name}
                    </div>
                    <div className="mp-recipe-option-meta">
                      <span>{r.category}</span>
                      {r.prepTime + r.cookTime > 0 && (
                        <span><Clock size={10} /> {r.prepTime + r.cookTime} min</span>
                      )}
                      {r.costPerServing && (
                        <span>₹{Number(r.costPerServing).toFixed(2)}/serving</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Calorie Assistant modal ── */}
      {showAI && (
        <AICalorieAssistant
          menuItems={recipes.filter(r => r.status === 'ACTIVE').map(r => ({
            displayName:  r.name,
            calories:     r.calories  || 0,
            protein:      r.protein   || 0,
            carbs:        r.carbs     || 0,
            fat:          r.fat       || 0,
            menuCategory: r.category,
          }))}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
};

const css = `
  .mp-page { font-family:'DM Sans',sans-serif; color:#1f2937; }

  .mp-topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:12px; }
  .mp-topbar-left  { display:flex; align-items:center; gap:12px; }
  .mp-topbar-right { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .mp-title-icon { width:38px; height:38px; background:rgba(0,97,210,.15); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#3385e0; }
  .mp-title    { font-size:20px; font-weight:700; color:#1f2937; margin:0 0 2px; }
  .mp-subtitle { font-size:12px; color:#9aa3b4; }

  .mp-week-sel { display:flex; align-items:center; gap:8px; background:#f8f9fc; border:1px solid #e2e6ef; border-radius:9px; padding:4px 10px; }
  .mp-week-btn { background:none; border:none; color:#9aa3b4; cursor:pointer; font-size:16px; padding:0 4px; line-height:1; }
  .mp-week-btn:hover { color:#1f2937; }
  .mp-week-label { font-size:13px; font-weight:600; color:#1f2937; white-space:nowrap; }

  .mp-btn-ghost   { display:flex; align-items:center; gap:6px; padding:8px 13px; background:#f0f2f7; border:1px solid #e2e6ef; border-radius:9px; color:#374151; font-size:13px; cursor:pointer; transition:background .15s; white-space:nowrap; }
  .mp-btn-ghost:hover { background:#e8ebf2; color:#1f2937; }
  .mp-btn-outline { display:flex; align-items:center; gap:6px; padding:8px 13px; background:transparent; border:1px solid #e2e6ef; border-radius:9px; color:#4b5263; font-size:13px; cursor:pointer; transition:all .15s; }
  .mp-btn-outline:hover { background:#e2e6ef; color:#0052b3; }
  .mp-btn-primary { display:flex; align-items:center; gap:6px; padding:8px 14px; background:#e8f0fd; border:1px solid #b3ccf5; border-radius:9px; color:#0052b3; font-size:13px; font-weight:600; cursor:pointer; transition:background .15s; white-space:nowrap; }
  .mp-btn-primary:hover:not(:disabled) { background:#d4e4fb; }
  .mp-btn-primary:disabled { opacity:.45; cursor:not-allowed; }

  .mp-alert { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:14px; }
  .mp-alert button { background:none; border:none; cursor:pointer; margin-left:auto; opacity:.6; }
  .mp-alert.error   { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.25); color:#fca5a5; }
  .mp-alert.success { background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.25); color:#6ee7b7; }

  .mp-plan-tabs { display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
  .mp-plan-tab  { display:flex; align-items:center; gap:7px; padding:7px 14px; background:#ffffff; border:1px solid #e2e6ef; border-radius:9px; color:#9aa3b4; font-size:13px; cursor:pointer; transition:all .15s; }
  .mp-plan-tab:hover { background:#e2e6ef; color:#1f2937; }
  .mp-plan-tab.active { background:rgba(0,97,210,.1); border-color:rgba(0,97,210,.2); color:#3385e0; }
  .mp-status-chip { font-size:9px; font-weight:700; letter-spacing:.4px; text-transform:uppercase; padding:2px 6px; border-radius:4px; }
  .mp-status-chip.draft    { background:#e2e6ef; color:#9aa3b4; }
  .mp-status-chip.active   { background:rgba(16,185,129,.15); color:#34d399; }
  .mp-status-chip.pushed   { background:rgba(0,97,210,.15); color:#3385e0; }
  .mp-status-chip.archived { background:#f8f9fc; color:#9aa3b4; }

  .mp-stats { display:flex; gap:14px; background:#ffffff; border:1px solid #e2e6ef; border-radius:12px; padding:12px 18px; margin-bottom:16px; align-items:center; flex-wrap:wrap; }
  .mp-stat  { display:flex; flex-direction:column; gap:2px; }
  .mp-stat-val   { font-size:20px; font-weight:800; color:#1f2937; }
  .mp-stat-label { font-size:11px; color:#9aa3b4; text-transform:uppercase; letter-spacing:.4px; }
  .mp-stat-actions { margin-left:auto; }

  .mp-loading { text-align:center; padding:40px; color:#9aa3b4; display:flex; align-items:center; justify-content:center; gap:8px; }
  .mp-empty   { text-align:center; padding:60px 20px; color:#9aa3b4; }
  .mp-empty h3 { font-size:18px; color:#4b5263; margin:12px 0 6px; }
  .mp-empty p  { font-size:13px; margin:0 0 20px; }

  .mp-grid-wrap { overflow-x:auto; border-radius:14px; border:1px solid #e2e6ef; }
  .mp-grid { width:100%; border-collapse:collapse; min-width:900px; }
  .mp-th   { padding:10px 8px; font-size:11px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:#9aa3b4; text-align:left; background:#ffffff; border-bottom:1px solid #e2e6ef; white-space:nowrap; }
  .mp-th-meal { width:90px; }
  .mp-row  { }
  .mp-td-meal { padding:10px 12px; background:#fafbfc; border-right:1px solid #f0f2f7; border-bottom:1px solid #f8f9fc; vertical-align:top; white-space:nowrap; }
  .mp-td   { padding:6px 6px; border-right:1px solid #ffffff; border-bottom:1px solid #f0f2f7; vertical-align:top; min-width:100px; }
  .mp-row:last-child .mp-td, .mp-row:last-child .mp-td-meal { border-bottom:none; }

  .mp-meal-chip { position:relative; background:#f8f9fc; border:1px solid #e2e6ef; border-radius:8px; padding:6px 22px 6px 7px; margin-bottom:4px; }
  .mp-meal-name { font-size:11.5px; font-weight:600; color:#1f2937; line-height:1.3; }
  .mp-meal-meta { display:flex; align-items:center; gap:3px; font-size:10px; color:#9aa3b4; margin-top:3px; }
  .mp-meal-del  { position:absolute; top:4px; right:4px; background:rgba(239,68,68,.15); border:none; border-radius:4px; padding:2px; cursor:pointer; color:rgba(239,68,68,.6); display:flex; align-items:center; justify-content:center; transition:all .15s; opacity:0; }
  .mp-meal-chip:hover .mp-meal-del { opacity:1; }
  .mp-meal-del:hover { background:rgba(239,68,68,.3); color:#f87171; }

  .mp-add-btn { width:100%; padding:4px; background:none; border:1px dashed #e2e6ef; border-radius:7px; color:#d8dde8; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .mp-add-btn:hover { border-color:rgba(0,97,210,.4); color:#3385e0; background:rgba(0,97,210,.06); }

  /* Modals */
  .mp-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
  .mp-modal       { background:#ffffff; border:1px solid #e2e6ef; border-radius:16px; width:100%; max-width:440px; overflow:hidden; }
  .mp-modal-wide  { max-width:560px; }
  .mp-modal-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #e2e6ef; background:#f8fafc; }
  .mp-modal-header h3 { margin:0; font-size:15px; font-weight:700; color:#1f2937; }
  .mp-modal-close  { background:#e8f0fd; border:1px solid #b3ccf5; border-radius:7px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#0052b3; }
  .mp-modal-close:hover { background:#d4e4fb; }
  .mp-modal-body   { padding:18px 20px; }
  .mp-modal-footer { display:flex; gap:10px; justify-content:flex-end; padding:14px 20px; border-top:1px solid #e2e6ef; background:#f8fafc; }
  .mp-label { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:#6b7280; margin-bottom:6px; text-transform:uppercase; letter-spacing:.4px; }
  .mp-input { width:100%; background:#ffffff; border:1px solid #e2e6ef; border-radius:9px; padding:9px 12px; color:#1f2937; font-size:13px; outline:none; font-family:inherit; box-sizing:border-box; }
  .mp-input:focus { border-color:#0061d2; box-shadow:0 0 0 3px rgba(0,97,210,.1); }

  .mp-recipe-search { display:flex; align-items:center; gap:8px; background:#f8f9fc; border:1px solid #e2e6ef; border-radius:9px; padding:0 12px; margin-bottom:10px; }
  .mp-search-input  { background:none; border:none; outline:none; color:#1f2937; font-size:13px; width:100%; padding:9px 0; }
  .mp-search-input::placeholder { color:#9aa3b4; }
  .mp-recipe-list   { max-height:320px; overflow-y:auto; }
  .mp-recipe-option { display:flex; flex-direction:column; gap:4px; padding:10px 12px; border-radius:9px; cursor:pointer; transition:background .15s; }
  .mp-recipe-option:hover { background:rgba(0,97,210,.1); }
  .mp-recipe-option-name { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:#1f2937; }
  .mp-recipe-option-meta { display:flex; align-items:center; gap:10px; font-size:11px; color:#9aa3b4; margin-left:20px; }

  .spin { animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
`;

export default MealPlanner;