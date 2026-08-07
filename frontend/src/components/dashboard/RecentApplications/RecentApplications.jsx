import { Link } from 'react-router-dom';

import { Plus } from 'lucide-react';

import EmptyState from '../../common/EmptyState/EmptyState';
import styles from './RecentApplications.module.css';

/**
 * Recent Applications dashboard section.
 *
 * Shows an empty state until the dashboard statistics/API integration is
 * implemented; no application records are fabricated.
 */
function RecentApplications() {
  return (
    <section className={styles.card} aria-label="Recent applications">
      <h3 className={styles.title}>Recent Applications</h3>
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
    </section>
  );
}

export default RecentApplications;
