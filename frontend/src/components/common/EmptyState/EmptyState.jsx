import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

/**
 * Placeholder shown when a list has no rows.
 *
 * @param {object} props
 * @param {string} [props.title] Heading text.
 * @param {string} [props.message] Supporting explanation.
 */
function EmptyState({ title = 'Nothing here yet', message }) {
  return (
    <div className={styles.empty}>
      <div className={styles.iconWrap} aria-hidden="true">
        <Inbox />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}

export default EmptyState;
