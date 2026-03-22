import api from './api';

const mealPlanService = {
  getAll:    (params = {}) => api.get('/meal-plans', { params }),
  getById:   (id)          => api.get(`/meal-plans/${id}`),
  create:    (data, branchId) => api.post('/meal-plans', data, { params: { branchId } }),
  update:    (id, data)    => api.put(`/meal-plans/${id}`, data),
  delete:    (id)          => api.delete(`/meal-plans/${id}`),

  pushToBranches: (id, branchIds) =>
    api.post(`/meal-plans/${id}/push-to-branches`, branchIds || []),

  getForecast:     (id, branchId) =>
    api.get(`/meal-plans/${id}/forecast`, { params: { branchId } }),

  getShortage:     (id, branchId) =>
    api.get(`/meal-plans/${id}/shortage`, { params: { branchId } }),

  getShoppingList: (id, branchId) =>
    api.get(`/meal-plans/${id}/shopping-list`, { params: { branchId } }),
};

export default mealPlanService;
