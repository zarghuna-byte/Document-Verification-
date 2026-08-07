import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';

import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState/ErrorState';
import Spinner from '../../components/common/Spinner/Spinner';
import { useToast } from '../../components/common/Toast/ToastContext';
import DocumentList from '../../components/documents/DocumentList/DocumentList';
import SummaryPanel from '../../components/documents/SummaryPanel/SummaryPanel';
import UploadDropzone from '../../components/documents/UploadDropzone/UploadDropzone';
import { useDocuments } from '../../hooks/useDocuments';
import {
  getDocumentTypeConfig,
  REQUIRED_DOCUMENT_TYPES,
  SUPPORTING_DOCUMENT_TYPES,
} from '../../data/documents';
import styles from './UploadDocumentsPage.module.css';

/**
 * Document upload page for one application.
 *
 * Left column holds the document checklist and the shared upload dropzone;
 * right column holds the summary panel. Choosing a file stages it in the
 * dropzone; the employee confirms with the explicit Upload button. Uploading,
 * replacing and deleting are confirmed, toasted and surfaced per-row via the
 * documents hook. The session tally reports how many files uploaded or failed,
 * and "Continue to Document Completeness" opens the completeness module.
 */
function UploadDocumentsPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { documents, loading, error, reload, pending, findDocument, uploadFile, removeDocument } =
    useDocuments(applicationId);

  const [activeType, setActiveType] = useState(null);
  const [replaceConfirmType, setReplaceConfirmType] = useState(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState(null);
  const [sessionTally, setSessionTally] = useState({ uploaded: 0, failed: 0 });

  const activeConfig = activeType ? getDocumentTypeConfig(activeType) : null;
  const activePending = activeType ? pending[activeType] : null;

  const handleUpload = async (file) => {
    if (!activeType) {
      return;
    }
    const result = await uploadFile({ documentType: activeType, file });
    if (result.ok) {
      setSessionTally((prev) => ({ ...prev, uploaded: prev.uploaded + 1 }));
      toast.success(`${activeConfig.label} uploaded successfully.`);
    } else {
      setSessionTally((prev) => ({ ...prev, failed: prev.failed + 1 }));
      toast.error(result.error);
    }
  };

  const handleReplaceConfirmed = () => {
    setActiveType(replaceConfirmType);
    setReplaceConfirmType(null);
  };

  const handleDeleteConfirmed = async () => {
    const document = findDocument(deleteConfirmType);
    setDeleteConfirmType(null);
    if (!document) {
      return;
    }
    const result = await removeDocument(document);
    if (result.ok) {
      toast.success('Document deleted successfully.');
    } else {
      toast.error(result.error);
    }
  };

  const deleteTarget = deleteConfirmType ? getDocumentTypeConfig(deleteConfirmType) : null;
  const replaceTarget = replaceConfirmType ? getDocumentTypeConfig(replaceConfirmType) : null;

  if (loading) {
    return (
      <div className={styles.center} aria-busy="true">
        <Spinner size="medium" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to={`/applications/${applicationId}`} className={styles.backLink}>
        <ArrowLeft aria-hidden="true" />
        Back to Application #{applicationId}
      </Link>

      <header className={styles.header}>
        <h2 className={styles.title}>Upload Documents</h2>
        <p className={styles.subtitle}>
          Attach the required files for application #{applicationId}.
        </p>
      </header>

      {error ? (
        <ErrorState message="Unable to load documents." onRetry={reload} />
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            <DocumentList
              requiredTypes={REQUIRED_DOCUMENT_TYPES}
              supportingTypes={SUPPORTING_DOCUMENT_TYPES}
              findDocument={findDocument}
              pending={pending}
              onUpload={setActiveType}
              onReplace={setReplaceConfirmType}
              onDelete={setDeleteConfirmType}
            />
            <UploadDropzone
              targetLabel={activeConfig?.label ?? null}
              busy={Boolean(activePending)}
              onUpload={handleUpload}
            />
          </div>

          <SummaryPanel
            documents={documents}
            requiredTypes={REQUIRED_DOCUMENT_TYPES}
            sessionTally={sessionTally}
            onContinue={() => navigate('/completeness')}
          />
        </div>
      )}

      <ConfirmDialog
        open={replaceConfirmType !== null}
        title="Replace this document?"
        message={`An existing file for "${replaceTarget?.label}" will be replaced with the new upload. This action cannot be undone.`}
        confirmLabel="Replace"
        tone="primary"
        onConfirm={handleReplaceConfirmed}
        onCancel={() => setReplaceConfirmType(null)}
      />

      <ConfirmDialog
        open={deleteConfirmType !== null}
        title="Delete this document?"
        message={`"${deleteTarget?.label}" will be permanently removed from application #${applicationId}.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirmType(null)}
      />
    </div>
  );
}

export default UploadDocumentsPage;
