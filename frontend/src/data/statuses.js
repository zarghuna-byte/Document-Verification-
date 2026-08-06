/**
 * Status labels and colour variants.
 *
 * The `variant` values map to StatusChip CSS classes. Application statuses
 * mirror the backend `ApplicationStatus` enum; document statuses cover the
 * backend `DocumentProcessingStatus` values plus client-side states
 * (MISSING and UPLOADING) that never leave the browser.
 */

export const APPLICATION_STATUSES = [
  { value: 'SUBMITTED', label: 'Submitted', variant: 'info' },
  { value: 'PROCESSING', label: 'Processing', variant: 'info' },
  { value: 'PENDING_REVIEW', label: 'Pending Review', variant: 'warning' },
  { value: 'APPROVED', label: 'Approved', variant: 'success' },
  { value: 'REJECTED', label: 'Rejected', variant: 'danger' },
  { value: 'CORRECTED', label: 'Corrected', variant: 'neutral' },
];

export const DOCUMENT_STATUSES = [
  { value: 'UPLOADED', label: 'Uploaded', variant: 'success' },
  { value: 'PENDING', label: 'Uploaded', variant: 'success' },
  { value: 'PROCESSING', label: 'Processing', variant: 'info' },
  { value: 'COMPLETED', label: 'Uploaded', variant: 'success' },
  { value: 'FAILED', label: 'Failed', variant: 'danger' },
  { value: 'MISSING', label: 'Missing', variant: 'neutral' },
  { value: 'UPLOADING', label: 'Uploading', variant: 'info' },
];

/**
 * Look up a status entry by its value.
 *
 * @param {Array} statuses A status catalogue.
 * @param {string} value The raw status value.
 * @returns {object} The matching entry, or a neutral fallback.
 */
function findStatus(statuses, value) {
  return statuses.find((status) => status.value === value) ?? {
    label: value ?? 'Unknown',
    variant: 'neutral',
  };
}

export function getApplicationStatus(value) {
  return findStatus(APPLICATION_STATUSES, value);
}

export function getDocumentStatus(value) {
  return findStatus(DOCUMENT_STATUSES, value);
}
