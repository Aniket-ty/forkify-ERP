// src/services/index.js — All API services

import api from './api';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login:    (username, password) => api.post('/auth/login', { username, password }),
  register: (data)               => api.post('/auth/register', data),
  getMe:    ()                   => api.get('/auth/me'),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  get: (branchId) => api.get('/dashboard', { params: { branchId } }),
};

export const salesService = {
  logSales: (data, branchId) => api.post('/sales', data, { params: { branchId } }),
  getSales: (branchId, date) => api.get('/sales', { params: { branchId, date } }),
};

// ── Recipes ───────────────────────────────────────────────────────────────────
export const recipeService = {
  getAll:                  (params = {})    => api.get('/recipes', { params }),
  getById:                 (id)             => api.get(`/recipes/${id}`),
  getCost:                 (id, servings)   => api.get(`/recipes/${id}/cost`, { params: { servings } }),
  create:                  (data)           => api.post('/recipes', data),
  update:                  (id, data)       => api.put(`/recipes/${id}`, data),
  delete:                  (id)             => api.delete(`/recipes/${id}`),
  getCategories:           ()               => api.get('/recipes/categories'),
  getAllIngredients:        (params = {})    => api.get('/ingredients', { params }),
  getIngredientById:       (id)             => api.get(`/ingredients/${id}`),
  createIngredient:        (data)           => api.post('/ingredients', data),
  updateIngredient:        (id, data)       => api.put(`/ingredients/${id}`, data),
  deleteIngredient:        (id)             => api.delete(`/ingredients/${id}`),
  getIngredientCategories: ()               => api.get('/ingredients/categories'),
};

// ── Inventory ─────────────────────────────────────────────────────────────────
export const inventoryService = {
  getSummary:      (branchId)          => api.get('/inventory/summary',    { params: { branchId } }),
  getAll:          (branchId)          => api.get('/inventory',             { params: { branchId } }),
  getLowStock:     (branchId)          => api.get('/inventory/low-stock',   { params: { branchId } }),
  getExpiring:     (branchId, days)    => api.get('/inventory/expiring',    { params: { branchId, days } }),
  upsertItem:      (data, branchId)    => api.post('/inventory',            data, { params: { branchId } }),
  stockIn:         (data, branchId)    => api.post('/inventory/stock-in',   data, { params: { branchId } }),
  getTransactions: (branchId, type)    => api.get('/inventory/transactions',{ params: { branchId, type } }),
  getWastage:      (branchId, status)  => api.get('/inventory/wastage',     { params: { branchId, status } }),
  logWastage:      (data, branchId)    => api.post('/inventory/wastage',    data, { params: { branchId } }),
  approveWastage:  (id)                => api.put(`/inventory/wastage/${id}/approve`),
  rejectWastage:   (id)                => api.put(`/inventory/wastage/${id}/reject`),
};

// ── Procurement ───────────────────────────────────────────────────────────────
export const procurementService = {
  getSuppliers:       (branchId)          => api.get('/suppliers',              { params: { branchId } }),
  createSupplier:     (data, bId)         => api.post('/suppliers',       data,  { params: { branchId: bId } }),
  updateSupplier:     (id, data)          => api.put(`/suppliers/${id}`,  data),
  deleteSupplier:     (id)                => api.delete(`/suppliers/${id}`),
  getApprovedVendors: ()                  => api.get('/suppliers/approved'),
  approveVendor:      (id)               => api.put(`/suppliers/${id}/approve`),
  getIndents:         (branchId, status) => api.get('/indents',              { params: { branchId, status } }),
  createIndent:       (data, bId)        => api.post('/indents',        data, { params: { branchId: bId } }),
  approveIndent:      (id)               => api.put(`/indents/${id}/approve`),
  rejectIndent:       (id, reason)       => api.put(`/indents/${id}/reject`, { reason }),
  convertToPO:        (id, supplierId)   => api.post(`/indents/${id}/convert-to-po`, null, { params: { supplierId } }),
  getPOs:             (branchId, status) => api.get('/purchase-orders',     { params: { branchId, status } }),
  getPOById:          (id)               => api.get(`/purchase-orders/${id}`),
  createPO:           (data, bId)        => api.post('/purchase-orders', data, { params: { branchId: bId } }),
  updatePOStatus:     (id, status)       => api.put(`/purchase-orders/${id}/status`, { status }),
  getGRNs:            (branchId)         => api.get('/grn',                   { params: { branchId } }),
  createGRN:          (data, bId)        => api.post('/grn',            data, { params: { branchId: bId } }),
  confirmGRN:         (id)               => api.put(`/grn/${id}/confirm`),
};

