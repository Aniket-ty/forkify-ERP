import api from './api';

const productionService = {
  // Preview deductions before confirming
  preview: (recipeId, servings, branchId) =>
    api.get('/production/preview', { params: { recipeId, servings, branchId } }),

  // Log production (auto-deducts inventory)
  logProduction: (data, branchId) =>
    api.post('/production', data, { params: { branchId } }),

  // Production history
  getHistory: (branchId, date, recipeId) =>
    api.get('/production', { params: { branchId, date, recipeId } }),

  // Finished good stock levels — availableServings per recipe per branch
  // Used by QR orders panel to determine if direct sale or production needed
  getStock: (branchId) =>
    api.get('/production/stock', { params: { branchId } }),
};

export default productionService;

