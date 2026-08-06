import PipelineStepper from '../../components/common/PipelineStepper/PipelineStepper';
import StatCard from '../../components/common/StatCard/StatCard';
import { PIPELINE_STEPS, STAT_CARDS } from '../../data/dashboard';
import styles from './Dashboard.module.css';

/**
 * Landing page of the dashboard.
 *
 * Welcomes the user and summarises the workspace with four headline stat cards
 * and the 12-step verification pipeline. All data is static dummy content until
 * backend endpoints are wired up in later phases.
 */
function Dashboard() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.welcome}>Welcome back!</h2>
        <p className={styles.subtitle}>
          Here is an overview of your financial document verification workspace.
        </p>
      </header>

      <section className={styles.stats} aria-label="Key statistics">
        {STAT_CARDS.map(({ id, label, value, icon }) => (
          <StatCard key={id} label={label} value={value} icon={icon} />
        ))}
      </section>

      <PipelineStepper steps={PIPELINE_STEPS} />
    </div>
  );
}

export default Dashboard;
