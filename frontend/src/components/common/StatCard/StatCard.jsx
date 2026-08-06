import styles from './StatCard.module.css';

/**
 * Presentational card that displays a single headline metric for the Dashboard.
 *
 * The icon is passed in as a ready-to-render Lucide component. Values are
 * static in this phase; future phases swap them for live API data.
 *
 * @param {object} props
 * @param {string} props.label Human-readable metric name.
 * @param {string} props.value Formatted metric value.
 * @param {Function} props.icon Lucide icon component.
 */
function StatCard({ label, value, icon: Icon }) {
  return (
    <article className={styles.card}>
      <div className={styles.iconWrap}>
        <Icon className={styles.icon} aria-hidden="true" />
      </div>
      <div className={styles.meta}>
        <span className={styles.label}>{label}</span>
        <strong className={styles.value}>{value}</strong>
      </div>
    </article>
  );
}

export default StatCard;
