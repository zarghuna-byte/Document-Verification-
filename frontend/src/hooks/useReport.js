import { useCallback, useEffect, useState } from 'react';

import { getApplication } from '../services/applications';
import { getValidationReport, getValidationSummary } from '../services/reports';
import { getApiErrorMessage } from '../utils/apiError';

/**
 * Load a validation report for one application, with reload support.
 *
 * The full report and the condensed summary are fetched in parallel; the
 * application info arrives with the report itself, but the page also loads the
 * live application row so the status badge stays current.
 *
 * @param {number|string} applicationId Application id.
 */
export function useReport(applicationId) {
  const [report, setReport] = useState(null);
  const [summary, setSummary] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportData, summaryData, applicationData] = await Promise.all([
        getValidationReport(applicationId),
        getValidationSummary(applicationId),
        getApplication(applicationId),
      ]);
      setReport(reportData);
      setSummary(summaryData);
      setApplication(applicationData);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { report, summary, application, loading, error, reload };
}
