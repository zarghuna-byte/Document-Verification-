import { useRef, useState } from 'react';

import { CloudUpload } from 'lucide-react';

import {
  ACCEPTED_TYPES_TEXT,
  MAX_FILE_SIZE_MB,
  validateUploadFile,
} from '../../../data/documents';
import styles from './UploadDropzone.module.css';

/**
 * Drag & drop upload area with a click-to-browse fallback.
 *
 * Validates the selected file client-side (extension, size, emptiness) against
 * the same allow-list the backend enforces, so invalid files fail fast with a
 * clear message before any network request. On a valid file the parent is
 * notified through `onFileSelected` and takes over the upload.
 *
 * @param {object} props
 * @param {string|null} props.targetLabel The document name the dropzone is
 *   targeting, or null when no document is selected.
 * @param {boolean} props.busy Whether an upload is already in flight.
 * @param {Function} props.onFileSelected Callback with the validated file.
 */
function UploadDropzone({ targetLabel = null, busy = false, onFileSelected }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = (files) => {
    const file = files?.[0];
    const validationError = validateUploadFile(file);
    setError(validationError ?? '');
    if (!validationError) {
      onFileSelected(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!busy) {
      setDragging(true);
    }
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!busy) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const className = [
    styles.dropzone,
    dragging ? styles.dragging : '',
    busy ? styles.busy : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      <div
        className={className}
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        aria-label="Upload area: drag and drop a file or click to browse"
        onClick={busy ? undefined : handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!busy) {
              handleClick();
            }
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.iconWrap} aria-hidden="true">
          <CloudUpload />
        </div>
        <p className={styles.primary}>
          {busy ? 'Uploading...' : targetLabel ? `Upload ${targetLabel}` : 'Select a document to upload'}
        </p>
        <p className={styles.secondary}>
          Drag &amp; drop your file here, or{' '}
          <span className={styles.browse}>click to browse</span>
        </p>
        <p className={styles.accepted}>
          Accepted: {ACCEPTED_TYPES_TEXT} (max {MAX_FILE_SIZE_MB} MB)
        </p>
      </div>

      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.tif,.tiff"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default UploadDropzone;
