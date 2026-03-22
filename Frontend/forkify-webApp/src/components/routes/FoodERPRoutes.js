import { Routes, Route, Navigate } from 'react-router-dom';
import RoleRoute from '../routes/RoleRoute';

// Core
import Dashboard from '../Pages/Dashboard';

// Menu — Phase 9
import ActiveMenu    from '../Pages/Menu/ActiveMenu';
import SeasonalMenus from '../Pages/Menu/SeasonalMenus';
import BranchPricing from '../Pages/Menu/BranchPricing';

// Sales — Phase 10
import DailySales from '../Pages/Sales/DailySales';

// Inventory
import InventoryManagement from '../Pages/Inventory/inventoryManagement';
import RawMaterials        from '../Pages/Inventory/RawMaterials';
import FinishedGoods       from '../Pages/Inventory/FinishedGoods';
import StockIn             from '../Pages/Inventory/StockIn';
import StockOut            from '../Pages/Inventory/StockOut';
import Wastage             from '../Pages/Inventory/Wastage';

// Recipes
import RecipeLayout    from '../Pages/Recipes/index';
import RecipeList      from '../Pages/Recipes/RecipeList';
import RecipeDetail    from '../Pages/Recipes/RecipeDetail';
import AddEditRecipe   from '../Pages/Recipes/AddEditRecipe';
import RecipeNutrition from '../Pages/Recipes/RecipeNutrition';
import IngredientList  from '../Pages/Ingredients/IngredientList';
import LogProduction   from '../Pages/Recipes/LogProduction';

// Meal Planning
import MealPlanner        from '../Pages/MealPlanning/MealPlanner';
import IngredientForecast from '../Pages/MealPlanning/IngredientForecast';
import PushToBranches     from '../Pages/MealPlanning/PushToBranches';

// Procurement — Phase 6
import SupplierManagement from '../Pages/Procurement/SupplierManagement';
import MaterialIndent     from '../Pages/Procurement/MaterialIndent';
import GoodsReceived      from '../Pages/Procurement/GoodsReceived';
import PurchaseOrders     from '../Pages/Procurement/index';
import ApprovedVendors    from '../Pages/Procurement/ApprovedVendors';

// Admin — Phase 7
import UserManagement  from '../Pages/Admin/UserManagement';
import AuditLogs       from '../Pages/Admin/AuditLogs';
import BranchManagement from '../Pages/Admin/BranchManagement';

// Reports
import ReportsLayout    from '../Pages/Reports';
import InventoryReport from '../Pages/Reports/InventoryReport';
import CostReport      from '../Pages/Reports/CostReport';
import WastageReport   from '../Pages/Reports/WastageReport';
import BranchComparison from '../Pages/Reports/BranchComparison';
import SupplierReport  from '../Pages/Reports/SupplierReport';
import SalesReport     from '../Pages/Reports/SalesReport';

// New Features
import Analytics          from '../Pages/Analytics/Analytics';
import AllergenMatrix     from '../Pages/Recipes/AllergenMatrix';
import RecipeVersionHistory from '../Pages/Recipes/RecipeVersionHistory';
import CustomerCRM        from '../Pages/Customers/CustomerCRM';
import StockTransfers     from '../Pages/Inventory/StockTransfers';
import ShiftScheduler     from '../Pages/Staff/ShiftScheduler';

const ComingSoon = ({ page }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '60vh', gap: 12,
    fontFamily: 'DM Sans, sans-serif',
  }}>
    <div style={{ fontSize: 40 }}>🚧</div>
    <h2 style={{ margin: 0, fontSize: 18, color: 'rgba(255,255,255,0.6)' }}>{page}</h2>
    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
      Coming in the next phase
    </p>
  </div>
);

