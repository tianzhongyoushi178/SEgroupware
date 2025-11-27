import { LayoutDashboard, Bell, Calendar } from 'lucide-react';

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
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              📝 新しい日報を作成
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              📅 会議室を予約
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              📢 お知らせを投稿
            </button>
          </div>
        </section>

        {/* Notices Widget */}
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Bell size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>最新のお知らせ</h2>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', borderLeft: '3px solid var(--primary)', background: 'rgba(37, 99, 235, 0.05)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>2025-11-26</p>
              <p style={{ fontWeight: '500' }}>システムメンテナンスについて</p>
            </div>
            <div style={{ padding: '0.5rem', borderLeft: '3px solid var(--secondary)', background: 'rgba(100, 116, 139, 0.05)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>2025-11-25</p>
              <p style={{ fontWeight: '500' }}>年末年始の営業日について</p>
            </div>
          </div>
        </section>

        {/* Schedule Widget */}
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>今日の予定</h2>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ minWidth: '60px', textAlign: 'center', background: 'var(--surface)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>10:00</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>11:00</div>
              </div>
              <div>
                <p style={{ fontWeight: '500' }}>定例ミーティング</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>会議室A</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
