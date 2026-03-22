import api from './api';

export const salesService = {
  logSales:  (data, branchId) => api.post('/sales', data, { params: { branchId } }),
  getSales:  (branchId, date) => api.get('/sales', { params: { branchId, date } }),
};

export const dashboardService = {
  get: (branchId) => api.get('/dashboard', { params: { branchId } }),
};
