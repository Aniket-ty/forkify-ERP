import { useSelector } from 'react-redux';

/**
 * useBranch
 *
 * Returns the current user's branch context.
 * Admins can override the active branch via the sidebar branch switcher.
 *
 * Usage:
 *   const { branchId, branchName, isHQBranch } = useBranch();
 */
const useBranch = () => {
  const { user } = useSelector((state) => state.auth);

  return {
    branchId:   user?.branchId   || null,
    branchName: user?.branchName || 'Head Office',
    isHQBranch: user?.role === 'ROLE_ADMIN',
    role:       user?.role || '',
  };
};

export default useBranch;