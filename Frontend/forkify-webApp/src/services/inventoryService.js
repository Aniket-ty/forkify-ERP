import api from './api';

const inventoryService = {
  getSummary:       (branchId)        => api.get('/inventory/summary',      { params: { branchId } }),
  getAll:           (branchId)        => api.get('/inventory',               { params: { branchId } }),
  getLowStock:      (branchId)        => api.get('/inventory/low-stock',     { params: { branchId } }),
  getExpiring:      (branchId, days)  => api.get('/inventory/expiring',      { params: { branchId, days } }),
  upsertItem:       (data, branchId)  => api.post('/inventory',              data, { params: { branchId } }),
  stockIn:          (data, branchId)  => api.post('/inventory/stock-in',     data, { params: { branchId } }),
  getTransactions:  (branchId, type)  => api.get('/inventory/transactions',  { params: { branchId, type } }),
  getWastage:       (branchId, status) => api.get('/inventory/wastage',      { params: { branchId, status } }),
  logWastage:       (data, branchId)  => api.post('/inventory/wastage',      data, { params: { branchId } }),
  approveWastage:   (id)              => api.put(`/inventory/wastage/${id}/approve`),
  rejectWastage:    (id)              => api.put(`/inventory/wastage/${id}/reject`),
};

export default inventoryService;