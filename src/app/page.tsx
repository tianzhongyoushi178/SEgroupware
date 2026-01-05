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
            {showMeeting && (
              <a
                href="http://10.1.1.39/Scripts/dneo/dneo.exe?cmd=plantweekgrp"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', textDecoration: 'none', color: 'inherit' }}
              >
                📅 会議室を予約
              </a>
            )}
            {showNotice && (
              <button
                onClick={() => setIsNoticeModalOpen(true)}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start' }}
              >
                📢 お知らせを投稿
              </button>
            )}
            {profile?.preferences?.customQuickAccess?.map((item: any) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', textDecoration: 'none', color: 'inherit' }}
              >
                🔗 {item.title}
              </a>
            ))}
            {!showMeeting && !showNotice && (!profile?.preferences?.customQuickAccess || profile.preferences.customQuickAccess.length === 0) && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>表示する項目がありません</p>
            )}
          </div>
        </section>

        {/* Notices Widget */}
        <div id="tutorial-dashboard-notices" style={{ display: 'contents' }}>
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
