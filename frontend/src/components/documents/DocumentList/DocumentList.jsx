import { ClipboardList } from 'lucide-react';

import DocumentRow from '../DocumentRow/DocumentRow';
import styles from './DocumentList.module.css';

/**
 * Grouped list of required and supporting documents for an application.
 *
 * Resolves the per-row upload state from the fetched documents and any
 * in-flight uploads, then delegates rendering to DocumentRow.
 *
 * @param {object} props
 * @param {Array<object>} props.requiredTypes Required document catalogue entries.
 * @param {Array<object>} props.supportingTypes Supporting catalogue entries.
 * @param {Function} props.findDocument Lookup document metadata by type.
 * @param {object} props.pending Map of type to in-flight upload state.
 * @param {Function} props.onUpload Handler for uploading a missing document.
 * @param {Function} props.onReplace Handler for replacing an existing document.
 * @param {Function} props.onDelete Handler for deleting an existing document.
 */
function DocumentList({
  requiredTypes,
  supportingTypes,
  findDocument,
  pending,
  onUpload,
  onReplace,
  onDelete,
}) {
  const renderGroup = (title, entries) => (
    <section className={styles.group}>
      <h4 className={styles.groupTitle}>{title}</h4>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <DocumentRow
            key={entry.type}
            entry={entry}
            document={findDocument(entry.type)}
            pending={pending[entry.type] ?? null}
            onUpload={() => onUpload(entry.type)}
            onReplace={() => onReplace(entry.type)}
            onDelete={() => onDelete(entry.type)}
          />
        ))}
      </ul>
    </section>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrap} aria-hidden="true">
          <ClipboardList />
        </div>
        <div>
          <h3 className={styles.title}>Document Checklist</h3>
          <p className={styles.subtitle}>Select a document, then upload a file below.</p>
        </div>
      </div>
      {renderGroup('Required Documents', requiredTypes)}
      {renderGroup('Supporting Documents', supportingTypes)}
    </div>
  );
}

export default DocumentList;
