import { useCallback, useEffect, useMemo, useState } from 'react';

import { Download, RefreshCw, Search, ShieldCheck } from 'lucide-react';

import ErrorState from '../../components/common/ErrorState/ErrorState';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Spinner from '../../components/common/Spinner/Spinner';
import { useToast } from '../../components/common/Toast/ToastContext';
import { exportLearningDataset, getLearningDataset, getLearningStatistics } from '../../services/admin';
import { getDocumentTypeConfig } from '../../data/documents';
import { formatDateTime } from '../../utils/format';
import { getApiErrorMessage } from '../../utils/apiError';
import styles from './ContinuousLearningPage.module.css';

function downloadText(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function MetaCard({ label, value }) {
  return (
    <div className={styles.metaCard}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value}</span>
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
 * Continuous Learning admin page.
 *
 * A read-only tool over the curated machine-learning dataset built from
 * reviewer corrections: reproducible dataset metadata, deterministic
 * statistics, a searchable record table and JSON/CSV exports. Marked as
 * restricted; surfaced from the Settings page.
 */
function ContinuousLearningPage() {
  const toast = useToast();
  const [dataset, setDataset] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, stats] = await Promise.all([
        getLearningDataset(),
        getLearningStatistics(),
      ]);
      setDataset(data);
      setStatistics(stats);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const records = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return dataset?.records ?? [];
    }
    return (dataset?.records ?? []).filter((record) =>
      [
        record.field_name,
        record.human_corrected_value,
        record.original_ocr_value,
        getDocumentTypeConfig(record.document_type).label,
        String(record.application_id),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [dataset, search]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const result = await exportLearningDataset(format);
      downloadText(
        result.content,
        result.filename,
        format === 'csv' ? 'text/csv' : 'application/json'
      );
      toast.success(`Exported ${result.record_count} dataset records.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true">
        <div className={styles.center}>
          <Spinner size="medium" />
        </div>
      </div>
    );
  }

  if (error || !dataset || !statistics) {
    return (
      <div className={styles.page}>
        <ErrorState
          message={error ?? 'Learning dataset not available.'}
          onRetry={load}
        />
      </div>
    );
  }

  const metadata = dataset.metadata;
  const completeness = statistics.dataset_completeness ?? {};

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <h2 className={styles.title}>Continuous Learning</h2>
          <span className={styles.restricted}>
            <ShieldCheck aria-hidden="true" />
            Restricted
          </span>
        </div>
        <p className={styles.subtitle}>
          The curated training dataset built from reviewer corrections, with
          reproducible metadata and exports.
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

      <section className={styles.metaGrid} aria-label="Dataset metadata">
        <MetaCard label="Dataset version" value={metadata.dataset_version} />
        <MetaCard label="Project version" value={metadata.project_version} />
        <MetaCard label="Records" value={metadata.record_count} />
        <MetaCard label="Generated" value={formatDateTime(metadata.created_at)} />
        <div className={styles.metaCardWide}>
          <span className={styles.metaLabel}>Content hash</span>
          <span className={`${styles.metaValue} ${styles.metaHash}`}>{metadata.dataset_hash}</span>
        </div>
      </section>

      <section className={styles.stats} aria-label="Dataset statistics">
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total records</span>
            <span className={styles.statValue}>{statistics.total_records}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Average confidence</span>
            <span className={styles.statValue}>
              {statistics.average_confidence === null
                ? '\u2014'
                : `${Math.round(statistics.average_confidence * 100)}%`}
            </span>
          </div>
          {Object.entries(completeness).length > 0 && (
            <div className={styles.completenessCard}>
              <span className={styles.statLabel}>Dataset completeness</span>
              <div className={styles.completenessList}>
                {Object.entries(completeness).map(([key, value]) => (
                  <span key={key} className={styles.completenessChip}>
                    {key}: {Math.round(value * 100)}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.distributionGrid}>
          <Distribution title="By document type" distribution={statistics.document_distribution} />
          <Distribution title="By field" distribution={statistics.field_distribution} />
          <Distribution title="By confidence bucket" distribution={statistics.confidence_distribution} />
          <Distribution title="By reviewer" distribution={statistics.reviewer_distribution} />
        </div>
      </section>

      <section className={styles.records} aria-label="Dataset records">
        <div className={styles.recordsHeader}>
          <h3 className={styles.recordsTitle}>
            Records <span className={styles.recordsTotal}>{records.length}</span>
          </h3>
          <div className={styles.searchBox}>
            <Search aria-hidden="true" />
            <input
              type="text"
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records"
            />
          </div>
        </div>

        {records.length === 0 ? (
          <EmptyState
            title="No dataset records"
            message="No records match the current search."
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Document</th>
                  <th>Field</th>
                  <th>OCR Value</th>
                  <th>Corrected Value</th>
                  <th>Confidence</th>
                  <th>Decision</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={`${record.application_id}-${record.field_name}-${index}`}>
                    <td>#{record.application_id}</td>
                    <td>{getDocumentTypeConfig(record.document_type).label}</td>
                    <td className={styles.cellStrong}>{record.field_name}</td>
                    <td className={styles.monoCell}>{record.original_ocr_value}</td>
                    <td className={styles.monoCell}>{record.human_corrected_value}</td>
                    <td>{Math.round(record.confidence_score * 100)}%</td>
                    <td>{record.decision ?? '\u2014'}</td>
                    <td className={styles.cellDate}>{formatDateTime(record.recorded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ContinuousLearningPage;
