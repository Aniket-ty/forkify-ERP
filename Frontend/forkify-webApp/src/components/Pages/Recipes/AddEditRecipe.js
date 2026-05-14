import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChefHat, ArrowLeft, Plus, Trash2, Search,
  IndianRupee, Save, AlertTriangle, RefreshCw,
  Check, X,
} from 'lucide-react';
import { createRecipe, updateRecipe, fetchRecipeById } from '../../../store/actions/recipeActions';
import recipeService from '../../../services/recipeService';

const CATEGORIES = [
  'Indian', 'Italian', 'Chinese', 'Mexican', 'Continental',
  'Seafood', 'Fast Food', 'Dessert', 'Beverages', 'Breakfast',
];
const UNITS = ['kg', 'g', 'ltr', 'ml', 'pcs', 'dozen', 'cup', 'tbsp', 'tsp', 'pack'];
const TAGS_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'High Protein',
  'Spicy', 'Low Calorie', 'Dairy-Free', 'Keto',
];

const empty = () => ({
  name: '', description: '', category: '', servings: 4,
  prepTime: 0, cookTime: 0, status: 'DRAFT', hqOwned: false,
  tags: [], allergens: '', imageUrl: '',
  calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
  ingredients: [],
  steps: [],
});

const AddEditRecipe = () => {
  const { id }     = useParams();
  const isEdit     = !!id;
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { selected, loading: saving } = useSelector(s => s.recipes);

  const [form,       setForm]       = useState(empty());
  const [errors,     setErrors]     = useState({});
  const [ingSearch,  setIngSearch]  = useState('');
  const [ingResults, setIngResults] = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [liveCost,   setLiveCost]   = useState(0);
  const [submitError, setSubmitError] = useState(null);

  // Load recipe for editing
  useEffect(() => {
    if (isEdit) dispatch(fetchRecipeById(id));
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && selected && String(selected.id) === String(id)) {
      setForm({
        name:        selected.name        || '',
        description: selected.description || '',
        category:    selected.category    || '',
        servings:    selected.servings    || 4,
        prepTime:    selected.prepTime    || 0,
        cookTime:    selected.cookTime    || 0,
        status:      selected.status      || 'DRAFT',
        hqOwned:     selected.hqOwned     || false,
        tags:        (Array.isArray(selected.tags) ? selected.tags : (selected.tags ? selected.tags.split(',').map(t => t.trim()).filter(Boolean) : [])),
        allergens:   Array.isArray(selected.allergens) ? selected.allergens.join(',') : (selected.allergens || ''),
        imageUrl:    selected.imageUrl    || '',
        calories:    selected.calories    || 0,
        protein:     selected.protein     || 0,
        carbs:       selected.carbs       || 0,
        fat:         selected.fat         || 0,
        fiber:       selected.fiber       || 0,
        steps: (selected.steps || []).map(s => ({
          stepNumber:      s.stepNumber,
          title:           s.title || '',
          instruction:     s.instruction || '',
          durationMinutes: s.durationMinutes || '',
        })),
        ingredients: (selected.ingredients || []).map(i => ({
          ingredientId:   i.ingredientId,
          ingredientName: i.ingredientName,
          category:       i.category,
          quantity:        i.quantity,
          unit:           i.unit,
          unitCost:       parseFloat(i.unitCost || 0),
          notes:          i.notes || '',
        })),
      });
    }
  }, [isEdit, selected, id]);

  // Recalculate live cost whenever ingredients change
  useEffect(() => {
    const total = form.ingredients.reduce((sum, i) => {
      return sum + (parseFloat(i.unitCost || 0) * parseFloat(i.quantity || 0));
    }, 0);
    setLiveCost(total);
  }, [form.ingredients]);

  // Search ingredients from API
  const searchIngredients = useCallback(async (q) => {
    if (!q || q.length < 2) { setIngResults([]); return; }
    setSearching(true);
    try {
      const { data } = await recipeService.getAllIngredients({ q });
      setIngResults(data || []);
    } catch { setIngResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchIngredients(ingSearch), 300);
    return () => clearTimeout(t);
  }, [ingSearch, searchIngredients]);

  const addIngredient = (ing) => {
    const already = form.ingredients.find(i => i.ingredientId === ing.id);
    if (already) return;
    setForm(f => ({
      ...f,
      ingredients: [...f.ingredients, {
        ingredientId:   ing.id,
        ingredientName: ing.name,
        category:       ing.category,
        quantity:       1,
        unit:           ing.unit,
        unitCost:       parseFloat(ing.costPerUnit || 0),
        notes:          '',
      }],
    }));
    setIngSearch('');
    setIngResults([]);
  };

  const removeIngredient = (idx) => {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  };

  const updateIngredient = (idx, field, value) => {
    setForm(f => {
      const updated = [...f.ingredients];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...f, ingredients: updated };
    });
  };

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag],
    }));
  };

  // ── Steps helpers ──────────────────────────────────────────────────────────
  const addStep = () => {
    setForm(f => ({
      ...f,
      steps: [...f.steps, { stepNumber: f.steps.length + 1, title: '', instruction: '', durationMinutes: '' }],
    }));
  };

  const removeStep = (idx) => {
    setForm(f => ({
      ...f,
      steps: f.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 })),
    }));
  };

  const updateStep = (idx, field, value) => {
    setForm(f => {
      const updated = [...f.steps];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...f, steps: updated };
    });
  };

  const moveStep = (idx, dir) => {
    setForm(f => {
      const steps = [...f.steps];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= steps.length) return f;
      [steps[idx], steps[swapIdx]] = [steps[swapIdx], steps[idx]];
      return { ...f, steps: steps.map((s, i) => ({ ...s, stepNumber: i + 1 })) };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Recipe name is required';
    if (!form.category.trim()) e.category = 'Category is required';
    if (form.servings < 1)     e.servings = 'Servings must be at least 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError(null);

    const payload = {
      ...form,
      tags:        form.tags.join(','),
      ingredients: form.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity:     parseFloat(i.quantity),
        unit:         i.unit,
        notes:        i.notes || null,
      })),
      steps: form.steps.map((s, idx) => ({
        stepNumber:      idx + 1,
        title:           s.title || '',
        instruction:     s.instruction || '',
        durationMinutes: s.durationMinutes ? parseInt(s.durationMinutes) : null,
      })),
    };

    const result = isEdit
      ? await dispatch(updateRecipe(id, payload))
      : await dispatch(createRecipe(payload));

    if (result.success) {
      navigate(`/fooderp/recipes/${result.data.id}`);
    } else {
      setSubmitError(result.error || 'Something went wrong');
    }
  };

  const costPerServing = form.servings > 0
    ? (liveCost / form.servings).toFixed(2)
    : '0.00';

  return (
    <div className="aer-container">

      {/* ── Top bar ── */}
      <div className="aer-topbar">
        <button className="aer-btn-ghost" onClick={() => navigate('/fooderp/recipes/list')}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="aer-page-title">
          <ChefHat size={22} />
          {isEdit ? 'Edit Recipe' : 'New Recipe'}
        </h1>
        <div className="aer-topbar-right">
          <button
            className="aer-btn-ghost"
            onClick={() => navigate('/fooderp/recipes/list')}
          >
            <X size={14} /> Cancel
          </button>
          <button className="aer-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving
              ? <><RefreshCw size={14} className="spin" /> Saving...</>
              : <><Save size={14} /> {isEdit ? 'Update' : 'Create'} Recipe</>
            }
          </button>
        </div>
      </div>

      {submitError && (
        <div className="aer-error-banner">
          <AlertTriangle size={15} />
          <span>{submitError}</span>
          <button onClick={() => setSubmitError(null)}>✕</button>
        </div>
      )}

      <div className="aer-grid">

        {/* ── LEFT column ── */}
        <div className="aer-left">

          {/* Basic info */}
          <div className="aer-card">
            <h3 className="aer-card-title">Basic Information</h3>

            <div className="aer-field">
              <label>Recipe Name *</label>
              <input
                className={errors.name ? 'error' : ''}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Margherita Pizza"
              />
              {errors.name && <span className="aer-field-error">{errors.name}</span>}
            </div>

            <div className="aer-field">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the recipe..."
              />
            </div>

            <div className="aer-row">
              <div className="aer-field">
                <label>Category *</label>
                <select
                  className={errors.category ? 'error' : ''}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span className="aer-field-error">{errors.category}</span>}
              </div>
              <div className="aer-field">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="aer-row">
              <div className="aer-field">
                <label>Base Servings *</label>
                <input
                  type="number" min="1"
                  className={errors.servings ? 'error' : ''}
                  value={form.servings}
                  onChange={e => setForm(f => ({ ...f, servings: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="aer-field">
                <label>Prep Time (min)</label>
                <input
                  type="number" min="0"
                  value={form.prepTime}
                  onChange={e => setForm(f => ({ ...f, prepTime: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="aer-field">
                <label>Cook Time (min)</label>
                <input
                  type="number" min="0"
                  value={form.cookTime}
                  onChange={e => setForm(f => ({ ...f, cookTime: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="aer-field">
              <label>Tags</label>
              <div className="aer-tag-group">
                {TAGS_OPTIONS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`aer-tag-btn ${form.tags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {form.tags.includes(tag) && <Check size={10} />}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="aer-field">
              <label>Allergens (comma separated)</label>
              <input
                value={form.allergens}
                onChange={e => setForm(f => ({ ...f, allergens: e.target.value }))}
                placeholder="e.g. Gluten, Dairy, Nuts"
              />
            </div>
          </div>

          {/* Nutrition */}
          <div className="aer-card">
            <h3 className="aer-card-title">Nutrition <span className="aer-card-sub">per {form.servings} serving{form.servings !== 1 ? 's' : ''}</span></h3>
            <div className="aer-row aer-row-5">
              {[
                { key: 'calories', label: 'Calories', unit: 'kcal' },
                { key: 'protein',  label: 'Protein',  unit: 'g' },
                { key: 'carbs',    label: 'Carbs',    unit: 'g' },
                { key: 'fat',      label: 'Fat',      unit: 'g' },
                { key: 'fiber',    label: 'Fiber',    unit: 'g' },
              ].map(n => (
                <div key={n.key} className="aer-field">
                  <label>{n.label} ({n.unit})</label>
                  <input
                    type="number" min="0" step="0.1"
                    value={form[n.key]}
                    onChange={e => setForm(f => ({ ...f, [n.key]: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT column ── */}
        <div className="aer-right">

          {/* Live cost box */}
          <div className="aer-cost-box">
            <div className="aer-cost-top">
              <IndianRupee size={18} />
              <div>
                <div className="aer-cost-label">Live Cost Estimate</div>
                <div className="aer-cost-value">₹{liveCost.toFixed(2)}</div>
              </div>
            </div>
            <div className="aer-cost-per">
              Per serving: <strong>₹{costPerServing}</strong>
            </div>
            <p className="aer-cost-note">
              Updates automatically as you add ingredients
            </p>
          </div>

          {/* Ingredient search + list */}
          <div className="aer-card">
            <h3 className="aer-card-title">
              Ingredients
              <span className="aer-count">{form.ingredients.length}</span>
            </h3>

            {/* Search */}
            <div className="aer-ing-search-wrap">
              <div className="aer-ing-search">
                <Search size={14} />
                <input
                  placeholder="Search ingredients to add..."
                  value={ingSearch}
                  onChange={e => setIngSearch(e.target.value)}
                />
                {searching && <RefreshCw size={12} className="spin" />}
              </div>

              {ingResults.length > 0 && (
                <div className="aer-ing-dropdown">
                  {ingResults.map(ing => (
                    <button
                      key={ing.id}
                      className="aer-ing-result"
                      onClick={() => addIngredient(ing)}
                    >
                      <span className="aer-ing-result-name">{ing.name}</span>
                      <span className="aer-ing-result-meta">
                        {ing.unit} · ${parseFloat(ing.costPerUnit || 0).toFixed(2)}
                      </span>
                      <Plus size={14} className="aer-ing-add-icon" />
                    </button>
                  ))}
                </div>
              )}

              {ingSearch.length >= 2 && !searching && ingResults.length === 0 && (
                <div className="aer-ing-no-results">
                  No ingredients found for "{ingSearch}"
                </div>
              )}
            </div>

            {/* Ingredient list */}
            {form.ingredients.length === 0 ? (
              <div className="aer-ing-empty">
                <Search size={24} />
                <p>Search for ingredients above to add them</p>
              </div>
            ) : (
              <div className="aer-ing-list">
                {form.ingredients.map((ing, idx) => (
                  <div key={idx} className="aer-ing-item">
                    <div className="aer-ing-item-name">
                      <span>{ing.ingredientName}</span>
                      <span className="aer-ing-item-cat">{ing.category}</span>
                    </div>
                    <div className="aer-ing-item-controls">
                      <input
                        type="number" min="0.01" step="0.01"
                        value={ing.quantity}
                        onChange={e => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="aer-ing-qty"
                      />
                      <select
                        value={ing.unit}
                        onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                        className="aer-ing-unit"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="Notes..."
                        value={ing.notes}
                        onChange={e => updateIngredient(idx, 'notes', e.target.value)}
                        className="aer-ing-notes"
                      />
                    </div>
                    <div className="aer-ing-item-footer">
                      <span className="aer-ing-line-cost">
                        ${(parseFloat(ing.unitCost || 0) * parseFloat(ing.quantity || 0)).toFixed(2)}
                      </span>
                      <button
                        className="aer-ing-remove"
                        onClick={() => removeIngredient(idx)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="aer-ing-total">
                  <span>Total ingredient cost</span>
                  <strong>₹{liveCost.toFixed(2)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* ── Cooking Steps ── */}
          <div className="aer-card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <h3 className="aer-card-title" style={{ margin:0 }}>
                Cooking Steps
                <span className="aer-count">{form.steps.length}</span>
              </h3>
              <button className="aer-btn-add-step" onClick={addStep}>
                <Plus size={13}/> Add Step
              </button>
            </div>
            {form.steps.length === 0 ? (
              <div className="aer-steps-empty">
                <ChefHat size={28}/>
                <p>No steps yet. Add cooking instructions so kitchen staff know exactly how to prepare this recipe.</p>
                <button className="aer-btn-add-step-lg" onClick={addStep}>
                  <Plus size={14}/> Add First Step
                </button>
              </div>
            ) : (
              <div className="aer-steps-list">
                {form.steps.map((step, idx) => (
                  <div key={idx} className="aer-step-item">
                    <div className="aer-step-num">{step.stepNumber}</div>
                    <div className="aer-step-body">
                      <div className="aer-step-row">
                        <input
                          className="aer-step-title-input"
                          placeholder="Step title (e.g. Marinate chicken)"
                          value={step.title}
                          onChange={e => updateStep(idx, 'title', e.target.value)}
                        />
                        <input
                          className="aer-step-dur"
                          type="number" min="0" placeholder="min"
                          value={step.durationMinutes}
                          onChange={e => updateStep(idx, 'durationMinutes', e.target.value)}
                        />
                        <span className="aer-step-dur-label">min</span>
                      </div>
                      <textarea
                        className="aer-step-instruction"
                        placeholder="Describe what to do in this step..."
                        value={step.instruction}
                        onChange={e => updateStep(idx, 'instruction', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="aer-step-controls">
                      <button disabled={idx === 0} onClick={() => moveStep(idx, -1)} title="Move up">↑</button>
                      <button disabled={idx === form.steps.length - 1} onClick={() => moveStep(idx, 1)} title="Move down">↓</button>
                      <button className="aer-step-del" onClick={() => removeStep(idx)} title="Remove"><Trash2 size={11}/></button>
                    </div>
                  </div>
                ))}
                <button className="aer-btn-add-step" style={{ alignSelf:'flex-start', marginTop:4 }} onClick={addStep}>
                  <Plus size={13}/> Add Another Step
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .aer-container { max-width:1100px; }
        .aer-topbar { display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap; }
        .aer-page-title { display:flex;align-items:center;gap:8px;font-size:20px;font-weight:800;color:#1f2937;margin:0;flex:1; }
        .aer-topbar-right { display:flex;gap:8px;align-items:center;margin-left:auto; }
        .aer-btn-ghost { display:flex;align-items:center;gap:6px;padding:7px 14px;background:#f0f2f7;border:1px solid #d8dde8;border-radius:8px;font-size:13px;color:#374151;cursor:pointer;white-space:nowrap; }
        .aer-btn-primary { display:flex;align-items:center;gap:6px;padding:8px 18px;background:#e8f0fd;border:1px solid #b3ccf5;border-radius:8px;color:#0052b3;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap; }
        .aer-btn-primary:hover:not(:disabled) { background:#d4e4fb; }
        .aer-btn-primary:disabled { opacity:.6;cursor:not-allowed; }

        .aer-error-banner { display:flex;align-items:center;gap:8px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:13px;margin-bottom:16px; }
        .aer-error-banner button { margin-left:auto;background:none;border:none;color:#dc2626;cursor:pointer;font-size:16px; }

        .aer-grid { display:grid;grid-template-columns:1fr 360px;gap:20px; }
        @media(max-width:900px) { .aer-grid { grid-template-columns:1fr; } }

        .aer-card { background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:20px;margin-bottom:16px; }
        .aer-card-title { font-size:14px;font-weight:700;color:#1f2937;margin:0 0 16px;display:flex;align-items:center;gap:8px; }
        .aer-card-sub { font-size:11px;font-weight:400;color:#9ca3af; }
        .aer-count { background:#f1f5f9;color:#64748b;font-size:11px;padding:1px 6px;border-radius:10px; }

        .aer-field { display:flex;flex-direction:column;gap:5px;margin-bottom:14px; }
        .aer-field:last-child { margin-bottom:0; }
        .aer-field label { font-size:12px;font-weight:600;color:#374151; }
        .aer-field input,.aer-field select,.aer-field textarea { padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;color:#1f2937;background:#fff;outline:none;transition:border-color .15s;width:100%;box-sizing:border-box;font-family:inherit; }
        .aer-field input:focus,.aer-field select:focus,.aer-field textarea:focus { border-color:#0061d2;box-shadow:0 0 0 3px rgba(0,97,210,.1); }
        .aer-field input.error,.aer-field select.error { border-color:#ef4444; }
        .aer-field-error { font-size:11px;color:#ef4444; }
        .aer-field textarea { resize:vertical;min-height:72px; }

        .aer-row { display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px; }
        .aer-row-5 { grid-template-columns:repeat(5,1fr); }
        @media(max-width:700px) { .aer-row-5 { grid-template-columns:repeat(3,1fr); } }

        .aer-tag-group { display:flex;flex-wrap:wrap;gap:6px; }
        .aer-tag-btn { display:flex;align-items:center;gap:4px;padding:5px 10px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:20px;font-size:12px;color:#6b7280;cursor:pointer;transition:all .15s; }
        .aer-tag-btn.active { background:rgba(0,97,210,.1);border-color:#0061d2;color:#0061d2;font-weight:600; }
        .aer-tag-btn:hover:not(.active) { border-color:#d1d5db;color:#374151; }

        /* Cost box */
        .aer-cost-box { background:linear-gradient(135deg,#e8f0fd,#e8f0fd);border:1px solid #b3ccf5;border-radius:16px;padding:20px;margin-bottom:16px; }
        .aer-cost-top { display:flex;align-items:center;gap:12px;margin-bottom:8px; }
        .aer-cost-top svg { color:#0061d2;width:36px;height:36px;flex-shrink:0; }
        .aer-cost-label { font-size:12px;color:#003d99;margin-bottom:2px; }
        .aer-cost-value { font-size:28px;font-weight:800;color:#0052b3; }
        .aer-cost-per { font-size:13px;color:#002d80;margin-bottom:6px; }
        .aer-cost-per strong { color:#0052b3; }
        .aer-cost-note { font-size:11px;color:#003d99;opacity:.7;margin:0; }

        /* Ingredient search */
        .aer-ing-search-wrap { position:relative;margin-bottom:16px; }
        .aer-ing-search { display:flex;align-items:center;gap:8px;padding:9px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px; }
        .aer-ing-search:focus-within { border-color:#0061d2;box-shadow:0 0 0 3px rgba(0,97,210,.1); }
        .aer-ing-search input { border:none;outline:none;font-size:13px;color:#1f2937;flex:1;background:transparent; }
        .aer-ing-dropdown { position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:100;overflow:hidden;max-height:240px;overflow-y:auto; }
        .aer-ing-result { width:100%;display:flex;align-items:center;gap:8px;padding:10px 14px;background:none;border:none;border-bottom:1px solid #f9fafb;cursor:pointer;text-align:left;transition:background .1s; }
        .aer-ing-result:last-child { border-bottom:none; }
        .aer-ing-result:hover { background:#fafafa; }
        .aer-ing-result-name { font-size:13px;font-weight:500;color:#1f2937;flex:1; }
        .aer-ing-result-meta { font-size:11px;color:#9ca3af; }
        .aer-ing-add-icon { color:#0061d2;flex-shrink:0; }
        .aer-ing-no-results { padding:12px 14px;font-size:13px;color:#9ca3af;text-align:center; }

        /* Ingredient list */
        .aer-ing-empty { display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px;color:#9ca3af;text-align:center; }
        .aer-ing-empty p { font-size:13px;margin:0; }
        .aer-ing-list { display:flex;flex-direction:column;gap:10px; }
        .aer-ing-item { background:#fafafa;border:1px solid #f1f5f9;border-radius:10px;padding:12px; }
        .aer-ing-item-name { display:flex;align-items:center;gap:8px;margin-bottom:8px; }
        .aer-ing-item-name span { font-size:13px;font-weight:600;color:#1f2937; }
        .aer-ing-item-cat { font-size:11px;color:#9ca3af;background:#f1f5f9;padding:1px 6px;border-radius:4px; }
        .aer-ing-item-controls { display:grid;grid-template-columns:70px 70px 1fr;gap:6px; }
        .aer-ing-qty,.aer-ing-unit,.aer-ing-notes { padding:6px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#1f2937;background:#fff;outline:none;width:100%;box-sizing:border-box;font-family:inherit; }
        .aer-ing-qty:focus,.aer-ing-unit:focus,.aer-ing-notes:focus { border-color:#0061d2; }
        .aer-ing-item-footer { display:flex;align-items:center;justify-content:space-between;margin-top:8px; }
        .aer-ing-line-cost { font-size:13px;font-weight:700;color:#0061d2; }
        .aer-ing-remove { width:26px;height:26px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.15);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#ef4444;transition:all .15s; }
        .aer-ing-remove:hover { background:rgba(239,68,68,.15); }
        .aer-ing-total { display:flex;justify-content:space-between;align-items:center;padding:12px 0 0;border-top:2px solid #e5e7eb;margin-top:8px;font-size:14px;font-weight:700;color:#1f2937; }
        .aer-ing-total strong { color:#0061d2; }

        /* Steps */
        .aer-btn-add-step { display:flex;align-items:center;gap:5px;padding:6px 12px;background:rgba(0,97,210,.08);border:1px solid rgba(0,97,210,.15);border-radius:8px;font-size:12px;font-weight:600;color:#0061d2;cursor:pointer; }
        .aer-btn-add-step:hover { background:rgba(0,97,210,.14); }
        .aer-btn-add-step-lg { padding:8px 16px;background:#e8f0fd;border:1px dashed #3385e0;border-radius:8px;font-size:13px;font-weight:600;color:#0061d2;cursor:pointer;margin-top:6px; }
        .aer-steps-empty { display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;text-align:center;color:#9ca3af; }
        .aer-steps-empty p { font-size:13px;margin:0;max-width:280px; }
        .aer-steps-list { display:flex;flex-direction:column;gap:10px; }
        .aer-step-item { display:flex;gap:10px;align-items:flex-start;background:#fafafa;border:1px solid #f1f5f9;border-radius:10px;padding:12px; }
        .aer-step-num { width:26px;height:26px;background:linear-gradient(135deg,#0061d2,#3385e0);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#0052b3;flex-shrink:0;margin-top:2px; }
        .aer-step-body { flex:1;min-width:0; }
        .aer-step-row { display:flex;gap:6px;margin-bottom:6px;align-items:center; }
        .aer-step-title-input { flex:1;padding:7px 10px;border:1px solid #e5e7eb;border-radius:7px;font-size:13px;font-weight:600;color:#1f2937;background:#fff;outline:none;font-family:inherit; }
        .aer-step-title-input:focus { border-color:#0061d2; }
        .aer-step-dur { width:56px;padding:7px 8px;border:1px solid #e5e7eb;border-radius:7px;font-size:12px;text-align:center;color:#1f2937;background:#fff;outline:none;font-family:inherit; }
        .aer-step-dur:focus { border-color:#0061d2; }
        .aer-step-dur-label { font-size:11px;color:#9ca3af;white-space:nowrap; }
        .aer-step-instruction { width:100%;padding:8px 10px;border:1px solid #e5e7eb;border-radius:7px;font-size:13px;color:#1f2937;background:#fff;outline:none;resize:vertical;font-family:inherit;min-height:70px;box-sizing:border-box; }
        .aer-step-instruction:focus { border-color:#0061d2; }
        .aer-step-controls { display:flex;flex-direction:column;gap:3px;flex-shrink:0; }
        .aer-step-controls button { width:24px;height:24px;background:#f0f2f7;border:1px solid #e5e7eb;border-radius:5px;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#6b7280; }
        .aer-step-controls button:hover:not(:disabled) { background:#e2e6ef;color:#1f2937; }
        .aer-step-controls button:disabled { opacity:.3;cursor:not-allowed; }
        .aer-step-del { background:rgba(239,68,68,.08) !important;border-color:rgba(239,68,68,.2) !important;color:#ef4444 !important; }
        .aer-step-del:hover { background:rgba(239,68,68,.15) !important; }

        .spin { animation:aer-spin .8s linear infinite; }
        @keyframes aer-spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AddEditRecipe;