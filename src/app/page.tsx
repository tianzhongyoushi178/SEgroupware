'use client';

import { LayoutDashboard } from 'lucide-react';
import NoticesWidget from '@/components/dashboard/NoticesWidget';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';

import NoticeFormModal from '@/components/notices/NoticeFormModal';

export default function Home() {
  const { profile } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const showAttendance = profile?.preferences?.quickAccess?.attendance !== false;
  const showMeeting = profile?.preferences?.quickAccess?.meeting !== false;
  const showNotice = profile?.preferences?.quickAccess?.notice !== false;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
          ダッシュボード
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          今日の予定とお知らせを確認しましょう。
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Quick Access Widget */}
        <section id="tutorial-dashboard-quickaccess" className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <LayoutDashboard size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>クイックアクセス</h2>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {(() => {
              const standardItems = [
                { id: 'attendance', label: '⏰ 勤怠管理を行う', url: 'http://10.1.1.161/Lysithea/login', type: 'link', isCustom: false },
                { id: 'meeting', label: '📅 会議室を予約', url: 'http://10.1.1.39/Scripts/dneo/dneo.exe?cmd=plantweekgrp', type: 'link', isCustom: false },
                { id: 'notice', label: '📢 お知らせを投稿', type: 'button', onClick: () => setIsNoticeModalOpen(true), isCustom: false }
              ];

              const customItems = (profile?.preferences?.customQuickAccess || []).map((item: any) => ({
                id: item.id,
                label: `🔗 ${item.title}`,
                url: item.url,
                type: 'link',
                isCustom: true
              }));

              const allItems = [...standardItems, ...customItems];
              const order = profile?.preferences?.quickAccessOrder || [];

              const sortedItems = order.length > 0
                ? allItems.sort((a, b) => {
                  const indexA = order.indexOf(a.id);
                  const indexB = order.indexOf(b.id);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                })
                : allItems;

              const visibleItems = sortedItems.filter(item => {
                if (item.isCustom) return true; // Custom items are visible if they exist (deletion handles removal)
                return profile?.preferences?.quickAccess?.[item.id] !== false;
              });

              if (visibleItems.length === 0) {
                return <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>表示する項目がありません</p>;
              }

              return visibleItems.map((item: any) => {
                if (item.type === 'button') {
                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className="btn btn-ghost"
                      style={{ justifyContent: 'flex-start' }}
                    >
                      {item.label}
                    </button>
                  );
                }
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', textDecoration: 'none', color: 'inherit' }}
                  >
                    {item.label}
                  </a>
                );
              });
            })()}
          </div>
        </section>

        {/* Notices Widget */}
        <div id="tutorial-dashboard-notices" style={{ height: '100%' }}>
          <NoticesWidget />
        </div>
      </div>

      <NoticeFormModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
      />
    </div>
  );
}
