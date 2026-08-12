import { useCallback, useEffect, useState } from 'react';

import { getApplication } from '../services/applications';
import { getCompleteness } from '../services/verification';
import { getApiErrorMessage } from '../utils/apiError';

/**
 * Load the completeness report for one application, with reload support.
 *
 * The completeness check is deterministic and read-only: the report carries
 * per-topic and per-slot presence for the 18 required uploads. The live
 * application row is loaded alongside so the header badge stays current.
 *
 * @param {number|string} applicationId Application id.
 */
export function useCompleteness(applicationId) {
  const [report, setReport] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [completeness, applicationData] = await Promise.all([
        getCompleteness(applicationId),
        getApplication(applicationId),
      ]);
      setReport(completeness);
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

  return { report, application, loading, error, reload };
}
