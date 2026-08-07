import { Link } from 'react-router-dom';

import { Download, FileText, UploadCloud } from 'lucide-react';

import EmptyState from '../../common/EmptyState/EmptyState';
import ErrorState from '../../common/ErrorState/ErrorState';
import Spinner from '../../common/Spinner/Spinner';
import StatusChip from '../../common/StatusChip/StatusChip';
import { getDocumentTypeConfig } from '../../../data/documents';
import { getDocumentStatus } from '../../../data/statuses';
import { getDocumentDownloadUrl } from '../../../services/documents';
import { useDocuments } from '../../../hooks/useDocuments';
import styles from './DocumentsSection.module.css';

/**
 * Read-only documents section for the application details page.
 *
 * Loads the uploaded documents for the application and lists them with their
 * type, filename and processing status, plus a download action and a shortcut
 * to the upload page. Never invents rows: it shows a loading state, a fixed
 * error message with retry, or a genuine empty state.
 *
 * @param {object} props
 * @param {number|string} props.applicationId Application id.
 */
function DocumentsSection({ applicationId }) {
  const { documents, loading, error, reload } = useDocuments(applicationId);

  return (
    <section className={styles.section} aria-label="Documents">
      <div className={styles.header}>
        <div className={styles.iconWrap} aria-hidden="true">
          <FileText />
        </div>
        <div>
          <h3 className={styles.title}>Documents</h3>
          <p className={styles.subtitle}>Uploaded files for this application.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.center} aria-busy="true">
          <Spinner size="medium" />
        </div>
      ) : error ? (
        <ErrorState message="Unable to load documents." onRetry={reload} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents uploaded yet"
          message="Upload the required financial documents to begin verification."
          action={
            <Link to={`/applications/${applicationId}/upload`} className={styles.uploadLink}>
              <UploadCloud aria-hidden="true" />
              Upload Documents
            </Link>
          }
        />
      ) : (
        <ul className={styles.list}>
          {documents.map((document) => {
            const config = getDocumentTypeConfig(document.document_type);
            const status = getDocumentStatus(document.processing_status);
            return (
              <li className={styles.row} key={document.id}>
                <div className={styles.rowIcon} aria-hidden="true">
                  <FileText />
                </div>
                <div className={styles.meta}>
                  <span className={styles.name}>{config.label}</span>
                  <span className={styles.filename}>{document.original_filename}</span>
                </div>
                <StatusChip label={status.label} variant={status.variant} />
                <a
                  className={styles.download}
                  href={getDocumentDownloadUrl(document.id)}
                  aria-label={`Download ${document.original_filename}`}
                >
                  <Download aria-hidden="true" />
                  Download
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default DocumentsSection;
