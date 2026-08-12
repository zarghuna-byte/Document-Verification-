import { Link, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Fingerprint,
  ListChecks,
  Printer,
  RefreshCw,
  ShieldCheck,
  Stamp,
  TextCursorInput,
  XCircle,
} from 'lucide-react';

import ApplicationStatusBadge from '../../components/applications/ApplicationStatusBadge/ApplicationStatusBadge';
import ErrorState from '../../components/common/ErrorState/ErrorState';
import StatusChip from '../../components/common/StatusChip/StatusChip';
import { useReport } from '../../hooks/useReport';
import { getDocumentStatus } from '../../data/statuses';
import { getDocumentTypeConfig } from '../../data/documents';
import { getPrintableReportUrl } from '../../services/reports';
import { formatDateTime } from '../../utils/format';
import styles from './ValidationReportPage.module.css';

function ReportSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 5 }, (_, index) => (
          <div className={styles.skeletonCard} key={index} />
        ))}
      </div>
      <div className={styles.skeletonTable} />
    </div>
  );
}

const OVERALL_STATUS_PRESENTATION = {
  APPROVED: { label: 'Approved', variant: 'success' },
  MANUAL_REVIEW_REQUIRED: { label: 'Review Required', variant: 'warning' },
  FAILED: { label: 'Failed', variant: 'danger' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
};

const OCR_STATUS_PRESENTATION = {
  NOT_PROCESSED: { label: 'Not processed', variant: 'neutral' },
  OCR_PROCESSED: { label: 'Processed by OCR', variant: 'info' },
  TEXT_EXTRACTED: { label: 'Text extracted', variant: 'success' },
};

const TECHNICAL_STATUS_PRESENTATION = {
  PASS: { label: 'Validated', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
  NOT_VALIDATED: { label: 'Not validated', variant: 'neutral' },
};

const ANALYSIS_STATUS_PRESENTATION = {
  AUTO_VERIFIED: { label: 'Verified automatically', variant: 'success' },
  VERIFIED: { label: 'Verified', variant: 'success' },
  PENDING_REVIEW: { label: 'Pending review', variant: 'warning' },
  CORRECTED: { label: 'Corrected', variant: 'warning' },
  CANNOT_VERIFY: { label: 'Cannot verify', variant: 'danger' },
  NOT_ANALYZED: { label: 'Not analyzed', variant: 'neutral' },
};

function lookupPresentation(mapping, value) {
  return mapping[value] ?? { label: value ?? 'Unknown', variant: 'neutral' };
}

function SummaryCard({ icon: Icon, title, value, detail, children }) {
  return (
    <div className={styles.card} aria-label={title}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrap} aria-hidden="true">
          <Icon />
        </div>
        <h4 className={styles.cardTitle}>{title}</h4>
      </div>
      <div className={styles.value}>{value}</div>
      {detail && <p className={styles.detail}>{detail}</p>}
      {children}
    </div>
  );
}

function Breakdown({ passed, warnings, failed }) {
  return (
    <div className={styles.breakdown}>
      <StatusChip label={`${passed} passed`} variant="success" />
      <StatusChip label={`${warnings} warnings`} variant="warning" />
      <StatusChip label={`${failed} failed`} variant="danger" />
    </div>
  );
}

function RuleGroupRow({ group }) {
  return (
    <li className={styles.ruleRow}>
      <span className={styles.ruleName}>{group.category}</span>
      <span className={styles.ruleChips}>
        <StatusChip label={`${group.passed} passed`} variant="success" />
        {group.warnings > 0 && (
          <StatusChip label={`${group.warnings} warnings`} variant="warning" />
        )}
        {group.failed > 0 && (
          <StatusChip label={`${group.failed} failed`} variant="danger" />
        )}
        {group.pending_manual_review > 0 && (
          <StatusChip
            label={`${group.pending_manual_review} to review`}
            variant="info"
          />
        )}
      </span>
    </li>
  );
}

/**
 * Validation Report page.
 *
 * A structured, read-only aggregation of the stored pipeline results for an
 * application: document summary, extraction and business-rule totals, visual
 * detection outcomes and deterministic recommendations. Everything is derived
 * from persisted data; no stage is re-run. Internal identifiers are translated
 * into the employee-facing vocabulary; the printable HTML report is offered for
 * printing.
 */
function ValidationReportPage() {
  const { applicationId } = useParams();
  const { report, application, loading, error, reload } = useReport(applicationId);

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true">
        <ReportSkeleton />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.page}>
        <ErrorState
          message={error ?? 'Validation report not found.'}
          onRetry={reload}
        />
        <Link to="/applications" className={styles.secondaryBtn}>
          <ArrowLeft aria-hidden="true" />
          Back to Applications
        </Link>
      </div>
    );
  }

  const overall = lookupPresentation(OVERALL_STATUS_PRESENTATION, report.overall_status);
  const rules = report.rule_summary;
  const extraction = report.extraction_summary;
  const visual = report.visual_detection_summary;
  const reportLink = getPrintableReportUrl(report.application_id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <h2 className={styles.title}>Validation Report</h2>
          <StatusChip label={overall.label} variant={overall.variant} />
          {application && <ApplicationStatusBadge status={application.status} />}
        </div>
        <p className={styles.subtitle}>
          Structured review of the stored results for application #{report.application_id}.
        </p>
        <div className={styles.meta}>
          <span>Report version {report.report_version}</span>
          <span>Generated {formatDateTime(report.generated_at)}</span>
          <span>Submitted by {report.application.created_by}</span>
        </div>
      </header>

      <div className={styles.actions}>
        <button type="button" className={styles.refreshBtn} onClick={reload}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </button>
        <a href={reportLink} target="_blank" rel="noreferrer" className={styles.secondaryBtn}>
          <Printer aria-hidden="true" />
          Printable Report
        </a>
        <Link to={`/applications/${report.application_id}/review`} className={styles.primaryBtn}>
          <ShieldCheck aria-hidden="true" />
          Final Review
        </Link>
        <Link to={`/applications/${report.application_id}`} className={styles.secondaryBtn}>
          <ArrowLeft aria-hidden="true" />
          Back to Application
        </Link>
      </div>

      <section className={styles.grid} aria-label="Report summary">
        <SummaryCard
          icon={FileText}
          title="Documents"
          value={report.document_summary.length}
          detail="Documents included in this report"
        />
        <SummaryCard
          icon={ListChecks}
          title="Business Rules"
          value={rules.total}
          detail="Stored rule outcomes across all checks"
        >
          <Breakdown passed={rules.passed} warnings={rules.warnings} failed={rules.failed} />
        </SummaryCard>
        <SummaryCard
          icon={TextCursorInput}
          title="Extracted Fields"
          value={extraction.total_fields}
          detail="Fields extracted across the uploaded documents"
        >
          <Breakdown
            passed={extraction.auto_verified + extraction.human_corrected}
            warnings={extraction.pending_review}
            failed={extraction.cannot_verify}
          />
        </SummaryCard>
        <SummaryCard
          icon={Fingerprint}
          title="Visual Checks"
          value={visual.documents_checked}
          detail="Documents with a stored detection outcome"
        >
          <div className={styles.breakdown}>
            <StatusChip label={`${visual.signature_detected + visual.stamp_detected} found`} variant="success" />
            <StatusChip
              label={`${visual.signature_missing + visual.stamp_missing} missing`}
              variant="warning"
            />
          </div>
        </SummaryCard>
        <SummaryCard
          icon={Stamp}
          title="Overall Confidence"
          value={
            extraction.overall_confidence === null
              ? '\u2014'
              : `${Math.round(extraction.overall_confidence * 100)}%`
          }
          detail="Average confidence across extracted fields"
        />
      </section>

      {rules.by_category.length > 0 && (
        <section className={styles.section} aria-label="Rule groups">
          <h3 className={styles.sectionTitle}>Checks by Group</h3>
          <ul className={styles.ruleList}>
            {rules.by_category.map((group) => (
              <RuleGroupRow key={group.category} group={group} />
            ))}
          </ul>
        </section>
      )}

      {report.document_summary.length > 0 && (
        <section className={styles.section} aria-label="Document summary">
          <h3 className={styles.sectionTitle}>Documents</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Processing</th>
                  <th>Text Extraction</th>
                  <th>Confidence</th>
                  <th>Technical Validation</th>
                  <th>Analysis</th>
                </tr>
              </thead>
              <tbody>
                {report.document_summary.map((item) => {
                  const docConfig = getDocumentTypeConfig(item.document_type);
                  const processing = getDocumentStatus(item.processing_status);
                  const ocr = lookupPresentation(OCR_STATUS_PRESENTATION, item.ocr_status);
                  const technical = lookupPresentation(
                    TECHNICAL_STATUS_PRESENTATION,
                    item.technical_validation_status
                  );
                  const analysis = lookupPresentation(
                    ANALYSIS_STATUS_PRESENTATION,
                    item.analysis_status
                  );
                  return (
                    <tr key={item.document_id}>
                      <td>
                        <span className={styles.docLabel}>{docConfig.label}</span>
                        <span className={styles.docId}>#{item.document_id}</span>
                      </td>
                      <td>
                        <StatusChip label={processing.label} variant={processing.variant} />
                      </td>
                      <td>
                        <StatusChip label={ocr.label} variant={ocr.variant} />
                      </td>
                      <td className={styles.confidenceCell}>
                        {item.ocr_confidence === null
                          ? '\u2014'
                          : `${Math.round(item.ocr_confidence * 100)}%`}
                      </td>
                      <td>
                        <StatusChip label={technical.label} variant={technical.variant} />
                      </td>
                      <td>
                        <StatusChip label={analysis.label} variant={analysis.variant} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className={styles.section} aria-label="Extraction details">
        <h3 className={styles.sectionTitle}>Extracted Fields</h3>
        <div className={styles.statList}>
          <div className={styles.statItem}>
            <CheckCircle2 aria-hidden="true" />
            <span className={styles.statValue}>{extraction.auto_verified}</span>
            <span className={styles.statLabel}>verified automatically</span>
          </div>
          <div className={styles.statItem}>
            <CheckCircle2 aria-hidden="true" />
            <span className={styles.statValue}>{extraction.human_corrected}</span>
            <span className={styles.statLabel}>confirmed by a reviewer</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.statPending}`}>
              {extraction.pending_review}
            </span>
            <span className={styles.statLabel}>pending review</span>
          </div>
          <div className={styles.statItem}>
            <XCircle aria-hidden="true" />
            <span className={`${styles.statValue} ${styles.statFailed}`}>
              {extraction.cannot_verify}
            </span>
            <span className={styles.statLabel}>could not be verified</span>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-label="Visual detection summary">
        <h3 className={styles.sectionTitle}>Visual Checks</h3>
        <div className={styles.statList}>
          <div className={styles.statItem}>
            <Fingerprint aria-hidden="true" />
            <span className={styles.statValue}>{visual.signature_detected}</span>
            <span className={styles.statLabel}>signatures found</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.statWarning}`}>
              {visual.signature_missing}
            </span>
            <span className={styles.statLabel}>signatures missing</span>
          </div>
          <div className={styles.statItem}>
            <Stamp aria-hidden="true" />
            <span className={styles.statValue}>{visual.stamp_detected}</span>
            <span className={styles.statLabel}>stamps found</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.statWarning}`}>
              {visual.stamp_missing}
            </span>
            <span className={styles.statLabel}>stamps missing</span>
          </div>
        </div>
      </section>

      {report.recommendations.length > 0 && (
        <section className={styles.section} aria-label="Recommendations">
          <h3 className={styles.sectionTitle}>Recommendations</h3>
          <ul className={styles.recommendationList}>
            {report.recommendations.map((recommendation) => (
              <li key={recommendation.code} className={styles.recommendationItem}>
                <span className={styles.recommendationDot} aria-hidden="true" />
                {recommendation.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default ValidationReportPage;
