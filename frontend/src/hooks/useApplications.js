import { useCallback, useEffect, useState } from 'react';

import { createApplication, listApplications } from '../services/applications';
import { getApiErrorMessage } from '../utils/apiError';
import { sortBy } from '../utils/sort';

/**
 * Load and manage the applications list.
 *
 * The status filter is applied server-side (the API receives it as a query
 * param); the search term and column sorting are applied client-side over the
 * fetched page. Search covers application id, creator and notes. All failures
 * surface as a friendly message the page can display or toast.
 */
export function useApplications() {
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('submitted_at');
  const [sortDir, setSortDir] = useState('desc');

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
      application.created_by.toLowerCase().includes(term) ||
      (application.notes ?? '').toLowerCase().includes(term)
    );
  });

  const visibleApplications = sortBy(filteredApplications, sortKey, sortDir);

  const handleStatusChange = useCallback((value) => {
    setStatusFilter(value);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleSortChange = useCallback((key, direction) => {
    setSortKey(key);
    setSortDir(direction);
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
    applications: visibleApplications,
    total,
    loading,
    error,
    reload: () => load(statusFilter),
    searchTerm,
    statusFilter,
    sortKey,
    sortDir,
    onSearchChange: handleSearchChange,
    onStatusChange: handleStatusChange,
    onSortChange: handleSortChange,
    create,
  };
}
