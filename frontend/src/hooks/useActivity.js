import { useCallback, useEffect, useState } from 'react';

import { listActivity, listApplicationActivity } from '../services/activity';
import { getApiErrorMessage } from '../utils/apiError';

/**
 * Load recent activity events, optionally scoped to one application.
 *
 * @param {number|string} [applicationId] When provided, only events for this
 *   application are fetched; otherwise the global activity feed is used.
 * @param {object} [options]
 * @param {number} [options.limit] Maximum number of events to load.
 */
export function useActivity(applicationId, { limit } = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = applicationId
        ? await listApplicationActivity(applicationId, { limit })
        : await listActivity({ limit });
      setEvents(response.events ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applicationId, limit]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { events, loading, error, reload };
}
