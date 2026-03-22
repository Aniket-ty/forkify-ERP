import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import FoodERPSidebar  from './FoodERPSidebar';
import FoodERPHeader   from './FoodERPHeader';
import { logout }      from '../../store/actions/authActions';
import notificationService from '../../services/notificationService';

const PAGE_TITLES = {
  dashboard: 'Dashboard', analytics: 'Analytics',
  inventory: 'Inventory Management', recipes: 'Recipe Book',
  menu: 'Menu Management', 'meal-planning': 'Meal Planning',
  procurement: 'Procurement', users: 'User Management',
  branches: 'Branch Management', reports: 'Reports & Analytics',
  audit: 'Audit Logs', sales: 'Daily Sales', customers: 'Customer CRM',
  'staff': 'Staff Management',
};

const FoodERPLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dispatch = useDispatch();
  const location = useLocation();
  const { user }  = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    if (!user?.branchId) return;
    try {
      const { data } = await notificationService.getAll(user.branchId);
      setNotifications(data || []);
    } catch { /* silent */ }
  }, [user?.branchId]);

  useEffect(() => {
    loadNotifications();
    const iv = setInterval(loadNotifications, 60000);
    return () => clearInterval(iv);
  }, [loadNotifications]);

  const handleLogout = () => dispatch(logout());

  const getPageTitle = () => {
    const seg = location.pathname.replace('/fooderp/', '').split('/')[0];
    return PAGE_TITLES[seg] || 'Dashboard';
  };

  const getBreadcrumbs = () => {
    const segs = location.pathname.replace('/fooderp/', '').split('/').filter(Boolean);
    const crumbs = [{ label: 'Home', path: '/fooderp/dashboard' }];
    let built = '/fooderp';
    segs.forEach((seg) => {
      built += '/' + seg;
      crumbs.push({
        label: seg.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        path: built,
      });
    });
    return crumbs;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f0f2f7', overflow: 'hidden' }}>
      <FoodERPSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />
      <div style={{
        marginLeft: sidebarCollapsed ? 64 : 256,
        flex: 1, display: 'flex', flexDirection: 'column',
        transition: 'margin-left .3s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden', minWidth: 0,
      }}>
        <FoodERPHeader
          pageName={getPageTitle()}
          breadCrumbList={getBreadcrumbs()}
          showSearch
          currentUser={user}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setSidebarCollapsed(!sidebarCollapsed)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          notifications={notifications}
        />
        <main style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '24px 28px', background: '#f0f2f7',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default FoodERPLayout;
