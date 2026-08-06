import { LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import logo from '../../../assets/logo.svg';
import { USER_PROFILE } from '../../../data/dashboard';
import { NAV_ITEMS } from '../../../data/navigation';
import styles from './Sidebar.module.css';

/**
 * Left navigation rail of the dashboard.
 *
 * Supports three layout modes controlled by the parent DashboardLayout:
 *  - expanded (desktop): full 270px width with labels
 *  - collapsed (tablet): icon-only rail
 *  - drawer (mobile): off-canvas panel revealed over the content
 *
 * @param {boolean} collapsed When true, renders the icon-only rail.
 * @param {boolean} drawerOpen When true, reveals the drawer on mobile.
 * @param {Function} onNavigate Callback fired after a link is selected.
 */
function Sidebar({ collapsed = false, drawerOpen = false, onNavigate }) {
  const className = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    drawerOpen ? styles.drawerOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={className}>
      <div className={styles.brand}>
        <img className={styles.logo} src={logo} alt="FinTech logo" />
        <div className={styles.brandText}>
          <span className={styles.brandName}>FinTech</span>
          <span className={styles.brandSubtitle}>Financial Document Verification</span>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Primary">
        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ id, label, path, icon: Icon }) => (
            <li key={id}>
              <NavLink
                to={path}
                end={path === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <Icon className={styles.navIcon} aria-hidden="true" />
                <span className={styles.navLabel}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <div className={styles.avatar} aria-hidden="true">
            {USER_PROFILE.initials}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{USER_PROFILE.name}</span>
            <span className={styles.userStatus}>
              <span className={styles.onlineDot} aria-hidden="true" />
              Online
            </span>
          </div>
        </div>
        <button className={styles.logout} type="button" aria-label="Logout">
          <LogOut className={styles.logoutIcon} aria-hidden="true" />
          <span className={styles.navLabel}>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
