'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bell, Settings, MessageSquare, Wrench, FileText } from 'lucide-react';
import clsx from 'clsx';
import styles from './Sidebar.module.css';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { useEffect } from 'react';
import { navigation } from '@/constants/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuthStore();
  const { tabSettings, subscribeSettings } = useAppSettingsStore();

  useEffect(() => {
    const unsubscribe = subscribeSettings();
    return () => unsubscribe();
  }, []);

  const filteredNavigation = navigation.filter(item => {
    // Default to visible if no setting exists
    const setting = tabSettings[item.href];
    if (!setting) return true;

    if (!setting.visible) return false;
    if (setting.adminOnly && !isAdmin) return false;

    return true;
  });

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Image src="/logo.png" alt="Logo" width={48} height={48} style={{ borderRadius: '8px' }} />
        <span className={styles.logoText}>SALES HUB</span>
      </div>

      <nav className={styles.nav}>
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(styles.navItem, isActive && styles.active)}
            >
              <item.icon className={styles.icon} size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/settings" className={styles.navItem}>
          <Settings className={styles.icon} size={20} />
          <span>設定</span>
        </Link>
      </div>
    </aside>
  );
}
