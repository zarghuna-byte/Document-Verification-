import { Navigate, Route, Routes } from 'react-router-dom';

import DashboardLayout from '../components/layout/DashboardLayout/DashboardLayout';
import { NAV_ITEMS } from '../data/navigation';
import Dashboard from '../pages/Dashboard/Dashboard';
import PlaceholderPage from '../pages/Placeholder/PlaceholderPage';

/**
 * Application route table.
 *
 * Every non-dashboard menu entry resolves to the shared PlaceholderPage so no
 * path returns a 404 and the sidebar active state matches the route. Each
 * placeholder gets the nav label plus a short note describing its future
 * scope. Unknown URLs are redirected to the dashboard.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        {NAV_ITEMS.filter(({ id }) => id !== 'dashboard').map(({ id, label, path }) => (
          <Route
            key={id}
            path={path}
            element={
              <PlaceholderPage
                title={label}
                description={`The ${label} module is coming in a future phase.`}
              />
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