// ── Menu ──────────────────────────────────────────────────────────────────────
export const menuService = {
  getAll:           (activeOnly = false)        => api.get('/menus', { params: { activeOnly } }),
  getById:          (id)                        => api.get(`/menus/${id}`),
  create:           (data)                      => api.post('/menus', data),
  update:           (id, data)                  => api.put(`/menus/${id}`, data),
  activate:         (id)                        => api.put(`/menus/${id}/activate`),
  deactivate:       (id)                        => api.put(`/menus/${id}/deactivate`),
  push:             (id)                        => api.post(`/menus/${id}/push`),
  delete:           (id)                        => api.delete(`/menus/${id}`),
  getBranchPricing: (menuId, branchId)          => api.get(`/menus/${menuId}/pricing`, { params: { branchId } }),
  saveBranchPrice:  (itemId, branchId, price, available) =>
    api.put(`/menus/items/${itemId}/pricing`, null, { params: { branchId, price, available } }),
};

// ── Meal Planning ─────────────────────────────────────────────────────────────
export const mealPlanService = {
  getAll:          (params = {})       => api.get('/meal-plans', { params }),
  getById:         (id)                => api.get(`/meal-plans/${id}`),
  create:          (data, branchId)    => api.post('/meal-plans', data, { params: { branchId } }),
  update:          (id, data)          => api.put(`/meal-plans/${id}`, data),
  delete:          (id)                => api.delete(`/meal-plans/${id}`),
  pushToBranches:  (id, branchIds)     => api.post(`/meal-plans/${id}/push-to-branches`, branchIds || []),
  getForecast:     (id, branchId)      => api.get(`/meal-plans/${id}/forecast`, { params: { branchId } }),
  getShoppingList: (id, branchId)      => api.get(`/meal-plans/${id}/shopping-list`, { params: { branchId } }),
};

