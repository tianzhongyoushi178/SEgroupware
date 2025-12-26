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
  const { tabSettings, fetchUserPermissions, sidebarWidth, setSidebarWidth } = useAppSettingsStore();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [permissionLoaded, setPermissionLoaded] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(600, e.clientX)); // Min 200, Max 600
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

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
        icon: ExternalLink
      }));
      // @ts-ignore
      return { ...item, children: [...(item.children || []), ...customChildren] };
    }
    return item;
  });

  const filteredNavigation = mergedNavigation.filter(item => {
    const setting = tabSettings[item.href];
    if (setting && !setting.visible) return false;
    if (setting && setting.adminOnly && !isAdmin) return false;
    if (userPermissions[item.href] === false) return false;
    return true;
  }).map(item => {
    // @ts-ignore
    if (item.children) {
      // @ts-ignore
      const filteredChildren = item.children.filter(child => {
        const childSetting = tabSettings[child.href];
        if (childSetting && !childSetting.visible) return false;
        if (userPermissions[child.href] === false) return false;
        return true;
      });
      return { ...item, children: filteredChildren };
    }
    return item;
  }).filter(item => {
    // @ts-ignore
    if (item.children && item.children.length === 0) {
      return true;
    }
    return true;
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const responsiveFontSize = Math.max(12, Math.min(18, sidebarWidth / 18.6));

  if (isMobile) {
    return (
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          overflowX: 'auto',
          gap: '1rem',
          scrollbarWidth: 'none'
        }}
      >
        <Link href="/" style={{ marginRight: '0.5rem', flexShrink: 0 }}>
          <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ borderRadius: '6px' }} />
        </Link>

        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          // For mobile, flatten hierarchy or just show main items for simplicity
          // Or we can use a dropdown for items with children? 
          // For now, let's keep top-level items for better UX on small scrollable area
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(styles.navItem, isActive && styles.active)}
              style={{
                fontSize: '0.875rem',
                padding: '0.5rem 0.75rem',
                whiteSpace: 'nowrap',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                borderRadius: '99px',
                flexShrink: 0
              }}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <Link href="/settings" className={styles.navItem} style={{ padding: '0.5rem', flexShrink: 0 }}>
          <Settings size={18} />
        </Link>
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar} style={{ width: `${sidebarWidth}px` }}>
      <div
        className={`${styles.resizer} ${isResizing ? styles.resizerActive : ''}`}
        onMouseDown={() => setIsResizing(true)}
      />

      <Link href="/" className={styles.logo} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Image src="/logo.png" alt="Logo" width={64} height={48} style={{ borderRadius: '8px' }} />
        <span className={styles.logoText} style={{ fontSize: `${Math.max(1.2, responsiveFontSize / 10)}rem` }}>SALES HUB</span>
      </Link>

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
                  style={{ fontSize: `${responsiveFontSize}px` }}
                >
                  <item.icon className={styles.icon} size={Math.max(16, responsiveFontSize + 4)} />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                  <ChevronDown size={Math.max(14, responsiveFontSize)} className={clsx(isOpen && styles.rotate)} />
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
                          style={{ fontSize: `${responsiveFontSize}px` }}
                        >
                          <child.icon className={styles.icon} size={Math.max(14, responsiveFontSize + 2)} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{child.name}</span>
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
              style={{ fontSize: `${responsiveFontSize}px` }}
            >
              <item.icon className={styles.icon} size={Math.max(16, responsiveFontSize + 4)} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/settings" className={styles.navItem} style={{ fontSize: `${responsiveFontSize}px` }}>
          <Settings className={styles.icon} size={Math.max(16, responsiveFontSize + 4)} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>設定</span>
        </Link>
      </div>
    </aside>
  );
}
