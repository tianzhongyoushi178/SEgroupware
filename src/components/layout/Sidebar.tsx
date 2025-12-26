'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bell, Settings, MessageSquare, Wrench, FileText, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import styles from './Sidebar.module.css';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { useEffect, useState } from 'react';
import { navigation } from '@/constants/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuthStore();
  const { tabSettings, subscribeSettings } = useAppSettingsStore();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Determine which menus should be open based on current path
    const newOpenMenus = { ...openMenus };
    navigation.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => child.href === pathname);
        if (hasActiveChild) {
          newOpenMenus[item.name] = true;
        }
      }
    });
    // Only update if changes to avoid unnecessary re-renders (though simple spread always creates new obj)
    // For simplicity, just set it once on mount or path change if we want auto-expand
    if (Object.keys(newOpenMenus).length > Object.keys(openMenus).length) {
      setOpenMenus(newOpenMenus);
    }
  }, [pathname]);

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

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
        <Image src="/logo.png" alt="Logo" width={64} height={48} style={{ borderRadius: '8px' }} />
        <span className={styles.logoText}>SALES HUB</span>
      </div>

      <nav className={styles.nav}>
        {filteredNavigation.map((item) => {
          // @ts-ignore - Dynamic type handling
          const hasChildren = item.children && item.children.length > 0;
          const isActive = pathname === item.href;
          const isOpen = openMenus[item.name];

          if (hasChildren) {
            return (
              <div key={item.name}>
                <button
                  className={clsx(styles.navItem, isActive && styles.active)}
                  onClick={() => toggleMenu(item.name)}
                >
                  <item.icon className={styles.icon} size={20} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  <ChevronDown size={16} className={clsx(isOpen && styles.rotate)} />
                </button>
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {/* @ts-ignore */}
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={clsx(styles.subNavItem, isChildActive && styles.active)}
                        >
                          <child.icon className={styles.icon} size={18} />
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
