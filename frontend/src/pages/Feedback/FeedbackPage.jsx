import { useCallback, useEffect, useMemo, useState } from 'react';

import { Download, RefreshCw, ShieldCheck } from 'lucide-react';

import ErrorState from '../../components/common/ErrorState/ErrorState';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Spinner from '../../components/common/Spinner/Spinner';
import { useToast } from '../../components/common/Toast/ToastContext';
import { exportFeedback, getFeedbackStatistics, listFeedback } from '../../services/admin';
import { DOCUMENT_TYPES } from '../../data/documents';
import { formatDateTime } from '../../utils/format';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from './FeedbackPage.module.css';

const PAGE_SIZE = 50;

const DECISION_OPTIONS = [
  { value: 'APPROVE', label: 'Approved' },
  { value: 'CORRECT', label: 'Corrected' },
  { value: 'REJECT', label: 'Rejected' },
  { value: 'CORRECTED', label: 'Corrected (low confidence)' },
];

const ORIGIN_LABELS = {
  LOW_CONFIDENCE_REVIEW: 'Low-confidence review',
  FINAL_HUMAN_REVIEW: 'Final human review',
};

function downloadText(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function StatCard({ title, value, detail }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{title}</span>
      <span className={styles.statValue}>{value}</span>
      {detail && <span className={styles.statDetail}>{detail}</span>}
    </div>
  );
}

