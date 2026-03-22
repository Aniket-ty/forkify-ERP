import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * RoleRoute
 *
 * Protects a route by role. If the user's role is not in the `allowedRoles`
 * array they are redirected to the dashboard instead of seeing the page.
 *
 * Usage:
 *   <Route
 *     path="users"
 *     element={
 *       <RoleRoute allowedRoles={['ROLE_ADMIN']}>
 *         <UserManagement />
 *       </RoleRoute>
 *     }
 *   />
 */
const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Silently redirect to dashboard — don't show a 403 page
    return <Navigate to="/fooderp/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;