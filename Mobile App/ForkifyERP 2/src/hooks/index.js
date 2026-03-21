// src/hooks/index.js

import { useSelector, useDispatch } from 'react-redux';
import { setActiveBranch } from '../store';

// ── usePermission ─────────────────────────────────────────────────────────────
export const usePermission = () => {
  const { user } = useSelector((state) => state.auth);
  const role     = user?.role || '';
  const branchId = user?.branchId || null;

  return {
    user,
    isAdmin:           role === 'ROLE_ADMIN',
    isManager:         role === 'ROLE_MANAGER',
    isStaff:           role === 'ROLE_STAFF',
    isUser:            role === 'ROLE_USER',
    isHQ:              role === 'ROLE_ADMIN',
    isBranchManager:   role === 'ROLE_MANAGER',
    isOperational:     ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'].includes(role),
    canApprove:        ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role),
    canEditMasterData: role === 'ROLE_ADMIN',
    branchId,
    branchName:        user?.branchName || null,
    isBranch:          (id) => branchId === id,
    canAccessBranch:   (id) => role === 'ROLE_ADMIN' || branchId === id,
  };
};

// ── useBranch ─────────────────────────────────────────────────────────────────
export const useBranch = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return {
    branchId:   user?.branchId   || null,
    branchName: user?.branchName || 'Head Office',
    isHQBranch: user?.role === 'ROLE_ADMIN',
    role:       user?.role || '',
    switchBranch: (id, name) => dispatch(setActiveBranch({ branchId: id, branchName: name })),
  };
};

// ── useRoleLabel ──────────────────────────────────────────────────────────────
export const useRoleLabel = (role) => {
  const map = {
    ROLE_ADMIN:   'Super Admin',
    ROLE_MANAGER: 'Branch Manager',
    ROLE_STAFF:   'Kitchen Staff',
    ROLE_USER:    'Inventory Clerk',
  };
  return map[role] || role;
};