const FoodERPRoutes = () => (
  <Routes>

    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />

    <Route path="analytics" element={
      <RoleRoute allowedRoles={['ROLE_ADMIN']}>
        <Analytics />
      </RoleRoute>
    } />

    {/* ── Inventory ── */}
    <Route path="inventory" element={<InventoryManagement />}>
      <Route index element={<Navigate to="raw-materials" replace />} />
      <Route path="raw-materials"  element={<RawMaterials />} />
      <Route path="finished-goods" element={<FinishedGoods />} />
      <Route path="stock-in"       element={<StockIn />} />
      <Route path="stock-out"      element={<StockOut />} />
      <Route path="wastage"        element={<Wastage />} />
      <Route path="transfers"      element={
        <RoleRoute allowedRoles={['ROLE_ADMIN']}>
          <StockTransfers />
        </RoleRoute>
      } />
    </Route>

    {/* ── Recipe Version History ── */}
    <Route path="recipes/:id/versions" element={<RecipeVersionHistory />} />

    {/* ── Recipes ── */}
    <Route path="recipes/add"            element={<AddEditRecipe />} />
    <Route path="recipes/:id/edit"       element={<AddEditRecipe />} />
    <Route path="recipes/:id/produce"    element={<LogProduction />} />
    <Route path="recipes/:id"            element={<RecipeDetail />} />
    <Route path="recipes" element={<RecipeLayout />}>
      <Route index element={<Navigate to="list" replace />} />
      <Route path="list"        element={<RecipeList />} />
      <Route path="nutrition"   element={<RecipeNutrition />} />
      <Route path="ingredients" element={
        <RoleRoute allowedRoles={['ROLE_ADMIN']}>
          <IngredientList />
        </RoleRoute>
      } />
      <Route path="allergens"  element={<AllergenMatrix />} />
      <Route path="versions"   element={<ComingSoon page="Version History" />} />
    </Route>

    {/* ── Menu ── */}
    <Route path="menu">
      <Route index element={<Navigate to="active" replace />} />
      <Route path="active"   element={<ActiveMenu />} />
      <Route path="seasonal" element={
        <RoleRoute allowedRoles={['ROLE_ADMIN']}>
          <SeasonalMenus />
        </RoleRoute>
      } />
      <Route path="pricing"  element={<BranchPricing />} />
    </Route>

    {/* ── Meal Planning ── */}
    <Route path="meal-planning">
      <Route index element={<Navigate to="weekly" replace />} />
      <Route path="weekly"   element={<MealPlanner />} />
      <Route path="forecast" element={<IngredientForecast />} />
      <Route path="push"     element={
        <RoleRoute allowedRoles={['ROLE_ADMIN']}>
          <PushToBranches />
        </RoleRoute>
      } />
    </Route>

    {/* ── Procurement — Phase 6 ── */}
    <Route path="procurement">
      <Route index element={<Navigate to="orders" replace />} />
      <Route path="indent"    element={<MaterialIndent />} />
      <Route path="orders"    element={<PurchaseOrders />} />
      <Route path="suppliers" element={<SupplierManagement />} />
      <Route path="grn"       element={<GoodsReceived />} />
      <Route path="vendors"   element={
        <RoleRoute allowedRoles={['ROLE_ADMIN']}>
          <ApprovedVendors />
        </RoleRoute>
      } />
    </Route>

    {/* ── People & Branches — Phase 7 ── */}
    <Route path="users"    element={
      <RoleRoute allowedRoles={['ROLE_ADMIN']}>
        <UserManagement />
      </RoleRoute>
    } />
    <Route path="branches" element={
      <RoleRoute allowedRoles={['ROLE_ADMIN']}>
        <BranchManagement />
      </RoleRoute>
    } />
    <Route path="compliance" element={
      <RoleRoute allowedRoles={['ROLE_ADMIN']}>
        <ComingSoon page="Compliance Center" />
      </RoleRoute>
    } />

    {/* ── Reports ── */}
    <Route path="reports" element={<ReportsLayout />}>
      <Route index element={<Navigate to="inventory" replace />} />
      <Route path="inventory" element={<InventoryReport />} />
      <Route path="cost"      element={<CostReport />} />
      <Route path="wastage"   element={<WastageReport />} />
      <Route path="sales"     element={<SalesReport />} />
      <Route path="branches"  element={
        <RoleRoute allowedRoles={['ROLE_ADMIN']}>
          <BranchComparison />
        </RoleRoute>
      } />
      <Route path="suppliers" element={<SupplierReport />} />
    </Route>

    {/* ── Sales — Phase 10 ── */}
    <Route path="sales" element={<DailySales />} />

    {/* ── Customer CRM ── */}
    <Route path="customers" element={<CustomerCRM />} />

    {/* ── Staff Scheduling ── */}
    <Route path="staff/shifts" element={
      <RoleRoute allowedRoles={['ROLE_ADMIN','ROLE_MANAGER']}>
        <ShiftScheduler />
      </RoleRoute>
    } />

    {/* ── Audit — Phase 7 ── */}
    <Route path="audit" element={
      <RoleRoute allowedRoles={['ROLE_ADMIN']}>
        <AuditLogs />
      </RoleRoute>
    } />

    {/* Legacy redirects */}
    <Route path="inventoryManagement"   element={<Navigate to="/fooderp/inventory"  replace />} />
    <Route path="inventoryManagement/*" element={<Navigate to="/fooderp/inventory"  replace />} />
    <Route path="recipesAndNutrition"   element={<Navigate to="/fooderp/recipes"    replace />} />
    <Route path="recipesAndNutrition/*" element={<Navigate to="/fooderp/recipes"    replace />} />

    <Route path="*" element={<Navigate to="dashboard" replace />} />
  </Routes>
);

export default FoodERPRoutes;