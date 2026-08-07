import { useEffect, useRef, useState } from 'react';

import { CloudUpload, FileText, Trash2, UploadCloud } from 'lucide-react';

import {
  ACCEPTED_TYPES_TEXT,
  MAX_FILE_SIZE_MB,
  validateUploadFile,
} from '../../../data/documents';
import styles from './UploadDropzone.module.css';

/**
 * Format a byte count as a readable size, e.g. "2.8 MB".
 *
 * @param {number} bytes Size in bytes.
 * @returns {string} A human-readable size string.
 */
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Describe a file for the selected-file panel.
 *
 * @param {File} file The selected file.
 * @returns {string} e.g. "PDF" or "image/png".
 */
function describeFile(file) {
  if (file.type) {
    return file.type;
  }
  const extension = file.name.split('.').pop();
  return extension ? extension.toUpperCase() : 'File';
}

/**
 * Drag & drop picker with explicit, staged upload.
 *
 * Choosing a file (click or drop) only stages it: the file name, size and type
 * are shown with a "Remove" option and an explicit "Upload" button, so nothing
 * is sent to the server until the employee confirms. Files are validated
 * client-side (extension, size, emptiness) against the same allow-list the
 * backend enforces, so invalid files fail fast before any network request.
 *
 * @param {object} props
 * @param {string|null} props.targetLabel The document name the dropzone is
 *   targeting, or null when no document is selected.
 * @param {boolean} props.busy Whether an upload is already in flight.
 * @param {Function} props.onUpload Callback fired with the staged file when
 *   the employee confirms the upload.
 */
function UploadDropzone({ targetLabel = null, busy = false, onUpload }) {
  const inputRef = useRef(null);
  const [staged, setStaged] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const submittedRef = useRef(false);

  useEffect(() => {
    setStaged(null);
    setError('');
    submittedRef.current = false;
  }, [targetLabel]);

  useEffect(() => {
    if (submittedRef.current && !busy) {
      setStaged(null);
      setError('');
      submittedRef.current = false;
    }
  }, [busy]);

  const handleFiles = (files) => {
    const file = files?.[0];
    const validationError = validateUploadFile(file);
    setError(validationError ?? '');
    if (!validationError) {
      setStaged(file);
    }
  };

  const handleRemove = () => {
    setStaged(null);
    setError('');
  };

  const handleUpload = () => {
    if (staged && !busy) {
      submittedRef.current = true;
      onUpload(staged);
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
    if (!busy) {
      inputRef.current?.click();
    }
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
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
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
          {busy ? 'Uploading...' : targetLabel ? `Choose a file for ${targetLabel}` : 'Select a document to upload'}
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

      {staged && (
        <div className={styles.selected} role="status">
          <div className={styles.selectedIcon} aria-hidden="true">
            <FileText />
          </div>
          <div className={styles.selectedMeta}>
            <span className={styles.selectedName}>{staged.name}</span>
            <span className={styles.selectedDetail}>
              {formatFileSize(staged.size)} · {describeFile(staged)}
            </span>
          </div>
          <div className={styles.selectedActions}>
            <button
              className={styles.removeBtn}
              type="button"
              disabled={busy}
              onClick={handleRemove}
              aria-label={`Remove ${staged.name}`}
            >
              <Trash2 aria-hidden="true" />
              Remove
            </button>
            <button
              className={styles.uploadBtn}
              type="button"
              disabled={busy}
              onClick={handleUpload}
            >
              <UploadCloud aria-hidden="true" />
              {busy ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadDropzone;
