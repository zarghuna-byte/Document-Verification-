import { Link } from 'react-router-dom';

import { Activity as ActivityIcon, RefreshCw } from 'lucide-react';

import EmptyState from '../../common/EmptyState/EmptyState';
import Spinner from '../../common/Spinner/Spinner';
import StatusChip from '../../common/StatusChip/StatusChip';
import { useActivity } from '../../../hooks/useActivity';
import { getActivityLabel, getActivityTone } from '../../../utils/activity';
import { formatDateTime } from '../../../utils/format';
import styles from './ActivityFeed.module.css';

/**
 * Recent activity feed built from the audit log.
 *
 * Renders the stored audit events (label, user, timestamp and optional
 * application link). Used both globally on the dashboard and scoped to a single
 * application on the details page. Never fabricates activity: an empty log shows
 * an empty state.
 *
 * @param {object} props
 * @param {number|string} [props.applicationId] Scope the feed to one
 *   application. When omitted the global feed is used and each event links to
 *   its application.
 * @param {number} [props.limit] Maximum number of events to show.
 */
function ActivityFeed({ applicationId, limit = 10 }) {
  const { events, loading, error, reload } = useActivity(applicationId, { limit });

  if (loading) {
    return (
      <div className={styles.center} aria-busy="true">
        <Spinner size="small" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorRow} role="alert">
        <span>Unable to load activity.</span>
        <button type="button" className={styles.retry} onClick={reload}>
          <RefreshCw aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No recent activity"
        message={
          applicationId
            ? 'No activity has been recorded for this application yet.'
            : 'Activity will appear here as applications are processed.'
        }
      />
    );
  }

  return (
    <ul className={styles.list}>
      {events.map((event) => {
        const tone = getActivityTone(event.action);
        const label = getActivityLabel(event.action);
        return (
          <li key={event.id} className={styles.item}>
            <span className={styles.icon} aria-hidden="true">
              <ActivityIcon />
            </span>
            <div className={styles.body}>
              <div className={styles.heading}>
                <StatusChip label={label} variant={tone} />
                {!applicationId && event.application_id && (
                  <Link
                    to={`/applications/${event.application_id}`}
                    className={styles.applicationLink}
                  >
                    Application #{event.application_id}
                  </Link>
                )}
              </div>
              <div className={styles.meta}>
                <span>{event.username}</span>
                <span>{formatDateTime(event.performed_at)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default ActivityFeed;
