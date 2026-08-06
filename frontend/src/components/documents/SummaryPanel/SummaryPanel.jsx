import { ArrowRight } from 'lucide-react';

import UploadProgress from '../UploadProgress/UploadProgress';
import styles from './SummaryPanel.module.css';

/**
 * Right-hand summary panel for the upload page.
 *
 * Tracks how many of the required documents have been uploaded and gates the
 * "Continue" action until all of them are present. Supporting documents are
 * optional and do not affect progress.
 *
 * @param {object} props
 * @param {Array<object>} props.documents Uploaded documents.
 * @param {Array<object>} props.requiredTypes Required document catalogue entries.
 * @param {Function} props.onContinue Callback fired when Continue is clicked.
 */
function SummaryPanel({ documents, requiredTypes, onContinue }) {
  const uploadedCount = requiredTypes.filter(({ type }) =>
    documents.some((document) => document.document_type === type)
  ).length;
  const total = requiredTypes.length;
  const remaining = Math.max(0, total - uploadedCount);
  const progress = total === 0 ? 0 : Math.round((uploadedCount / total) * 100);
  const ready = remaining === 0;

  return (
    <aside className={styles.panel}>
      <h3 className={styles.title}>Upload Summary</h3>

      <div className={styles.counts}>
        <div className={styles.count}>
          <span className={styles.countValue}>{uploadedCount}</span>
          <span className={styles.countLabel}>Uploaded</span>
        </div>
        <div className={styles.count}>
          <span className={styles.countValue}>{remaining}</span>
          <span className={styles.countLabel}>Remaining</span>
        </div>
      </div>

      <UploadProgress progress={progress} label={`${progress}% complete`} />

      <p className={styles.note}>
        {ready
          ? 'All required documents have been uploaded.'
          : `Upload ${remaining} more required document${remaining === 1 ? '' : 's'} to continue.`}
      </p>

      <button
        className={styles.continue}
        type="button"
        disabled={!ready}
        onClick={onContinue}
      >
        Continue
        <ArrowRight aria-hidden="true" />
      </button>
    </aside>
  );
}

export default SummaryPanel;
