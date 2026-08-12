import api from './api';

/**
 * Fetch the final human review screen for an application.
 *
 * The payload carries everything the employee needs for the final decision:
 * the validation report, uploaded documents with OCR state, extracted fields
 * with confidence, visual detection outcomes and the checklist state.
 *
 * @param {number|string} applicationId Application id.
 * @returns {Promise<object>} The review screen payload.
 */
export function getReviewScreen(applicationId) {
  return api
    .get(`/applications/${applicationId}/human-review`)
    .then((response) => response.data);
}

/**
 * Submit the final review decision for an application.
 *
 * @param {object} params
 * @param {number|string} params.applicationId Application id.
 * @param {object} params.payload
 * @param {string} params.payload.reviewer_name Reviewer name.
 * @param {'APPROVE'|'CORRECT'|'REJECT'} params.payload.decision Review decision.
 * @param {string} [params.payload.comments] Optional free-form notes.
 * @param {string} [params.payload.rejection_reason] Mandatory for rejections.
 * @param {Array<{item_name: string, is_checked: boolean}>} params.payload.checklist
 * @param {Array<{field_name: string, corrected_value: string, reason?: string}>} params.payload.corrections
 * @returns {Promise<object>} The recorded review summary.
 */
export function submitReview({ applicationId, payload }) {
  return api
    .post(`/applications/${applicationId}/human-review`, payload)
    .then((response) => response.data);
}

/**
 * Fetch the recorded review history for an application.
 *
 * @param {number|string} applicationId Application id.
 * @returns {Promise<{application_id: number, reviews: object[]}>}
 */
export function getReviewHistory(applicationId) {
  return api
    .get(`/applications/${applicationId}/human-review/history`)
    .then((response) => response.data);
}
