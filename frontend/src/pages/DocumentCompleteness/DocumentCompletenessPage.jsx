import { Link, useParams } from 'react-router-dom';

import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, FileUp, RefreshCw, ShieldCheck } from 'lucide-react';

import ApplicationStatusBadge from '../../components/applications/ApplicationStatusBadge/ApplicationStatusBadge';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import ErrorState from '../../components/common/ErrorState/ErrorState';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { useApplication } from '../../hooks/useApplication';
import { useCompleteness } from '../../hooks/useCompleteness';
import { formatDateTime } from '../../utils/format';
import styles from './DocumentCompletenessPage.module.css';

function CompletenessSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonProgress} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 8 }, (_, index) => (
          <div className={styles.skeletonCard} key={index} />
        ))}
      </div>
    </div>
  );
}

const TOPIC_STATUS_PRESENTATION = {
  COMPLETE: { label: 'Complete', variant: 'success' },
  PARTIAL: { label: 'Partially Complete', variant: 'warning' },
  MISSING: { label: 'Missing', variant: 'danger' },
};

/**
 * One required document topic with its per-slot presence.
 *
 * Slots render their display label (Copy N, or Front/Back for the CNIC); a
 * filled slot shows the uploaded filename and a link back to the upload page to
 * replace it, while an empty slot carries an upload action.
 */
