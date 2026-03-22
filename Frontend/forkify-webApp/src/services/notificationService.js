import api from './api';

const notificationService = {
  /**
   * Fetch real-time notifications for the current user's branch.
   * Returns: low stock alerts, expiry warnings, pending wastage approvals, draft POs.
   */
  getAll: (branchId) =>
    api.get('/notifications', { params: { branchId } }),
};

export default notificationService;