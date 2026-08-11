import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { createApplication, listApplications } from '../services/applications';
import { getApiErrorMessage } from '../utils/apiError';
import { sortBy } from '../utils/sort';

const RECENT_LIMIT = 5;

const ApplicationsContext = createContext(null);

/**
 * Single shared source of truth for the application list.
 *
 * Both the Applications page and the Dashboard "Recent Applications" section
 * read from this store, so a newly created application appears in both places
 * through the one update performed by `create`. The provider mounts inside the
 * protected layout, so the list only loads for authenticated sessions.
 */
export function ApplicationsProvider({ children }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await listApplications({ limit: 100 });
      setApplications(items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) {
      return;
    }
    fetchedRef.current = true;
    load();
  }, [load]);

  const reload = useCallback(() => {
    fetchedRef.current = true;
    return load();
  }, [load]);

  const create = useCallback(async ({ createdBy, notes }) => {
    try {
      const application = await createApplication({ createdBy, notes });
      setApplications((items) => [application, ...items]);
      return { ok: true, application };
    } catch (err) {
      return { ok: false, error: getApiErrorMessage(err) };
    }
  }, []);

  const recentApplications = useMemo(
    () => sortBy(applications, 'updated_at', 'desc').slice(0, RECENT_LIMIT),
    [applications]
  );

  const value = useMemo(
    () => ({
      applications,
      recentApplications,
      total: applications.length,
      loading,
      error,
      reload,
      create,
    }),
    [applications, recentApplications, loading, error, reload, create]
  );

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
}

export function useApplicationsStore() {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error('useApplicationsStore must be used within an ApplicationsProvider');
  }
  return context;
}