function DocumentTopicCard({ topic, applicationId }) {
  const presentation = TOPIC_STATUS_PRESENTATION[topic.status] ?? {
    label: topic.status,
    variant: 'neutral',
  };
  const uploadSlots = topic.slots.filter((slot) => !slot.is_present);

  return (
    <article className={styles.topicCard} aria-label={topic.label}>
      <header className={styles.topicHeader}>
        <h4 className={styles.topicTitle}>{topic.label}</h4>
        <StatusChip label={presentation.label} variant={presentation.variant} />
      </header>
      <p className={styles.topicCount}>
        {topic.uploaded_copies} of {topic.required_copies} uploaded
      </p>

      <ul className={`${styles.slotList} ${topic.slots.length > 4 ? styles.slotListDense : ''}`}>
        {topic.slots.map((slot) => {
          const slotLabel = slot.label || `Copy ${slot.copy_number}`;
          return (
            <li key={`${slot.document_type}-${slot.copy_number}`} className={styles.slotItem}>
              {slot.is_present ? (
                <>
                  <span className={styles.slotPresent} aria-label={`${slotLabel} uploaded`}>
                    <CheckCircle2 aria-hidden="true" />
                    <span className={styles.slotMeta}>
                      <span className={styles.slotLabel}>{slotLabel}</span>
                      <span className={styles.slotFilename} title={slot.filename ?? ''}>
                        {slot.filename}
                      </span>
                    </span>
                  </span>
                  <Link
                    to={`/applications/${applicationId}/upload`}
                    className={styles.slotReplace}
                    title={`Replace ${slotLabel}`}
                  >
                    Replace
                  </Link>
                </>
              ) : (
                <>
                  <span className={styles.slotMissing} aria-label={`${slotLabel} missing`}>
                    <span className={styles.slotLabel}>{slotLabel}</span>
                    <span className={styles.slotFilename}>Not uploaded</span>
                  </span>
                  <Link
                    to={`/applications/${applicationId}/upload`}
                    className={styles.slotUpload}
                  >
                    <FileUp aria-hidden="true" />
                    Upload {topic.key === 'CNIC' ? slotLabel : `Copy ${slot.copy_number}`}
                  </Link>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {uploadSlots.length > 0 && (
        <div className={styles.topicAction}>
          <Link to={`/applications/${applicationId}/upload`} className={styles.topicUploadLink}>
            <FileUp aria-hidden="true" />
            Upload missing {uploadSlots.length === 1 ? 'document' : 'documents'}
          </Link>
        </div>
      )}
    </article>
  );
}

/**
 * Document Completeness page.
 *
 * A read-only report of the 18 required uploads for an application, grouped by
 * document topic. Shows the overall progress, per-topic and per-slot presence
 * and a documents-required list for every unfilled slot. Upload actions link to
 * the upload page; a complete application offers "Continue to Verification".
 * No pipeline internals are surfaced.
 */
function DocumentCompletenessPage() {
  const { applicationId } = useParams();
  const { report, loading, error, reload } = useCompleteness(applicationId);
  const { application, loading: appLoading, error: appError, reload: reloadApp } =
    useApplication(applicationId);

  const isLoading = loading || appLoading;

  if (isLoading) {
    return (
      <div className={styles.page} aria-busy="true">
        <CompletenessSkeleton />
      </div>
    );
  }

  if (appError || !application || error || !report) {
    return (
      <div className={styles.page}>
        <ErrorState
          message={appError ?? error ?? 'Completeness report not found.'}
          onRetry={() => {
            reload();
            reloadApp();
          }}
        />
        <Link to="/applications" className={styles.secondaryBtn}>
          <ArrowLeft aria-hidden="true" />
          Back to Applications
        </Link>
      </div>
    );
  }

  const isComplete = report.status === 'COMPLETE';
  const progress = Math.round(report.completion_percentage);
  const topicLabels = Object.fromEntries(
    report.required_documents.map((topic) => [topic.key, topic.label])
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <h2 className={styles.title}>Document Completeness</h2>
          <ApplicationStatusBadge status={application.status} />
        </div>
        <p className={styles.subtitle}>
          Review whether all required documents have been submitted for this
          application.
        </p>
        <div className={styles.meta}>
          <span>Application #{report.application_id}</span>
          <span>Last updated {formatDateTime(report.timestamp)}</span>
          <span>Submitted by {application.created_by}</span>
        </div>
      </header>

      <div className={styles.actions}>
        <button type="button" className={styles.refreshBtn} onClick={reload}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </button>
        <Link to={`/applications/${application.id}`} className={styles.secondaryBtn}>
          <ArrowLeft aria-hidden="true" />
          Back to Application
        </Link>
      </div>

      <section className={styles.summaryCard} aria-label="Overall document completeness">
        <div className={styles.summaryRow}>
          <div className={styles.summaryStatus}>
            <ClipboardCheck aria-hidden="true" />
            <div>
              <h3 className={styles.summaryTitle}>Overall Status</h3>
              <StatusChip
                label={isComplete ? 'Complete' : 'Incomplete'}
                variant={isComplete ? 'success' : 'danger'}
              />
            </div>
          </div>
          <div className={styles.summaryCount}>
            <span className={styles.summaryNumber}>
              {report.uploaded_copies}
              <span className={styles.summaryTotal}> / {report.total_copies}</span>
            </span>
            <span className={styles.summaryCaption}>required documents uploaded</span>
          </div>
        </div>

        <div
          className={styles.progress}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress} percent complete`}
        >
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {isComplete ? (
          <div className={styles.completeBanner}>
            <CheckCircle2 aria-hidden="true" />
            <p>All required documents have been submitted.</p>
            <Link to={`/applications/${application.id}/verification`} className={styles.primaryBtn}>
              <ShieldCheck aria-hidden="true" />
              Continue to Verification
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className={styles.requiredBlock}>
            <h4 className={styles.requiredTitle}>Documents Required</h4>
            {report.missing_documents.length > 0 ? (
              <ul className={styles.requiredList}>
                {report.missing_documents.map((missing) => (
                  <li key={`${missing.key}-${missing.slot_number}`} className={styles.requiredItem}>
                    <span className={styles.requiredLabel}>
                      {missing.label}
                      <span className={styles.requiredSlot}>{missing.slot_label}</span>
                    </span>
                    <Link
                      to={`/applications/${application.id}/upload`}
                      className={styles.requiredUpload}
                    >
                      <FileUp aria-hidden="true" />
                      Upload {missing.key === 'CNIC' ? missing.slot_label : `Copy ${missing.slot_number}`}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.requiredEmpty}>
                Every required slot is filled, but the application still reports
                incomplete. Try refreshing.
              </p>
            )}
          </div>
        )}
      </section>

      {report.required_documents.length > 0 ? (
        <section className={styles.topics} aria-label="Required documents">
          {report.required_documents.map((topic) => (
            <DocumentTopicCard
              key={topic.key}
              topic={topic}
              applicationId={application.id}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No document requirements configured"
          message="The required document catalogue is empty. Check the system configuration."
        />
      )}

      {report.duplicate_documents.length > 0 && (
        <section className={styles.notes} aria-label="Duplicate documents">
          <h4 className={styles.notesTitle}>Duplicate Documents</h4>
          <p className={styles.notesText}>
            {report.duplicate_documents
              .map((duplicate) => topicLabels[duplicate.key] ?? duplicate.document_type)
              .join(', ')}{' '}
            {report.duplicate_documents.length === 1 ? 'holds' : 'hold'} more uploads than required.
          </p>
        </section>
      )}

      {report.unexpected_documents.length > 0 && (
        <section className={styles.notes} aria-label="Unexpected documents">
          <h4 className={styles.notesTitle}>Unexpected Documents</h4>
          <p className={styles.notesText}>
            {report.unexpected_documents
              .map((item) => `${item.document_type} (${item.copy_count})`)
              .join(', ')}{' '}
            do not match the required document catalogue.
          </p>
        </section>
      )}
    </div>
  );
}

export default DocumentCompletenessPage;
