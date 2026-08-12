import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedLayout from '../components/layout/ProtectedLayout/ProtectedLayout';
import { INTERNAL_ROUTES, NAV_ITEMS } from '../data/navigation';
import ApplicationDetailsPage from '../pages/ApplicationDetails/ApplicationDetailsPage';
import ApplicationsPage from '../pages/Applications/ApplicationsPage';
import ContinuousLearningPage from '../pages/ContinuousLearning/ContinuousLearningPage';
import CreateApplicationPage from '../pages/CreateApplication/CreateApplicationPage';
import Dashboard from '../pages/Dashboard/Dashboard';
import DocumentCompletenessPage from '../pages/DocumentCompleteness/DocumentCompletenessPage';
import FeedbackPage from '../pages/Feedback/FeedbackPage';
import HumanReviewPage from '../pages/HumanReview/HumanReviewPage';
import LoginPage from '../pages/Login/LoginPage';
import PlaceholderPage from '../pages/Placeholder/PlaceholderPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import UploadDocumentsPage from '../pages/UploadDocuments/UploadDocumentsPage';
import ValidationReportPage from '../pages/ValidationReport/ValidationReportPage';
import VerificationPage from '../pages/Verification/VerificationPage';

/**
 * Application route table.
 *
 * The applications module owns the list, create, details, upload, completeness,
 * verification, report and final-review pages. The Feedback and Continuous
 * Learning admin tools are real pages reached from Settings. The top-level
 * "/reports" and "/human-review" menu entries redirect to the applications list
 * because validation reports and final reviews are application-specific. Every
 * remaining sidebar entry resolves to the shared PlaceholderPage so no path
 * returns a 404 and the sidebar active state matches the route. Unknown URLs
 * are redirected to the dashboard.
 */
const PLACEHOLDER_ITEMS = [
  ...NAV_ITEMS.filter(
    ({ id }) =>
      !['dashboard', 'applications', 'upload', 'settings', 'reports', 'human-review'].includes(id)
  ),
  ...INTERNAL_ROUTES,
];

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/new" element={<CreateApplicationPage />} />
        <Route path="applications/:applicationId/upload" element={<UploadDocumentsPage />} />
        <Route
          path="applications/:applicationId/completeness"
          element={<DocumentCompletenessPage />}
        />
        <Route path="applications/:applicationId/verification" element={<VerificationPage />} />
        <Route path="applications/:applicationId/report" element={<ValidationReportPage />} />
        <Route path="applications/:applicationId/review" element={<HumanReviewPage />} />
        <Route path="applications/:applicationId" element={<ApplicationDetailsPage />} />
        <Route path="upload" element={<Navigate to="/applications" replace />} />
        <Route path="reports" element={<Navigate to="/applications" replace />} />
        <Route path="human-review" element={<Navigate to="/applications" replace />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="continuous-learning" element={<ContinuousLearningPage />} />
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