function Distribution({ title, distribution }) {
  const entries = Object.entries(distribution ?? {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, count]) => count));
  if (entries.length === 0) {
    return null;
  }
  return (
    <div className={styles.distribution}>
      <h4 className={styles.distributionTitle}>{title}</h4>
      <ul className={styles.distributionList}>
        {entries.map(([key, count]) => (
          <li key={key} className={styles.distributionRow}>
            <span className={styles.distributionKey}>{key}</span>
            <span className={styles.distributionBar}>
              <span
                className={styles.distributionFill}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </span>
            <span className={styles.distributionCount}>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Feedback admin page.
 *
 * A read-only tool over the feedback dataset recorded by the confidence and
 * final human review phases: filters, deterministic statistics, a paginated
 * entry table and JSON/CSV exports. Marked as restricted; surfaced from the
 * Settings page.
 */
function FeedbackPage() {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [documentType, setDocumentType] = useState('');
  const [decision, setDecision] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [minConfidence, setMinConfidence] = useState('');
  const [offset, setOffset] = useState(0);
  const [exporting, setExporting] = useState(null);

  const filters = useMemo(() => {
    const params = {};
    if (documentType) params.document_type = documentType;
    if (decision) params.decision = decision;
    if (reviewer.trim()) params.reviewer = reviewer.trim();
    if (fieldName.trim()) params.field_name = fieldName.trim();
    if (minConfidence !== '' && Number(minConfidence) > 0) {
      params.min_confidence = Number(minConfidence);
    }
    return params;
  }, [documentType, decision, reviewer, fieldName, minConfidence]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [page, stats] = await Promise.all([
        listFeedback({ ...filters, offset, limit: PAGE_SIZE }),
        getFeedbackStatistics(filters),
      ]);
      setEntries(page.items ?? []);
      setTotal(page.total ?? 0);
      setStatistics(stats);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const result = await exportFeedback(format, filters);
      downloadText(
        result.content,
        result.filename,
        format === 'csv' ? 'text/csv' : 'application/json'
      );
      toast.success(`Exported ${result.record_count} feedback entries.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  const resetFilters = () => {
    setDocumentType('');
    setDecision('');
    setReviewer('');
    setFieldName('');
    setMinConfidence('');
    setOffset(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <h2 className={styles.title}>Feedback</h2>
          <span className={styles.restricted}>
            <ShieldCheck aria-hidden="true" />
            Restricted
          </span>
        </div>
        <p className={styles.subtitle}>
          Correction history recorded by the verification phases, with filters,
          statistics and exports.
        </p>
      </header>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.exportBtn}
          onClick={() => handleExport('json')}
          disabled={exporting !== null}
        >
          <Download aria-hidden="true" />
          {exporting === 'json' ? 'Exporting…' : 'Export JSON'}
        </button>
        <button
          type="button"
          className={styles.exportBtn}
          onClick={() => handleExport('csv')}
          disabled={exporting !== null}
        >
          <Download aria-hidden="true" />
          {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
        </button>
        <button type="button" className={styles.refreshBtn} onClick={load}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </button>
      </div>

      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          setOffset(0);
          load();
        }}
      >
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Document type</span>
          <select
            className={styles.select}
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
          >
            <option value="">All types</option>
            {DOCUMENT_TYPES.map(({ type, label }) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Decision</span>
          <select
            className={styles.select}
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
          >
            <option value="">All decisions</option>
            {DECISION_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Reviewer</span>
          <input
            type="text"
            className={styles.textInput}
            value={reviewer}
            onChange={(event) => setReviewer(event.target.value)}
            placeholder="Reviewer name"
          />
        </label>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Field name</span>
          <input
            type="text"
            className={styles.textInput}
            value={fieldName}
            onChange={(event) => setFieldName(event.target.value)}
            placeholder="e.g. account_title"
          />
        </label>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Min confidence</span>
          <input
            type="number"
            className={styles.textInput}
            value={minConfidence}
            onChange={(event) => setMinConfidence(event.target.value)}
            min="0"
            max="1"
            step="0.01"
            placeholder="0.00 – 1.00"
          />
        </label>
        <div className={styles.filterActions}>
          <button type="submit" className={styles.primaryBtn}>
            Apply
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={resetFilters}>
            Reset
          </button>
        </div>
      </form>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          {statistics && (
            <section className={styles.stats} aria-label="Feedback statistics">
              <div className={styles.statGrid}>
                <StatCard title="Total entries" value={statistics.total_entries} />
                <StatCard
                  title="Corrected fields"
                  value={statistics.total_corrected_fields}
                  detail="Fields confirmed or corrected by reviewers"
                />
                <StatCard
                  title="Average confidence"
                  value={
                    statistics.average_confidence === null
                      ? '\u2014'
                      : `${Math.round(statistics.average_confidence * 100)}%`
                  }
                />
              </div>
              <div className={styles.distributionGrid}>
                <Distribution title="By decision" distribution={statistics.corrections_by_decision} />
                <Distribution
                  title="By document type"
                  distribution={statistics.corrections_by_document_type}
                />
                <Distribution title="By reviewer" distribution={statistics.corrections_by_reviewer} />
              </div>
              {statistics.most_corrected_fields.length > 0 && (
                <div className={styles.topFields}>
                  <h4 className={styles.distributionTitle}>Most corrected fields</h4>
                  <div className={styles.topFieldsRow}>
                    {statistics.most_corrected_fields.map((item) => (
                      <span key={item.field_name} className={styles.topField}>
                        <span className={styles.topFieldName}>{item.field_name}</span>
                        <span className={styles.topFieldCount}>{item.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className={styles.entries} aria-label="Feedback entries">
            <div className={styles.entriesHeader}>
              <h3 className={styles.entriesTitle}>
                Entries <span className={styles.entriesTotal}>{total}</span>
              </h3>
              {loading && <Spinner size="small" />}
            </div>

            {!loading && entries.length === 0 ? (
              <EmptyState
                title="No feedback entries"
                message="No corrections match the current filters."
              />
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Field</th>
                      <th>Original Value</th>
                      <th>Corrected Value</th>
                      <th>Confidence</th>
                      <th>Reviewer</th>
                      <th>Decision</th>
                      <th>Origin</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.application_id ? `#${entry.application_id}` : '\u2014'}</td>
                        <td className={styles.cellStrong}>{entry.field_name}</td>
                        <td className={styles.monoCell}>{entry.original_ocr_value ?? '\u2014'}</td>
                        <td className={styles.monoCell}>{entry.human_corrected_value}</td>
                        <td>
                          {entry.confidence_score === null
                            ? '\u2014'
                            : `${Math.round(entry.confidence_score * 100)}%`}
                        </td>
                        <td>{entry.reviewer ?? '\u2014'}</td>
                        <td>{entry.decision ?? '\u2014'}</td>
                        <td>{ORIGIN_LABELS[entry.origin] ?? entry.origin ?? '\u2014'}</td>
                        <td className={styles.cellDate}>{formatDateTime(entry.recorded_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {total > PAGE_SIZE && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  disabled={offset === 0}
                  onClick={() => setOffset(0)}
                >
                  First
                </button>
                <span className={styles.pageIndicator}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  disabled={offset + PAGE_SIZE >= total}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default FeedbackPage;
