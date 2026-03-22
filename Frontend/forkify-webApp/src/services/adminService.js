import api from './api';

const adminService = {
  // Users
  getAllUsers:   (params = {}) => api.get('/admin/users', { params }),
  getUserById:   (id)          => api.get(`/admin/users/${id}`),
  createUser:    (data)        => api.post('/admin/users', data),
  updateUser:    (id, data)    => api.put(`/admin/users/${id}`, data),
  disableUser:   (id)          => api.delete(`/admin/users/${id}`),
  enableUser:    (id)          => api.put(`/admin/users/${id}/enable`),

  // Branch summary
  getBranchSummary: () => api.get('/admin/branches/summary'),

  // Audit logs
  getAuditLogs: (params = {}) => api.get('/admin/audit-logs', { params }),

  // Setup
  setup: (data) => api.post('/admin/setup', data),
};

export default adminService;
