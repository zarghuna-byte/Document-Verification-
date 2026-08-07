import { LogOut } from 'lucide-react';

import { USER_PROFILE } from '../../../data/dashboard';
import styles from './Sidebar.module.css';

function SidebarProfile() {
  return (
    <>
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
      <button className={styles.logout} type="button" title="Logout" aria-label="Logout">
        <LogOut className={styles.logoutIcon} aria-hidden="true" />
        <span className={styles.navLabel}>Logout</span>
      </button>
    </>
  );
}

export default SidebarProfile;
