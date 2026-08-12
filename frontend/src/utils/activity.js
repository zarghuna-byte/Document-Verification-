/**
 * Employee-facing labels and tones for the backend audit action vocabulary.
 *
 * The backend records machine-readable action identifiers (e.g.
 * `confidence.field_corrected`). These mappers translate them into the shared
 * UI vocabulary without ever exposing technical pipeline names.
 */

const ACTION_PRESENTATION = {
  'rule_engine.validated': { label: 'Application validated', tone: 'success' },
  'normalization.completed': { label: 'Document values normalized', tone: 'success' },
  'confidence.evaluated': { label: 'Fields evaluated for confidence', tone: 'info' },
  'confidence.field_verified': { label: 'Field verified automatically', tone: 'success' },
  'confidence.field_corrected': { label: 'Field value corrected', tone: 'warning' },
  'confidence.field_cannot_verify': { label: 'Field marked for review', tone: 'warning' },
  'confidence.reviewed': { label: 'Low-confidence review completed', tone: 'info' },
  'confidence.processing_halted': { label: 'Processing halted for review', tone: 'danger' },
  'human_review.opened': { label: 'Final review opened', tone: 'info' },
  'human_review.submitted': { label: 'Final review submitted', tone: 'info' },
  'human_review.application_approved': { label: 'Application approved', tone: 'success' },
  'human_review.application_corrected': { label: 'Application marked corrected', tone: 'warning' },
  'human_review.application_rejected': { label: 'Application rejected', tone: 'danger' },
  'human_review.checklist_completed': { label: 'Manual checklist completed', tone: 'info' },
};

/**
 * Resolve a stored audit action to a display label.
 *
 * Unknown actions fall back to a neutral sentence so a future action never
 * renders blank.
 *
 * @param {string} action The stored audit action identifier.
 * @returns {string} The employee-facing label.
 */
export function getActivityLabel(action) {
  const label = ACTION_PRESENTATION[action]?.label;
  if (label) {
    return label;
  }
  const readable = String(action ?? '')
    .replace(/[._-]+/g, ' ')
    .trim();
  return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : 'Activity recorded';
}

/**
 * Resolve a stored audit action to a StatusChip tone.
 *
 * @param {string} action The stored audit action identifier.
 * @returns {'success'|'warning'|'danger'|'info'|'neutral'}
 */
export function getActivityTone(action) {
  return ACTION_PRESENTATION[action]?.tone ?? 'neutral';
}
