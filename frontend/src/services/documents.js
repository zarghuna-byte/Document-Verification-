import api from './api';

/**
 * Build a multipart form body for a document upload request.
 *
 * The backend expects two fields: `file` (the binary) and `document_type` (the
 * backend enum value).
 *
 * @param {object} params
 * @param {string} params.documentType Backend document type value.
 * @param {File} params.file The selected file.
 * @returns {FormData}
 */
function buildFormData({ documentType, file }) {
  const formData = new FormData();
  formData.append('document_type', documentType);
  formData.append('file', file);
  return formData;
}

/**
 * List the documents belonging to an application.
 *
 * @param {number|string} applicationId Application id.
 * @returns {Promise<{items: object[], total: number}>}
 */
export function listDocuments(applicationId) {
  return api.get(`/applications/${applicationId}/documents`).then((response) => response.data);
}

/**
 * Upload a new document for an application.
 *
 * @param {object} params
 * @param {number|string} params.applicationId Application id.
 * @param {string} params.documentType Backend document type value.
 * @param {File} params.file The selected file.
 * @param {Function} [params.onUploadProgress] Axios upload progress callback.
 * @returns {Promise<object>} The uploaded document metadata.
 */
export function uploadDocument({ applicationId, documentType, file, onUploadProgress }) {
  return api
    .post(`/applications/${applicationId}/documents`, buildFormData({ documentType, file }), {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((response) => response.data.document);
}

/**
 * Replace an existing document for an application.
 *
 * @param {object} params
 * @param {number|string} params.applicationId Application id.
 * @param {number|string} params.documentId Document id to replace.
 * @param {string} params.documentType Backend document type value.
 * @param {File} params.file The replacement file.
 * @param {Function} [params.onUploadProgress] Axios upload progress callback.
 * @returns {Promise<object>} The replacement document metadata.
 */
export function replaceDocument({ applicationId, documentId, documentType, file, onUploadProgress }) {
  return api
    .put(
      `/applications/${applicationId}/documents/${documentId}`,
      buildFormData({ documentType, file }),
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    )
    .then((response) => response.data.document);
}

/**
 * Delete a document belonging to an application.
 *
 * @param {object} params
 * @param {number|string} params.applicationId Application id.
 * @param {number|string} params.documentId Document id to delete.
 * @returns {Promise<void>}
 */
export function deleteDocument({ applicationId, documentId }) {
  return api.delete(`/applications/${applicationId}/documents/${documentId}`).then(() => undefined);
}
