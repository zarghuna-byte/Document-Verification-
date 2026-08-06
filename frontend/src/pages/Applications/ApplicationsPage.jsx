import { Link } from 'react-router-dom';

import { Plus, Search } from 'lucide-react';

import ApplicationTable from '../../components/applications/ApplicationTable/ApplicationTable';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import ErrorState from '../../components/common/ErrorState/ErrorState';
import Spinner from '../../components/common/Spinner/Spinner';
import { useApplications } from '../../hooks/useApplications';
import { APPLICATION_STATUSES } from '../../data/statuses';
import styles from './ApplicationsPage.module.css';

/**
 * Applications landing page.
 *
 * Renders a toolbar (create button, search bar, status filter) above the
 * application table, with loading, error and empty states. Search filters the
 * fetched page client-side; the status filter is applied server-side.
 */
function ApplicationsPage() {
  const {
    applications,
    total,
    loading,
    error,
    reload,
    searchTerm,
    statusFilter,
    onSearchChange,
    onStatusChange,
  } = useApplications();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Applications</h2>
          <p className={styles.subtitle}>
            {total} application{total === 1 ? '' : 's'} found in the workspace.
          </p>
        </div>
        <Link to="/applications/new" className={styles.createBtn}>
          <Plus aria-hidden="true" />
          Create New Application
        </Link>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search className={styles.searchIcon} aria-hidden="true" />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search by ID or creator..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search applications"
          />
        </label>

        <label className={styles.filter}>
          <span className={styles.filterLabel}>Status</span>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className={styles.center} aria-busy="true">
          <Spinner size="medium" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications found"
          message={
            searchTerm || statusFilter
              ? 'Try adjusting the search or status filter.'
              : 'Create your first application to get started.'
          }
        />
      ) : (
        <ApplicationTable applications={applications} />
      )}
    </div>
  );
}

export default ApplicationsPage;
