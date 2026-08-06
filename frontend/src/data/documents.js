/**
 * Document type catalogue.
 *
 * Mirrors the backend `DocumentType` enum (app/database/models/enums.py) so the
 * upload UI always sends a value the API accepts. The eight required documents
 * plus the supporting document group are displayed in this fixed order.
 */

export const DOCUMENT_GROUP_REQUIRED = 'required';
export const DOCUMENT_GROUP_SUPPORTING = 'supporting';

export const DOCUMENT_TYPES = [
  {
    type: 'TRIPARTITE_AGREEMENT',
    label: 'Tripartite Agreement',
    group: DOCUMENT_GROUP_REQUIRED,
  },
  {
    type: 'BILATERAL_AGREEMENT',
    label: 'Bilateral Agreement',
    group: DOCUMENT_GROUP_REQUIRED,
  },
  {
    type: 'ACCOUNT_MAINTENANCE_CERTIFICATE',
    label: 'Account Maintenance Certificate',
    group: DOCUMENT_GROUP_REQUIRED,
  },
  {
    type: 'ONE_LINK_LETTER',
    label: '1-Link Application Form',
    group: DOCUMENT_GROUP_REQUIRED,
  },
  {
    type: 'AUTHORITY_LETTER',
    label: 'Authority Letter',
    group: DOCUMENT_GROUP_REQUIRED,
  },
  {
    type: 'SCHEDULE_OF_CHARGES',
    label: 'Schedule of Charges',
    group: DOCUMENT_GROUP_REQUIRED,
  },
  {
    type: 'BUSINESS_REQUIREMENT_DOCUMENT',
    label: 'Business Requirement Document',
    group: DOCUMENT_GROUP_REQUIRED,
  },
  {
    type: 'FORMAL_REQUEST_LETTER',
    label: 'Formal Request Letter',
    group: DOCUMENT_GROUP_REQUIRED,
  },
  {
    type: 'OTHER_SUPPORTING_DOCUMENT',
    label: 'Supporting Documents',
    group: DOCUMENT_GROUP_SUPPORTING,
  },
];

export const REQUIRED_DOCUMENT_TYPES = DOCUMENT_TYPES.filter(
  ({ group }) => group === DOCUMENT_GROUP_REQUIRED
);

export const SUPPORTING_DOCUMENT_TYPES = DOCUMENT_TYPES.filter(
  ({ group }) => group === DOCUMENT_GROUP_SUPPORTING
);

/**
 * Look up the catalogue entry for a document type value.
 *
 * @param {string} type A backend `DocumentType` value.
 * @returns {object} The matching catalogue entry, or the fallback entry.
 */
export function getDocumentTypeConfig(type) {
  return DOCUMENT_TYPES.find((entry) => entry.type === type) ?? DOCUMENT_TYPES[0];
}

/**
 * File formats the backend accepts (app/upload/constants.py). Client-side
 * validation uses the exact same allow-list so no valid upload is ever blocked
 * by the browser, and unsupported files fail fast before hitting the network.
 */
export const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.tif',
  '.tiff',
];

export const ACCEPTED_TYPES_TEXT = 'PDF, PNG, JPG, JPEG, DOC, DOCX, TIF, TIFF';

export const MAX_FILE_SIZE_MB = 25;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validate a selected file before upload.
 *
 * @param {File} file The file selected by the user.
 * @returns {string | null} An error message, or null when the file is valid.
 */
export function validateUploadFile(file) {
  if (!file) {
    return 'No file was provided.';
  }
  if (file.size === 0) {
    return 'The selected file is empty.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB} MB.`;
  }
  const extension = `.${file.name.split('.').pop().toLowerCase()}`;
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return `Unsupported file type. Accepted formats: ${ACCEPTED_TYPES_TEXT}.`;
  }
  return null;
}
