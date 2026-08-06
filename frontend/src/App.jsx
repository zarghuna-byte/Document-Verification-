import { ToastProvider } from './components/common/Toast/ToastContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Application root.
 *
 * Wraps the route table with the browser router, the global toast system and
 * the global stylesheet import. Further global providers (theming,
 * notifications) can be stacked here in later phases.
 */
function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
