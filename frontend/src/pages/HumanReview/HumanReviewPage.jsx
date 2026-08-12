import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  CheckCircle2,
  FileDown,
  Fingerprint,
  Plus,
  RefreshCw,
  ShieldCheck,
  Stamp,
  Trash2,
  XCircle,
} from 'lucide-react';

import ApplicationStatusBadge from '../../components/applications/ApplicationStatusBadge/ApplicationStatusBadge';
import ErrorState from '../../components/common/ErrorState/ErrorState';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { useToast } from '../../components/common/Toast/ToastContext';
import { useReview } from '../../hooks/useReview';
import { getDocumentDownloadUrl } from '../../services/documents';
import { getDocumentTypeConfig } from '../../data/documents';
import { formatDateTime } from '../../utils/format';
import styles from './HumanReviewPage.module.css';

function ReviewSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <div className={styles.skeletonCard} key={index} />
        ))}
      </div>
    </div>
  );
}

const DECISION_PRESENTATION = {
  APPROVE: { label: 'Approved', variant: 'success' },
  CORRECT: { label: 'Corrected', variant: 'warning' },
  REJECT: { label: 'Rejected', variant: 'danger' },
};

const OCR_STATUS_PRESENTATION = {
  NOT_PROCESSED: { label: 'Not processed', variant: 'neutral' },
  OCR_PROCESSED: { label: 'Processed by OCR', variant: 'info' },
  TEXT_EXTRACTED: { label: 'Text extracted', variant: 'success' },
};

const FIELD_STATUS_PRESENTATION = {
  AUTO_VERIFIED: { label: 'Verified automatically', variant: 'success' },
  VERIFIED: { label: 'Verified', variant: 'success' },
  PENDING_REVIEW: { label: 'Pending review', variant: 'warning' },
  CORRECTED: { label: 'Corrected', variant: 'warning' },
  CANNOT_VERIFY: { label: 'Cannot verify', variant: 'danger' },
};

function lookupPresentation(mapping, value) {
  return mapping[value] ?? { label: value ?? 'Unknown', variant: 'neutral' };
}

const LOW_CONFIDENCE_THRESHOLD = 0.7;

function formatConfidence(value) {
  return value === null || value === undefined ? '\u2014' : `${Math.round(value * 100)}%`;
}

/**
 * Recorded review summary shown after a decision has been submitted.
 */
