import SessionTimeoutModal from '../../auth/SessionTimeoutModal/SessionTimeoutModal';
import ProtectedRoute from '../../../auth/ProtectedRoute';
import DashboardLayout from '../DashboardLayout/DashboardLayout';

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
      <SessionTimeoutModal />
    </ProtectedRoute>
  );
}

export default ProtectedLayout;
