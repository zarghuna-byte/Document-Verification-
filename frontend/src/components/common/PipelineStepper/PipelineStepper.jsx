import styles from './PipelineStepper.module.css';

/**
 * Horizontal 12-step pipeline card shown on the Dashboard.
 *
 * Renders the document verification workflow as connected nodes. The step list
 * is static dummy data in this phase; progress highlighting will come from the
 * backend in a later phase.
 *
 * @param {object} props
 * @param {Array<{id: string, label: string}>} props.steps Ordered pipeline stages.
 */
function PipelineStepper({ steps }) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Project Pipeline</h2>
        <span className={styles.badge}>{steps.length} steps</span>
      </div>
      <ol className={styles.track}>
        {steps.map((step, index) => (
          <li key={step.id} className={styles.step}>
            <div className={styles.node}>
              <span className={styles.nodeIndex}>{index + 1}</span>
            </div>
            <span className={styles.stepLabel}>{step.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default PipelineStepper;