function RecordedReview({ review }) {
  const presentation = DECISION_PRESENTATION[review.decision] ?? {
    label: review.decision,
    variant: 'neutral',
  };
  return (
    <section className={styles.recorded} aria-label="Recorded review">
      <div className={styles.recordedHeader}>
        <CheckCircle2 aria-hidden="true" />
        <div>
          <h3 className={styles.recordedTitle}>Review Recorded</h3>
          <p className={styles.recordedMeta}>
            {review.reviewer_name} · {formatDateTime(review.reviewed_at)}
          </p>
        </div>
        <StatusChip label={presentation.label} variant={presentation.variant} />
      </div>
      {review.comments && <p className={styles.recordedComments}>{review.comments}</p>}
      {review.rejection_reason && (
        <p className={styles.recordedComments}>
          <strong>Rejection reason:</strong> {review.rejection_reason}
        </p>
      )}
      {review.corrections.length > 0 && (
        <ul className={styles.correctionList}>
          {review.corrections.map((correction) => (
            <li key={correction.field_name} className={styles.correctionItem}>
              <span className={styles.correctionField}>{correction.field_name}</span>
              <span className={styles.correctionValue}>
                {correction.original_value ?? ''} → {correction.corrected_value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Final Human Review page.
 *
 * An employee-facing decision screen built from the stored pipeline results:
 * the report summary, uploaded documents, extracted fields with confidence,
 * visual detection outcomes and the mandatory manual checklist. The employee
 * picks a decision (approve, correct or reject), completes the relevant
 * requirements and submits; an application can only be reviewed once.
 */
function HumanReviewPage() {
  const { applicationId } = useParams();
  const toast = useToast();
  const { review, history, application, loading, error, reload, submit, submitting, submitError } =
    useReview(applicationId);

  const [reviewerName, setReviewerName] = useState('');
  const [decision, setDecision] = useState(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [checked, setChecked] = useState({});
  const [corrections, setCorrections] = useState([{ field_name: '', corrected_value: '', reason: '' }]);
  const [formError, setFormError] = useState(null);

  const fieldNames = useMemo(
    () => Array.from(new Set((review?.fields ?? []).map((field) => field.field_name))),
    [review]
  );

  const alreadyReviewed = Boolean(
    review?.previous_review || (history?.reviews?.length ?? 0) > 0
  );
  const previousReview = review?.previous_review ?? history?.reviews?.[0] ?? null;

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true">
        <ReviewSkeleton />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className={styles.page}>
        <ErrorState message={error ?? 'Review screen not found.'} onRetry={reload} />
        <Link to="/applications" className={styles.secondaryBtn}>
          <ArrowLeft aria-hidden="true" />
          Back to Applications
        </Link>
      </div>
    );
  }

  const report = review.report;
  const overall = report.overall_status;
  const overallChip = {
    APPROVED: { label: 'Approved', variant: 'success' },
    MANUAL_REVIEW_REQUIRED: { label: 'Review Required', variant: 'warning' },
    FAILED: { label: 'Failed', variant: 'danger' },
    REJECTED: { label: 'Rejected', variant: 'danger' },
  }[overall] ?? { label: overall, variant: 'neutral' };

  const toggleChecklistItem = (name) => {
    setChecked((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleAll = (next) => {
    const nextState = {};
    for (const item of review.checklist) {
      nextState[item.item_name] = next;
    }
    setChecked(nextState);
  };

  const updateCorrection = (index, key, value) => {
    setCorrections((prev) =>
      prev.map((correction, i) => (i === index ? { ...correction, [key]: value } : correction))
    );
  };

  const addCorrection = () => {
    setCorrections((prev) => [...prev, { field_name: '', corrected_value: '', reason: '' }]);
  };

  const removeCorrection = (index) => {
    setCorrections((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  };

  const validateForm = () => {
    if (!reviewerName.trim()) {
      return 'Reviewer name is required.';
    }
    if (!decision) {
      return 'Choose a decision before submitting.';
    }
    if (decision === 'APPROVE') {
      const missing = review.checklist.filter((item) => !checked[item.item_name]);
      if (missing.length > 0) {
        return 'Every checklist item must be confirmed to approve this application.';
      }
      return null;
    }
    if (decision === 'CORRECT') {
      const validCorrections = corrections.filter(
        (correction) => correction.field_name.trim() && correction.corrected_value.trim()
      );
      if (validCorrections.length === 0) {
        return 'At least one corrected field value is required.';
      }
      const names = validCorrections.map((correction) => correction.field_name.trim());
      if (new Set(names).size !== names.length) {
        return 'A field can only be corrected once per review.';
      }
      return null;
    }
    if (!rejectionReason.trim()) {
      return 'A rejection reason is required.';
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    const validCorrections = corrections
      .filter((correction) => correction.field_name.trim() && correction.corrected_value.trim())
      .map((correction) => ({
        field_name: correction.field_name.trim(),
        corrected_value: correction.corrected_value.trim(),
        reason: correction.reason?.trim() || null,
      }));
    const payload = {
      reviewer_name: reviewerName.trim(),
      decision,
      comments: comments.trim() || null,
      rejection_reason: decision === 'REJECT' ? rejectionReason.trim() : null,
      checklist: review.checklist.map((item) => ({
        item_name: item.item_name,
        is_checked: Boolean(checked[item.item_name]),
      })),
      corrections: decision === 'CORRECT' ? validCorrections : [],
    };
    const result = await submit(payload);
    if (result.ok) {
      toast.success('Final review recorded.');
    } else {
      setFormError(result.error);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <h2 className={styles.title}>Final Review — Application #{review.application_id}</h2>
          {application && <ApplicationStatusBadge status={application.status} />}
        </div>
        <p className={styles.subtitle}>
          Review the stored results and record the final decision for this
          application.
        </p>
        <div className={styles.meta}>
          <span>Submitted by {review.application.created_by}</span>
          <span>Updated {formatDateTime(review.application.updated_at)}</span>
        </div>
      </header>

      <div className={styles.actions}>
        <button type="button" className={styles.refreshBtn} onClick={reload}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </button>
        <Link to={`/applications/${review.application_id}`} className={styles.secondaryBtn}>
          <ArrowLeft aria-hidden="true" />
          Back to Application
        </Link>
      </div>

      {alreadyReviewed && previousReview ? (
        <RecordedReview review={previousReview} />
      ) : (
        <form className={styles.reviewForm} onSubmit={handleSubmit}>
          <section className={styles.section} aria-label="Report summary">
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Report Summary</h3>
              <StatusChip label={overallChip.label} variant={overallChip.variant} />
            </div>
            <div className={styles.reportStats}>
              <div className={styles.reportStat}>
                <span className={styles.reportValue}>{report.document_summary.length}</span>
                <span className={styles.reportLabel}>documents</span>
              </div>
              <div className={styles.reportStat}>
                <span className={styles.reportValue}>{report.rule_summary.total}</span>
                <span className={styles.reportLabel}>rule checks</span>
              </div>
              <div className={styles.reportStat}>
                <span className={styles.reportValue}>{report.extraction_summary.total_fields}</span>
                <span className={styles.reportLabel}>extracted fields</span>
              </div>
              <div className={styles.reportStat}>
                <span className={styles.reportValue}>
                  {report.visual_detection_summary.documents_checked}
                </span>
                <span className={styles.reportLabel}>visual checks</span>
              </div>
            </div>
            <Link
              to={`/applications/${review.application_id}/report`}
              className={styles.inlineLink}
            >
              View full validation report
            </Link>
          </section>

          {review.documents.length > 0 && (
            <section className={styles.section} aria-label="Documents">
              <h3 className={styles.sectionTitle}>Documents</h3>
              <ul className={styles.documentList}>
                {review.documents.map((document) => {
                  const ocr = lookupPresentation(OCR_STATUS_PRESENTATION, document.ocr_status);
                  const docConfig = getDocumentTypeConfig(document.document_type);
                  return (
                    <li key={document.document_id} className={styles.documentItem}>
                      <div className={styles.documentMeta}>
                        <span className={styles.documentName}>{docConfig.label}</span>
                        <a
                          href={getDocumentDownloadUrl(document.document_id)}
                          className={styles.documentFile}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileDown aria-hidden="true" />
                          {document.original_filename}
                        </a>
                      </div>
                      <div className={styles.documentStatus}>
                        <StatusChip label={ocr.label} variant={ocr.variant} />
                        <span className={styles.confidence}>
                          {formatConfidence(document.ocr_confidence)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {review.fields.length > 0 && (
            <section className={styles.section} aria-label="Extracted fields">
              <h3 className={styles.sectionTitle}>Extracted Fields</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Document</th>
                      <th>Extracted Value</th>
                      <th>Normalized Value</th>
                      <th>Confidence</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {review.fields.map((field) => {
                      const status = lookupPresentation(
                        FIELD_STATUS_PRESENTATION,
                        field.verification_status
                      );
                      const lowConfidence =
                        field.confidence_score !== null &&
                        field.confidence_score !== undefined &&
                        field.confidence_score < LOW_CONFIDENCE_THRESHOLD;
                      return (
                        <tr
                          key={`${field.document_id}-${field.field_name}`}
                          className={field.human_verified ? styles.rowVerified : undefined}
                        >
                          <td className={styles.fieldName}>{field.field_name}</td>
                          <td className={styles.fieldDoc}>{field.file_name}</td>
                          <td className={styles.monoCell}>{field.extracted_value}</td>
                          <td className={styles.monoCell}>{field.normalized_value ?? '\u2014'}</td>
                          <td
                            className={
                              lowConfidence ? styles.confidenceLow : styles.confidenceHigh
                            }
                          >
                            {formatConfidence(field.confidence_score)}
                          </td>
                          <td>
                            <StatusChip label={status.label} variant={status.variant} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {review.visual_detections.length > 0 && (
            <section className={styles.section} aria-label="Visual detections">
              <h3 className={styles.sectionTitle}>Visual Checks</h3>
              <ul className={styles.detectionList}>
                {review.visual_detections.map((detection) => (
                  <li key={`${detection.document_id}-${detection.detection_type}`} className={styles.detectionItem}>
                    <span className={styles.detectionIcon} aria-hidden="true">
                      {detection.detection_type === 'SIGNATURE' ? <Fingerprint /> : <Stamp />}
                    </span>
                    <span className={styles.detectionMeta}>
                      <span className={styles.detectionLabel}>
                        {detection.detection_type === 'SIGNATURE' ? 'Signature' : 'Stamp'}
                      </span>
                      <span className={styles.detectionDoc}>
                        {getDocumentTypeConfig(detection.document_type).label}
                      </span>
                    </span>
                    <StatusChip
                      label={detection.is_present ? 'Present' : 'Missing'}
                      variant={detection.is_present ? 'success' : 'warning'}
                    />
                    <span className={styles.detectionConfidence}>
                      {formatConfidence(detection.confidence)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={styles.section} aria-label="Manual checklist">
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Manual Checklist</h3>
              <div className={styles.checklistActions}>
                <button type="button" className={styles.textBtn} onClick={() => toggleAll(true)}>
                  Check all
                </button>
                <button type="button" className={styles.textBtn} onClick={() => toggleAll(false)}>
                  Clear
                </button>
              </div>
            </div>
            <p className={styles.sectionHint}>
              Confirm each item against the uploaded documents. Every item must be
              checked to approve the application.
            </p>
            <ul className={styles.checklist}>
              {review.checklist.map((item) => (
                <li key={item.item_name} className={styles.checklistItem}>
                  <label className={styles.checklistLabel}>
                    <input
                      type="checkbox"
                      checked={Boolean(checked[item.item_name])}
                      onChange={() => toggleChecklistItem(item.item_name)}
                    />
                    <span>{item.item_name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section} aria-label="Review decision">
            <h3 className={styles.sectionTitle}>Decision</h3>

            <label className={styles.fieldLabel} htmlFor="reviewer-name">
              Reviewer name
            </label>
            <input
              id="reviewer-name"
              type="text"
              className={styles.textInput}
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              placeholder="Your name"
            />

            <div className={styles.decisionGrid}>
              {[
                { value: 'APPROVE', label: 'Approve', description: 'All documents verified and the checklist is complete.' },
                { value: 'CORRECT', label: 'Correct', description: 'Some extracted values need manual correction.' },
                { value: 'REJECT', label: 'Reject', description: 'The application cannot be accepted.' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.decisionCard} ${decision === option.value ? styles.decisionSelected : ''}`}
                  onClick={() => setDecision(option.value)}
                  aria-pressed={decision === option.value}
                >
                  <span className={styles.decisionTitle}>{option.label}</span>
                  <span className={styles.decisionDescription}>{option.description}</span>
                </button>
              ))}
            </div>

            <label className={styles.fieldLabel} htmlFor="review-comments">
              Comments
            </label>
            <textarea
              id="review-comments"
              className={styles.textArea}
              rows={3}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              placeholder="Optional notes for the record"
            />

            {decision === 'CORRECT' && (
              <div className={styles.corrections}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.subsectionTitle}>Field Corrections</h4>
                  <button type="button" className={styles.textBtn} onClick={addCorrection}>
                    <Plus aria-hidden="true" />
                    Add correction
                  </button>
                </div>
                <p className={styles.sectionHint}>
                  Provide at least one corrected value for the extracted field.
                </p>
                {corrections.map((correction, index) => (
                  <div key={index} className={styles.correctionRow}>
                    <input
                      type="text"
                      list="field-names"
                      className={styles.textInput}
                      value={correction.field_name}
                      onChange={(event) => updateCorrection(index, 'field_name', event.target.value)}
                      placeholder="Field name"
                    />
                    <input
                      type="text"
                      className={styles.textInput}
                      value={correction.corrected_value}
                      onChange={(event) => updateCorrection(index, 'corrected_value', event.target.value)}
                      placeholder="Corrected value"
                    />
                    <input
                      type="text"
                      className={styles.textInput}
                      value={correction.reason}
                      onChange={(event) => updateCorrection(index, 'reason', event.target.value)}
                      placeholder="Reason (optional)"
                    />
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => removeCorrection(index)}
                      aria-label="Remove correction"
                      disabled={corrections.length === 1}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <datalist id="field-names">
                  {fieldNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            )}

            {decision === 'REJECT' && (
              <div>
                <label className={styles.fieldLabel} htmlFor="rejection-reason">
                  Rejection reason
                </label>
                <textarea
                  id="rejection-reason"
                  className={styles.textArea}
                  rows={3}
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Explain why this application is rejected"
                />
              </div>
            )}

            {(formError || submitError) && (
              <div className={styles.formError} role="alert">
                <XCircle aria-hidden="true" />
                {formError ?? submitError}
              </div>
            )}

            <div className={styles.submitRow}>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={submitting}
              >
                <ShieldCheck aria-hidden="true" />
                {submitting ? 'Submitting…' : 'Submit Final Review'}
              </button>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}

export default HumanReviewPage;
