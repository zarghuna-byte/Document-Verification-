import { LogOut } from 'lucide-react';

import { useAuth } from '../../../hooks/useAuth';
import { USER_PROFILE } from '../../../data/dashboard';
import styles from './Sidebar.module.css';

function SidebarProfile() {
  const { user } = useAuth();
  const name = user?.name ?? USER_PROFILE.name;
  const initials =
    user?.initials ??
    name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <>
      <div className={styles.user}>
        <div className={styles.avatar} aria-hidden="true">
          {initials}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{name}</span>
          <span className={styles.userStatus}>
            <span className={styles.onlineDot} aria-hidden="true" />
            Online
          </span>
        </div>
      </div>
      <button className={styles.logout} type="button" title="Logout" aria-label="Logout">
        <LogOut className={styles.logoutIcon} aria-hidden="true" />
        <span className={styles.navLabel}>Logout</span>
      </button>
    </>
  );
}

export default SidebarProfile;
