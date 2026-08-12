import { Link, useParams } from 'react-router-dom';

import { ArrowLeft, ClipboardCheck, FileText, ShieldCheck, UploadCloud } from 'lucide-react';
import ApplicationStatusBadge from '../../components/applications/ApplicationStatusBadge/ApplicationStatusBadge';
import { ApplicationCardSkeleton } from '../../components/applications/ApplicationSkeleton/ApplicationSkeleton';
import DocumentsSection from '../../components/documents/DocumentsSection/DocumentsSection';
import ErrorState from '../../components/common/ErrorState/ErrorState';
import ActivityFeed from '../../components/activity/ActivityFeed/ActivityFeed';
import { useApplication } from '../../hooks/useApplication';
import { formatDate, formatDateTime } from '../../utils/format';
import styles from './ApplicationDetailsPage.module.css';

/**
 * Application details page.
 *
 * Shows the application's information in a card: status badge, submission and
 * update dates, creator and notes. Primary actions lead to the upload,
 * completeness, verification, report and review screens, and the recent
 * activity section streams the stored audit events for this application.
 */
function ApplicationDetailsPage() {
  const { applicationId } = useParams();
  const { application, loading, error, reload } = useApplication(applicationId);

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true">
        <ApplicationCardSkeleton />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className={styles.page}>
        <ErrorState message={error ?? 'Application not found.'} onRetry={reload} />
        <Link to="/applications" className={styles.secondaryBtn}>
          <ArrowLeft aria-hidden="true" />
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <h2 className={styles.title}>Application #{application.id}</h2>
          <ApplicationStatusBadge status={application.status} />
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

        <div className={styles.actions}>
          <Link to={`/applications/${application.id}/upload`} className={styles.primaryBtn}>
            <UploadCloud aria-hidden="true" />
            Upload Documents
          </Link>
          <Link to={`/applications/${application.id}/completeness`} className={styles.primaryBtn}>
            <ClipboardCheck aria-hidden="true" />
            Completeness
          </Link>
          <Link to={`/applications/${application.id}/verification`} className={styles.primaryBtn}>
            <ShieldCheck aria-hidden="true" />
            Verification
          </Link>
          <Link to={`/applications/${application.id}/report`} className={styles.secondaryBtn}>
            <FileText aria-hidden="true" />
            Report
          </Link>
          <Link to={`/applications/${application.id}/review`} className={styles.secondaryBtn}>
            <ShieldCheck aria-hidden="true" />
            Final Review
          </Link>
          <Link to="/applications" className={styles.secondaryBtn}>
            <ArrowLeft aria-hidden="true" />
            Back to Applications
          </Link>
        </div>
      </section>

      <DocumentsSection applicationId={application.id} />

      <section className={styles.activityCard} aria-label="Recent activity">
        <h3 className={styles.activityTitle}>Recent Activity</h3>
        <ActivityFeed applicationId={application.id} limit={10} />
      </section>
    </div>
  );
}

export default ApplicationDetailsPage;
