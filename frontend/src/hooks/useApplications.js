import { useCallback, useEffect, useState } from 'react';

import { createApplication, listApplications } from '../services/applications';
import { getApiErrorMessage } from '../utils/apiError';

/**
 * Load and manage the applications list.
 *
 * The status filter is applied server-side (the API receives it as a query
 * param); the search term is filtered client-side over the fetched page by
 * application id and creator. All failures surface as a friendly message that
 * the page can display or toast.
 */
export function useApplications() {
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const { items, total: count } = await listApplications({
        limit: 100,
        status: status || undefined,
      });
      setApplications(items);
      setTotal(count);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(statusFilter);
  }, [load, statusFilter]);

  const filteredApplications = applications.filter((application) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return true;
    }
    return (
      String(application.id).includes(term) ||
      application.created_by.toLowerCase().includes(term)
    );
  });

  const handleStatusChange = useCallback((value) => {
    setStatusFilter(value);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const create = useCallback(async ({ createdBy, notes }) => {
    try {
      const application = await createApplication({ createdBy, notes });
      return { ok: true, application };
    } catch (err) {
      return { ok: false, error: getApiErrorMessage(err) };
    }
  }, []);

  return {
    applications: filteredApplications,
    total,
    loading,
    error,
    reload: () => load(statusFilter),
    searchTerm,
    statusFilter,
    onSearchChange: handleSearchChange,
    onStatusChange: handleStatusChange,
    create,
  };
}