// ── Production ────────────────────────────────────────────────────────────────
export const productionService = {
  preview:      (recipeId, servings, branchId) => api.get('/production/preview', { params: { recipeId, servings, branchId } }),
  logProduction:(data, branchId)               => api.post('/production', data, { params: { branchId } }),
  getHistory:   (branchId, date, recipeId)     => api.get('/production', { params: { branchId, date, recipeId } }),
  // Finished good stock levels — availableServings per recipe per branch
  // Used by QR orders panel to determine if direct sale or production needed
  getStock:     (branchId)                     => api.get('/production/stock', { params: { branchId } }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminService = {
  getAllUsers:       (params = {}) => api.get('/admin/users', { params }),
  createUser:        (data)        => api.post('/admin/users', data),
  updateUser:        (id, data)    => api.put(`/admin/users/${id}`, data),
  disableUser:       (id)          => api.delete(`/admin/users/${id}`),
  enableUser:        (id)          => api.put(`/admin/users/${id}/enable`),
  getBranchSummary:  ()            => api.get('/admin/branches/summary'),
  getAuditLogs:      (params = {}) => api.get('/admin/audit-logs', { params }),
};

// ── Branches ──────────────────────────────────────────────────────────────────
export const branchService = {
  getAll:     ()           => api.get('/branches'),
  getById:    (id)         => api.get(`/branches/${id}`),
  create:     (data)       => api.post('/branches', data),
  update:     (id, data)   => api.put(`/branches/${id}`, data),
  deactivate: (id)         => api.delete(`/branches/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationService = {
  getAll: (branchId) => api.get('/notifications', { params: { branchId } }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsService = {
  getOverview: (branchId, days = 30) => api.get('/analytics/overview',  { params: { branchId, days } }),
  getFoodCost: (branchId, days = 30) => api.get('/analytics/food-cost', { params: { branchId, days } }),
};

// ── Allergens ─────────────────────────────────────────────────────────────────
export const allergenService = {
  getMatrix:    (category, status) => api.get('/allergens/matrix', { params: { category, status } }),
  getForRecipe: (id)               => api.get(`/allergens/recipe/${id}`),
  getList:      ()                 => api.get('/allergens/list'),
};

// ── Recipe Versions ───────────────────────────────────────────────────────────
export const recipeVersionService = {
  getVersions:  (recipeId)           => api.get(`/recipe-versions/${recipeId}`),
  saveSnapshot: (recipeId, summary)  => api.post(`/recipe-versions/${recipeId}/snapshot`, { summary }),
  restore:      (recipeId, version)  => api.put(`/recipe-versions/${recipeId}/restore/${version}`),
};

// ── Customer CRM ──────────────────────────────────────────────────────────────
export const customerService = {
  getAll:       (branchId, q)   => api.get('/customers', { params: { branchId, q } }),
  getById:      (id)             => api.get(`/customers/${id}`),
  create:       (data)           => api.post('/customers', data),
  update:       (id, data)       => api.put(`/customers/${id}`, data),
  addPoints:    (id, points)     => api.put(`/customers/${id}/add-points`, { points }),
  redeemPoints: (id, points)     => api.put(`/customers/${id}/redeem-points`, { points }),
  recordVisit:  (id, spend)      => api.put(`/customers/${id}/record-visit`, { spend }),
  getBirthdays: (month)          => api.get('/customers/birthdays', { params: { month } }),
  getStats:     (branchId)       => api.get('/customers/stats', { params: { branchId } }),
};

// ── Transfers ─────────────────────────────────────────────────────────────────
export const transferService = {
  getAll:   (branchId, status) => api.get('/transfers', { params: { branchId, status } }),
  create:   (data)              => api.post('/transfers', data),
  approve:  (id)                => api.put(`/transfers/${id}/approve`),
  dispatch: (id)                => api.put(`/transfers/${id}/dispatch`),
  receive:  (id)                => api.put(`/transfers/${id}/receive`),
  cancel:   (id)                => api.put(`/transfers/${id}/cancel`),
};

// ── Shifts ────────────────────────────────────────────────────────────────────
export const shiftService = {
  getAll:   (branchId, from, to) => api.get('/shifts',    { params: { branchId, from, to } }),
  getMy:    (from, to)            => api.get('/shifts/my', { params: { from, to } }),
  create:   (data)                => api.post('/shifts', data),
  update:   (id, data)            => api.put(`/shifts/${id}`, data),
  clockIn:  (id)                  => api.put(`/shifts/${id}/clock-in`),
  clockOut: (id)                  => api.put(`/shifts/${id}/clock-out`),
  delete:   (id)                  => api.delete(`/shifts/${id}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportService = {
  getInventory: (branchId, params) => api.get('/reports/inventory', { params: { branchId, ...params } }),
  getCost:      (branchId, params) => api.get('/reports/cost',      { params: { branchId, ...params } }),
  getWastage:   (branchId, params) => api.get('/reports/wastage',   { params: { branchId, ...params } }),
  getSales:     (branchId, params) => api.get('/reports/sales',     { params: { branchId, ...params } }),
  getBranches:  (params)           => api.get('/reports/branches',  { params }),
  getSupplier:  (branchId, params) => api.get('/reports/supplier',  { params: { branchId, ...params } }),
};
