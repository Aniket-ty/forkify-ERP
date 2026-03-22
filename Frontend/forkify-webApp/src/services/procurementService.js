// ── procurementService.js ─────────────────────────────────────────────────────
import api from './api';

const procurementService = {
  // Suppliers
  getSuppliers:      (branchId)    => api.get('/suppliers',          { params: { branchId } }),
  createSupplier:    (data, bId)   => api.post('/suppliers',   data, { params: { branchId: bId } }),
  updateSupplier:    (id, data)    => api.put(`/suppliers/${id}`, data),
  deleteSupplier:    (id)          => api.delete(`/suppliers/${id}`),
  getApprovedVendors: ()           => api.get('/suppliers/approved'),
  approveVendor:     (id)          => api.put(`/suppliers/${id}/approve`),

  // Material Indents
  getIndents:        (branchId, status) => api.get('/indents',       { params: { branchId, status } }),
  createIndent:      (data, bId)   => api.post('/indents',     data, { params: { branchId: bId } }),
  approveIndent:     (id)          => api.put(`/indents/${id}/approve`),
  rejectIndent:      (id, reason)  => api.put(`/indents/${id}/reject`, { reason }),
  convertToPO:       (id, supplierId) => api.post(`/indents/${id}/convert-to-po`, null, { params: { supplierId } }),

  // Purchase Orders
  getPOs:            (branchId, status) => api.get('/purchase-orders', { params: { branchId, status } }),
  getPOById:         (id)          => api.get(`/purchase-orders/${id}`),
  createPO:          (data, bId)   => api.post('/purchase-orders', data, { params: { branchId: bId } }),
  updatePOStatus:    (id, status)  => api.put(`/purchase-orders/${id}/status`, { status }),

  // GRN
  getGRNs:           (branchId)    => api.get('/grn',                { params: { branchId } }),
  createGRN:         (data, bId)   => api.post('/grn',         data, { params: { branchId: bId } }),
  confirmGRN:        (id)          => api.put(`/grn/${id}/confirm`),
};

export default procurementService;
