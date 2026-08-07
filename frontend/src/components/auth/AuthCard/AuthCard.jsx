import logo from '../../../assets/logo.svg';
import styles from './AuthCard.module.css';

function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <img className={styles.logo} src={logo} alt="FinTech logo" />
          <div className={styles.brandText}>
            <span className={styles.brandName}>FinTech</span>
            <span className={styles.brandSubtitle}>Financial Document Verification</span>
          </div>
        </div>

        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

export default AuthCard;
