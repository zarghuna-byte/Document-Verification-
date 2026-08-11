import { ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import ApplicationStatusBadge from '../../applications/ApplicationStatusBadge/ApplicationStatusBadge';
import EmptyState from '../../common/EmptyState/EmptyState';
import ErrorState from '../../common/ErrorState/ErrorState';
import { useApplicationsStore } from '../../../store/ApplicationsContext';
import { formatDate } from '../../../utils/format';
import styles from './RecentApplications.module.css';

/**
 * Recent Applications dashboard section.
 *
 * Reads the shared applications store, so it always shows the same records as
 * the Applications page. Displays the five most recently updated applications;
 * a newly created application appears here and on the Applications page from
 * the same store update, without any dashboard-specific dataset.
 */
function RecentApplications() {
  const { recentApplications, loading, error, reload } = useApplicationsStore();

  return (
    <section className={styles.card} aria-label="Recent applications">
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Applications</h3>
        <Link to="/applications" className={styles.viewAll}>
          View all
        </Link>
      </div>

      {loading ? (
        <ul className={styles.list}>
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className={styles.skeletonRow} aria-hidden="true" />
          ))}
        </ul>
      ) : error ? (
        <ErrorState message="Unable to load recent applications." onRetry={reload} />
      ) : recentApplications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message="Create an application to begin the document verification process."
          action={
            <Link to="/applications/new" className={styles.createBtn}>
              <Plus aria-hidden="true" />
              Create New Application
            </Link>
          }
        />
      ) : (
        <ul className={styles.list}>
          {recentApplications.map((application) => (
            <li key={application.id}>
              <Link
                to={`/applications/${application.id}`}
                className={styles.row}
                aria-label={`View application ${application.id}`}
              >
                <span className={styles.id}>#{application.id}</span>
                <span className={styles.status}>
                  <ApplicationStatusBadge status={application.status} />
                </span>
                <span className={styles.meta}>
                  <span className={styles.createdBy}>{application.created_by}</span>
                  <span className={styles.updated}>Updated {formatDate(application.updated_at)}</span>
                </span>
                <ChevronRight className={styles.chevron} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default RecentApplications;
