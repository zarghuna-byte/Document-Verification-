import { Eye, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

import StatusChip from '../../common/StatusChip/StatusChip';
import { getApplicationStatus } from '../../../data/statuses';
import { formatDate } from '../../../utils/format';
import styles from './ApplicationTable.module.css';

/**
 * Read-only table of applications.
 *
 * Each row links to the application details page and to the document upload
 * page. Dates are localised and the status renders as a coloured chip.
 *
 * @param {object} props
 * @param {Array<object>} props.applications Application objects to display.
 */
function ApplicationTable({ applications }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Application ID</th>
            <th scope="col">Status</th>
            <th scope="col">Submission Date</th>
            <th scope="col">Last Updated</th>
            <th scope="col">Created By</th>
            <th scope="col" className={styles.actionsHeader}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const status = getApplicationStatus(application.status);
            return (
              <tr key={application.id}>
                <td className={styles.idCell}>
                  <Link to={`/applications/${application.id}`} className={styles.idLink}>
                    #{application.id}
                  </Link>
                </td>
                <td>
                  <StatusChip label={status.label} variant={status.variant} />
                </td>
                <td>{formatDate(application.submitted_at)}</td>
                <td>{formatDate(application.updated_at)}</td>
                <td>{application.created_by}</td>
                <td>
                  <div className={styles.actions}>
                    <Link
                      to={`/applications/${application.id}`}
                      className={styles.actionLink}
                      aria-label={`View application ${application.id}`}
                    >
                      <Eye aria-hidden="true" />
                      View
                    </Link>
                    <Link
                      to={`/applications/${application.id}/upload`}
                      className={styles.actionLink}
                      aria-label={`Upload documents for application ${application.id}`}
                    >
                      <UploadCloud aria-hidden="true" />
                      Upload Documents
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ApplicationTable;
