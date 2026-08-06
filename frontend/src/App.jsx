import AppRoutes from './routes/AppRoutes';

/**
 * Application root.
 *
 * Wraps the route table with the browser router and the global stylesheet
 * import. Further global providers (theming, notifications) can be stacked
 * here in later phases.
 */
function App() {
  return <AppRoutes />;
}

export default App;
