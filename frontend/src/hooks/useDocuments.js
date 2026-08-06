import { useCallback, useEffect, useState } from 'react';

import { listDocuments, replaceDocument, uploadDocument } from '../services/documents';
import { deleteDocument } from '../services/documents';
import { getApiErrorMessage } from '../utils/apiError';

/**
 * Load and manage the documents of a single application.
 *
 * `pending` maps a document type to its in-flight operation so each row can
 * render an "Uploading" state with a live progress bar. Action functions never
 * throw; they return `{ ok, error?, document? }` so the page owns toasts and
 * confirmations.
 *
 * @param {number|string} applicationId Application id.
 */
export function useDocuments(applicationId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState({});

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await listDocuments(applicationId);
      setDocuments(items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const findDocument = (documentType) =>
    documents.find((document) => document.document_type === documentType);

  const setPendingProgress = (documentType, progress) => {
    setPending((prev) => ({ ...prev, [documentType]: { ...prev[documentType], progress } }));
  };

  const clearPending = (documentType) => {
    setPending((prev) => {
      const next = { ...prev };
      delete next[documentType];
      return next;
    });
  };

  /**
   * Upload a new file, or replace an existing document of the same type.
   *
   * @param {object} params
   * @param {string} params.documentType Backend document type value.
   * @param {File} params.file The selected file.
   */
  const uploadFile = useCallback(
    async ({ documentType, file }) => {
      const existing = findDocument(documentType);
      setPending((prev) => ({
        ...prev,
        [documentType]: { phase: existing ? 'replace' : 'upload', progress: 0 },
      }));

      const onUploadProgress = (event) => {
        if (event.total) {
          setPendingProgress(documentType, Math.round((event.loaded / event.total) * 100));
        }
      };

      try {
        const document = existing
          ? await replaceDocument({
              applicationId,
              documentId: existing.id,
              documentType,
              file,
              onUploadProgress,
            })
          : await uploadDocument({ applicationId, documentType, file, onUploadProgress });

        clearPending(documentType);
        setDocuments((prev) => [
          ...prev.filter((doc) => doc.document_type !== documentType),
          document,
        ]);
        return { ok: true, document };
      } catch (err) {
        clearPending(documentType);
        return { ok: false, error: getApiErrorMessage(err) };
      }
    },
    [applicationId, documents]
  );

  const removeDocument = useCallback(
    async (document) => {
      try {
        await deleteDocument({ applicationId, documentId: document.id });
        setDocuments((prev) => prev.filter((doc) => doc.id !== document.id));
        return { ok: true };
      } catch (err) {
        return { ok: false, error: getApiErrorMessage(err) };
      }
    },
    [applicationId]
  );

  return {
    documents,
    loading,
    error,
    reload,
    pending,
    findDocument,
    uploadFile,
    removeDocument,
  };
}
