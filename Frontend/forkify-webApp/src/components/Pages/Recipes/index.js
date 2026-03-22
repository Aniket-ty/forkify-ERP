import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ChefHat, List, Calculator, PlusCircle, GitBranch } from 'lucide-react';
import usePermission from '../../../hooks/usePermission';

const RecipeLayout = () => {
  const navigate = useNavigate();
  const { isHQ }  = usePermission();

  return (
    <div className="recipes-layout">

      {/* Header */}
      <div className="rly-header">
        <div>
          <h1 className="rly-title">
            <ChefHat size={24} /> Recipes & Nutrition
          </h1>
          <p className="rly-subtitle">
            Manage your recipe book, costing and nutritional analysis
          </p>
        </div>
        <button
          className="rly-btn-primary"
          onClick={() => navigate('/fooderp/recipes/add')}
        >
          <PlusCircle size={16} /> New Recipe
        </button>
      </div>

      {/* Sub-nav tabs */}
      <div className="rly-tabs">
        <NavLink
          to="list"
          className={({ isActive }) => `rly-tab ${isActive ? 'active' : ''}`}
        >
          <List size={15} /> Recipe List
        </NavLink>
        <NavLink
          to="nutrition"
          className={({ isActive }) => `rly-tab ${isActive ? 'active' : ''}`}
        >
          <Calculator size={15} /> Nutrition & Costing
        </NavLink>
        {isHQ && (
          <NavLink
            to="versions"
            className={({ isActive }) => `rly-tab ${isActive ? 'active' : ''}`}
          >
            <GitBranch size={15} /> Version History
          </NavLink>
        )}
      </div>

      {/* Page content */}
      <div className="rly-content">
        <Outlet />
      </div>

      <style>{`
        .rly-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px; }
        .rly-title { display:flex;align-items:center;gap:10px;font-size:22px;font-weight:800;color:#1f2937;margin:0 0 4px; }
        .rly-subtitle { font-size:13px;color:#6b7280;margin:0; }
        .rly-btn-primary { display:flex;align-items:center;gap:6px;padding:9px 18px;background:#e8f0fd;border:1px solid #b3ccf5;color:#0052b3;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap; }
        .rly-btn-primary:hover { background:#d4e4fb; }
        .rly-tabs { display:flex;gap:4px;margin-bottom:20px;background:#f8fafc;padding:4px;border-radius:12px;width:fit-content;border:1px solid #e5e7eb; }
        .rly-tab { display:flex;align-items:center;gap:6px;padding:7px 16px;border-radius:8px;font-size:13px;font-weight:500;color:#6b7280;text-decoration:none;transition:all .15s;cursor:pointer; }
        .rly-tab:hover { color:#1f2937; }
        .rly-tab.active { background:#fff;color:#0061d2;font-weight:600;box-shadow:0 1px 4px #e2e6ef; }
        .rly-content { }
      `}</style>
    </div>
  );
};

export default RecipeLayout;