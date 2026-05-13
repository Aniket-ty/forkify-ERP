import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Package, IndianRupee, Trash2, Store, Truck, TrendingUp } from 'lucide-react';
import usePermission from '../../../hooks/usePermission';

const TABS = [
  { to: 'inventory', label: 'Inventory',        icon: Package    },
  { to: 'cost',      label: 'Cost & Margins',    icon: IndianRupee },
  { to: 'wastage',   label: 'Wastage',           icon: Trash2     },
  { to: 'sales',     label: 'Sales',             icon: TrendingUp },
  { to: 'branches',  label: 'Branch Comparison', icon: Store,   hqOnly: true },
  { to: 'suppliers', label: 'Suppliers',         icon: Truck      },
];

const ReportsLayout = () => {
  const { isHQ } = usePermission();
  return (
    <div className="rly-wrap">
      <div className="rly-header">
        <h1 className="rly-title"><BarChart3 size={22} /> Reports & Analytics</h1>
        <p className="rly-sub">Analyze inventory, cost, wastage and procurement data</p>
      </div>

      <div className="rly-tabs">
        {TABS.filter(t => !t.hqOnly || isHQ).map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => `rly-tab ${isActive ? 'active' : ''}`}
          >
            <t.icon size={14} />{t.label}
          </NavLink>
        ))}
      </div>

      <div className="rly-content"><Outlet /></div>

      <style>{`
        .rly-header { margin-bottom:18px; }
        .rly-title { display:flex;align-items:center;gap:8px;font-size:20px;font-weight:700;color:#1f2937;margin:0 0 4px; }
        .rly-sub { font-size:13px;color:#6b7280;margin:0; }
        .rly-tabs { display:flex;gap:4px;margin-bottom:20px;flex-wrap:wrap;background:#f8fafc;padding:4px;border-radius:12px;width:fit-content;border:1px solid #e5e7eb; }
        .rly-tab { display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:13px;font-weight:500;color:#6b7280;text-decoration:none;transition:all .15s; }
        .rly-tab:hover { color:#1f2937; }
        .rly-tab.active { background:#fff;color:#0061d2;font-weight:600;box-shadow:0 1px 4px #e2e6ef; }
      `}</style>
    </div>
  );
};

export default ReportsLayout;