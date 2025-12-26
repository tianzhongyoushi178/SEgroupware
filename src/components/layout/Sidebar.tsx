'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bell, Settings, MessageSquare, Wrench, FileText, ChevronDown, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import styles from './Sidebar.module.css';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { useEffect, useState } from 'react';
import { navigation } from '@/constants/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, user, profile } = useAuthStore();
  const { tabSettings, fetchUserPermissions } = useAppSettingsStore();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [permissionLoaded, setPermissionLoaded] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserPermissions(user.id).then(perms => {
        setUserPermissions(perms);
        setPermissionLoaded(true);
      });
    } else {
      setUserPermissions({});
      setPermissionLoaded(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Determine which menus should be open based on current path
    const newOpenMenus = { ...openMenus };
    navigation.forEach(item => {
      // @ts-ignore
      if (item.children) {
        // @ts-ignore
        const hasActiveChild = item.children.some(child => child.href === pathname);
        if (hasActiveChild) {
          newOpenMenus[item.name] = true;
        }
      }
    });
    if (Object.keys(newOpenMenus).length > Object.keys(openMenus).length) {
      setOpenMenus(newOpenMenus);
    }
  }, [pathname]);

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Merge custom links
  const mergedNavigation = navigation.map(item => {
    if (item.name === 'リンク集') {
      const customLinks = profile?.preferences?.customLinks || [];
      const customChildren = customLinks.map(link => ({
        name: link.title,
        href: link.url,
        // Using a default icon for custom links since we can't easily dynamic import icons by name here
        // If we want to import ExternalLink, we need to make sure it is available.
        // But `item.children` elements usually have `.icon` component.
        // Accessing the icon from one of the existing children or defaulting if imported?
        // I need to import ExternalLink at the top if I want to use it.
        // Or I can reuse the icon from the parent or just use a placeholder if I can't import easily?
        // Navigation items have `icon` property which is a component.
        // I'll import ExternalLink at top.
        icon: ExternalLink // Reuse parent icon (Link) or I'll add ExternalLink to imports
      }));
      // @ts-ignore
      return { ...item, children: [...(item.children || []), ...customChildren] };
    }
    return item;
  });

  const filteredNavigation = mergedNavigation.filter(item => {
    // Legacy support: global settings (if we still want to respect them as a base layer)
    // For now, let's assume User Permission overrides or is the primary source.
    // If permissionLoaded is false (loading), maybe show everything or skeleton? Show everything for now to avoid flicker if API fast?
    // Actually better to wait or default to true?
    // Default: Visible if not explicitly false.

    // Check local tabSettings first (legacy)
    const setting = tabSettings[item.href];
    if (setting && !setting.visible) return false;
    if (setting && setting.adminOnly && !isAdmin) return false;

    // Check user specific permissions
    // Note: If no record in DB, userPermissions is {}. filtered access is true.
    if (userPermissions[item.href] === false) return false;

    return true;
  }).map(item => {
    // Filter children
    // @ts-ignore
    if (item.children) {
      // @ts-ignore
      const filteredChildren = item.children.filter(child => {
        // Legacy check
        const childSetting = tabSettings[child.href];
        if (childSetting && !childSetting.visible) return false;

        // User Permission check
        if (userPermissions[child.href] === false) return false;

        return true;
      });
      return { ...item, children: filteredChildren };
    }
    return item;
  }).filter(item => {
    // If item has children but all are hidden, should we hide the parent?
    // Yes, usually.
    // @ts-ignore
    if (item.children && item.children.length === 0) {
      // Check if parent itself has a direct link? 
      // Our navigation structure seems to have parents as headers (no href usually, or href same as name?)
      // Looking at constants/navigation.ts (I saw it earlier), parent has href.
      // If parent has href and it is valid page, keep it. 
      // If parent is just a folder, hide it.
      // Let's assume if it had children originally but now 0, and user specifically hid children, maybe they want parent hidden?
      // But parent might have its own dashboard.
      // Let's keep parent if it passed the first filter.
      return true;
    }
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
                      const isExternal = child.href.startsWith('http');
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
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
