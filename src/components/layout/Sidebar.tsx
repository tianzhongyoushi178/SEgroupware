'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bell, Calendar, Settings, Cloud, MessageSquare, Wrench, FileText } from 'lucide-react';
import clsx from 'clsx';
import styles from './Sidebar.module.css';

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: LayoutDashboard },
  { name: 'お知らせ', href: '/notices', icon: Bell },
  { name: 'スケジュール', href: '/schedule', icon: Calendar },
  { name: 'Salesforce', href: '/salesforce', icon: Cloud },
  { name: 'AI出張旅費アシスタント', href: '/ai-chat', icon: MessageSquare },
  { name: 'SEナレッジベース', href: '/se-tools', icon: Wrench },
  { name: 'OCRツール', href: '/ocr-tools', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ borderRadius: '6px' }} />
        <span className={styles.logoText}>SEグループウェア</span>
      </div>

      <nav className={styles.nav}>
        {navigation.map((item) => {
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
