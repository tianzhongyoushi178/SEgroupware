import { LayoutDashboard } from 'lucide-react';
import NoticesWidget from '@/components/dashboard/NoticesWidget';


export default function Home() {
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
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <LayoutDashboard size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>クイックアクセス</h2>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <a
              href="http://10.1.1.39/Scripts/dneo/dneo.exe?cmd=plantweekgrp"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', textDecoration: 'none', color: 'inherit' }}
            >
              📅 会議室を予約
            </a>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              📢 お知らせを投稿
            </button>
          </div>
        </section>

        {/* Notices Widget */}
        <NoticesWidget />
      </div>
    </div>
  );
}
