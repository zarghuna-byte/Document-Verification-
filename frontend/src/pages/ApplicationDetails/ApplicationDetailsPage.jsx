import { Link, useParams } from 'react-router-dom';

import { ArrowLeft, UploadCloud } from 'lucide-react';

import ErrorState from '../../components/common/ErrorState/ErrorState';
import Spinner from '../../components/common/Spinner/Spinner';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { useApplication } from '../../hooks/useApplication';
import { getApplicationStatus } from '../../data/statuses';
import { formatDate, formatDateTime } from '../../utils/format';
import styles from './ApplicationDetailsPage.module.css';

/**
 * Application details page.
 *
 * Shows the application's information in a card: status badge, submission and
 * update dates, creator and notes, plus a prominent button that leads to the
 * document upload page.
 */
function ApplicationDetailsPage() {
  const { applicationId } = useParams();
  const { application, loading, error, reload } = useApplication(applicationId);

  if (loading) {
    return (
      <div className={styles.center} aria-busy="true">
        <Spinner size="medium" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className={styles.page}>
        <ErrorState message={error ?? 'Application not found.'} onRetry={reload} />
        <Link to="/applications" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          Back to Applications
        </Link>
      </div>
    );
  }

  const status = getApplicationStatus(application.status);

  return (
    <div className={styles.page}>
      <Link to="/applications" className={styles.backLink}>
        <ArrowLeft aria-hidden="true" />
        Back to Applications
      </Link>

      <header className={styles.header}>
        <div className={styles.headingRow}>
          <h2 className={styles.title}>Application #{application.id}</h2>
          <StatusChip label={status.label} variant={status.variant} />
        </div>
        <p className={styles.subtitle}>Financial document verification case.</p>
      </header>

      <section className={styles.card} aria-label="Application information">
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>Application ID</span>
            <span className={styles.value}>#{application.id}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Submission Date</span>
            <span className={styles.value}>{formatDateTime(application.submitted_at)}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Last Updated</span>
            <span className={styles.value}>{formatDate(application.updated_at)}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Created By</span>
            <span className={styles.value}>{application.created_by}</span>
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <span className={styles.label}>Notes</span>
            <span className={styles.value}>{application.notes || '\u2014'}</span>
          </div>
        </div>

        <Link to={`/applications/${application.id}/upload`} className={styles.uploadBtn}>
          <UploadCloud aria-hidden="true" />
          Upload Documents
        </Link>
      </section>
    </div>
  );
}

export default ApplicationDetailsPage;
