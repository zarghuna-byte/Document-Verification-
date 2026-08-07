import { Navigate, Route, Routes } from 'react-router-dom';

import DashboardLayout from '../components/layout/DashboardLayout/DashboardLayout';
import { INTERNAL_ROUTES, NAV_ITEMS } from '../data/navigation';
import ApplicationDetailsPage from '../pages/ApplicationDetails/ApplicationDetailsPage';
import ApplicationsPage from '../pages/Applications/ApplicationsPage';
import CreateApplicationPage from '../pages/CreateApplication/CreateApplicationPage';
import Dashboard from '../pages/Dashboard/Dashboard';
import PlaceholderPage from '../pages/Placeholder/PlaceholderPage';
import UploadDocumentsPage from '../pages/UploadDocuments/UploadDocumentsPage';

/**
 * Application route table.
 *
 * The applications module owns the list, create, details and upload pages.
 * Every other sidebar entry resolves to the shared PlaceholderPage so no path
 * returns a 404 and the sidebar active state matches the route. Internal
 * processing routes stay reachable as placeholders but are not exposed in the
 * sidebar. The "/upload" menu entry is redirected to the applications list
 * because an upload needs an application context. Unknown URLs are redirected
 * to the dashboard.
 */
const PLACEHOLDER_ITEMS = [
  ...NAV_ITEMS.filter(({ id }) => !['dashboard', 'applications', 'upload'].includes(id)),
  ...INTERNAL_ROUTES,
];

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/new" element={<CreateApplicationPage />} />
        <Route path="applications/:applicationId/upload" element={<UploadDocumentsPage />} />
        <Route path="applications/:applicationId" element={<ApplicationDetailsPage />} />
        <Route path="upload" element={<Navigate to="/applications" replace />} />
        {PLACEHOLDER_ITEMS.map(({ id, label, path }) => (
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
