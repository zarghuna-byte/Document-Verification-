import { useCallback, useEffect, useState } from 'react';

import { getApplication } from '../services/applications';
import { getReviewHistory, getReviewScreen, submitReview } from '../services/review';
import { getApiErrorMessage } from '../utils/apiError';

/**
 * Load the final review screen for an application, with submission support.
 *
 * The review screen, the recorded review history and the live application row
 * are fetched in parallel. Submitting a decision persists it through the
 * backend, then reloads every payload so the page reflects the recorded review.
 *
 * @param {number|string} applicationId Application id.
 */
export function useReview(applicationId) {
  const [review, setReview] = useState(null);
  const [history, setHistory] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedSummary, setSubmittedSummary] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [screen, reviewHistory, applicationData] = await Promise.all([
        getReviewScreen(applicationId),
        getReviewHistory(applicationId),
        getApplication(applicationId),
      ]);
      setReview(screen);
      setHistory(reviewHistory);
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

  const submit = useCallback(
    async (payload) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const summary = await submitReview({ applicationId, payload });
        setSubmittedSummary(summary);
        await reload();
        return { ok: true, summary };
      } catch (err) {
        const message = getApiErrorMessage(err);
        setSubmitError(message);
        return { ok: false, error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [applicationId, reload]
  );

  return {
    review,
    history,
    application,
    loading,
    error,
    reload,
    submit,
    submitting,
    submitError,
    submittedSummary,
  };
}
