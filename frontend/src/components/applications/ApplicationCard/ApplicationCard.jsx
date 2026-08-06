import { useState } from 'react';

import { FolderPlus } from 'lucide-react';
import Spinner from '../../common/Spinner/Spinner';
import styles from './ApplicationCard.module.css';

/**
 * Card form used to create a new application.
 *
 * Owns its local field state and reports submission through `onSubmit`. The
 * submit button disables and shows a spinner while `submitting` is true.
 *
 * @param {object} props
 * @param {boolean} props.submitting Whether a create request is in flight.
 * @param {Function} props.onSubmit Callback with `{createdBy, notes}`.
 */
function ApplicationCard({ submitting = false, onSubmit }) {
  const [createdBy, setCreatedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!createdBy.trim()) {
      setFieldError('Created By is required.');
      return;
    }
    setFieldError('');
    onSubmit({ createdBy: createdBy.trim(), notes: notes.trim() || null });
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <div className={styles.header}>
        <div className={styles.iconWrap} aria-hidden="true">
          <FolderPlus />
        </div>
        <div>
          <h3 className={styles.title}>Create New Application</h3>
          <p className={styles.subtitle}>Start a new document verification case.</p>
        </div>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Created By</span>
        <input
          className={styles.input}
          type="text"
          value={createdBy}
          placeholder="e.g. reviewer.alex"
          onChange={(event) => setCreatedBy(event.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Notes</span>
        <textarea
          className={styles.textarea}
          value={notes}
          rows={4}
          placeholder="Optional notes about this application..."
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      {fieldError && <p className={styles.error} role="alert">{fieldError}</p>}

      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting ? <Spinner /> : <FolderPlus aria-hidden="true" />}
        {submitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}

export default ApplicationCard;
