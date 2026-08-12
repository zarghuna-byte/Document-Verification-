import ActivityFeed from '../../activity/ActivityFeed/ActivityFeed';
import styles from './RecentActivity.module.css';

/**
 * Recent Activity dashboard section.
 *
 * Renders the stored audit log through the shared activity feed. No activity
 * is ever fabricated: an empty log shows an empty state.
 */
function RecentActivity() {
  return (
    <section className={styles.card} aria-label="Recent activity">
      <h3 className={styles.title}>Recent Activity</h3>
      <ActivityFeed limit={8} />
    </section>
  );
}

export default RecentActivity;
