import api from './api';

/**
 * List feedback entries with optional filters and pagination.
 *
 * @param {object} [params] Query parameters.
 * @param {number} [params.offset] Number of entries to skip.
 * @param {number} [params.limit] Maximum number of entries to return.
 * @param {string} [params.decision] Review decision filter.
 * @param {string} [params.field_name] Field name filter.
 * @param {string} [params.reviewer] Reviewer filter.
 * @param {string} [params.document_type] Document type filter.
 * @returns {Promise<{total: number, offset: number, limit: number, items: object[]}>}
 */
export function listFeedback(params = {}) {
  return api
    .get('/feedback', { params })
    .then((response) => response.data);
}

/**
 * Fetch deterministic statistics over the filtered feedback dataset.
 *
 * @param {object} [params] The same optional filters as `listFeedback`.
 * @returns {Promise<object>} The aggregated statistics.
 */
export function getFeedbackStatistics(params = {}) {
  return api
    .get('/feedback/statistics', { params })
    .then((response) => response.data);
}

/**
 * Export the filtered feedback dataset as JSON or CSV.
 *
 * The response embeds the serialized dataset as text together with export
 * metadata, so the caller builds a downloadable blob client-side.
 *
 * @param {'json'|'csv'} format Export format.
 * @param {object} [params] The same optional filters as `listFeedback`.
 * @returns {Promise<{format: string, filename: string, record_count: number, content: string}>}
 */
export function exportFeedback(format, params = {}) {
  return api
    .get(`/feedback/export/${format}`, { params })
    .then((response) => response.data);
}

/**
 * Fetch the curated continuous learning dataset with its metadata.
 *
 * @returns {Promise<{metadata: object, records: object[]}>}
 */
export function getLearningDataset() {
  return api.get('/continuous-learning/dataset').then((response) => response.data);
}

/**
 * Fetch deterministic statistics over the curated dataset.
 *
 * @returns {Promise<object>} The aggregated dataset statistics.
 */
export function getLearningStatistics() {
  return api.get('/continuous-learning/statistics').then((response) => response.data);
}

/**
 * Export the curated dataset as JSON or CSV.
 *
 * @param {'json'|'csv'} format Export format.
 * @returns {Promise<{filename: string, record_count: number, content: string}>}
 */
export function exportLearningDataset(format) {
  return api
    .get(`/continuous-learning/export/${format}`)
    .then((response) => response.data);
}
