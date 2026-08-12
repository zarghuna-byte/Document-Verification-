import api from './api';

/**
 * Fetch the full validation report for an application.
 *
 * The endpoint aggregates stored pipeline results (documents, OCR, extracted
 * fields, business and technical validation results and visual detections)
 * into a structured report without re-running any stage.
 *
 * @param {number|string} applicationId Application id.
 * @returns {Promise<object>} The validation report.
 */
export function getValidationReport(applicationId) {
  return api
    .get(`/applications/${applicationId}/validation-report`)
    .then((response) => response.data);
}

/**
 * Fetch the condensed validation summary for an application.
 *
 * @param {number|string} applicationId Application id.
 * @returns {Promise<object>} The condensed report.
 */
export function getValidationSummary(applicationId) {
  return api
    .get(`/applications/${applicationId}/validation-summary`)
    .then((response) => response.data);
}

/**
 * Build the printable HTML report URL for an application.
 *
 * The endpoint renders the same report as a standalone HTML document from the
 * backend template, so opening it in a new tab works for printing.
 *
 * @param {number|string} applicationId Application id.
 * @returns {string} Absolute URL of the printable report.
 */
export function getPrintableReportUrl(applicationId) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  return `${baseURL}/applications/${applicationId}/validation-report/html`;
}
