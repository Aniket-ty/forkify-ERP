import { useSelector } from 'react-redux';

/**
 * usePermission
 *
 * Returns helper booleans and the raw user object so any component
 * can gate content or navigation by role / branch.
 *
 * Usage:
 *   const { isAdmin, isHQ, isBranchManager, branchId } = usePermission();
 *   if (!isHQ) return <Redirect to="/fooderp/dashboard" />;
 */
const usePermission = () => {
  const { user } = useSelector((state) => state.auth);

  const role     = user?.role || '';
  const branchId = user?.branchId || null;

  return {
    user,

    // Role checks
    isAdmin:         role === 'ROLE_ADMIN',
    isManager:       role === 'ROLE_MANAGER',
    isStaff:         role === 'ROLE_STAFF',
    isUser:          role === 'ROLE_USER',

    // HQ = admin with no branch assigned, or explicit HQ branch
    // Admins are always considered HQ-level regardless of branch
    isHQ:            role === 'ROLE_ADMIN',

    // Branch-level management
    isBranchManager: role === 'ROLE_MANAGER',

    // Any authenticated operational role
    isOperational:   ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'].includes(role),

    // Can approve things (wastage, indents, etc.)
    canApprove:      ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role),

    // Can create / edit master data (recipes, menu, vendors)
    canEditMasterData: role === 'ROLE_ADMIN',

    // Branch context
    branchId,
    branchName: user?.branchName || null,

    // Check if user belongs to a specific branch
    isBranch: (id) => branchId === id,

    // Can access a given branch's data
    // Admins see everything; managers/staff only see their own branch
    canAccessBranch: (id) => role === 'ROLE_ADMIN' || branchId === id,
  };
};

export default usePermission;