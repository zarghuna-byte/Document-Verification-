import api from './api';

/**
 * List recent activity events, most recent first.
 *
 * @param {object} [options]
 * @param {number} [options.limit] Maximum number of events to return.
 * @returns {Promise<{application_id: number|null, total: number, events: object[]}>}
 */
export function listActivity({ limit } = {}) {
  return api
    .get('/activity', { params: { ...(limit ? { limit } : {}) } })
    .then((response) => response.data);
}

/**
 * List recent activity events scoped to a single application.
 *
 * @param {number|string} applicationId Application id.
 * @param {object} [options]
 * @param {number} [options.limit] Maximum number of events to return.
 * @returns {Promise<{application_id: number|null, total: number, events: object[]}>}
 */
export function listApplicationActivity(applicationId, { limit } = {}) {
  return api
    .get(`/applications/${applicationId}/activity`, {
      params: { ...(limit ? { limit } : {}) },
    })
    .then((response) => response.data);
}
