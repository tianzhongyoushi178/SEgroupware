'use client';

import { useNoticeStore } from '@/store/noticeStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Bell, Info, AlertTriangle } from 'lucide-react';
import { NoticeCategory } from '@/types/notice';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const categoryConfig: Record<NoticeCategory, { label: string; color: string; icon: any }> = {
    system: { label: 'システム', color: '#2563eb', icon: Info },
    general: { label: '一般', color: '#64748b', icon: Bell },
    urgent: { label: '重要', color: '#ef4444', icon: AlertTriangle },
};

export default function NoticesWidget() {
    const { notices } = useNoticeStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Hydration Mismatchを防ぐため、マウントされるまでレンダリングしない
    // またはローディング状態を表示する
    if (!mounted) {
        return (
            <section className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Bell size={20} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>最新のお知らせ</h2>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>読み込み中...</p>
                </div>
            </section>
        );
    }

    const recentNotices = [...notices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

    return (
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={20} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>最新のお知らせ</h2>
                </div>
                <Link
                    href="/notices"
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--primary)', fontSize: '0.875rem' }}
                >
                    すべて見る
                </Link>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {recentNotices.length > 0 ? (
                    recentNotices.map((notice) => {
                        const config = categoryConfig[notice.category];
                        return (
                            <div
                                key={notice.id}
                                style={{
                                    padding: '0.75rem',
                                    borderLeft: `3px solid ${config.color}`,
                                    background: `${config.color}08`,
                                    borderRadius: '0 4px 4px 0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {format(new Date(notice.createdAt), 'yyyy-MM-dd', { locale: ja })}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: config.color,
                                            padding: '2px 6px',
                                            background: `${config.color}15`,
                                            borderRadius: '999px'
                                        }}
                                    >
                                        {config.label}
                                    </span>
                                </div>
                                <p style={{ fontWeight: '500', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    {notice.title}
                                </p>
                            </div>
                        );
                    })
                ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>現在、新しいお知らせはありません。</p>
                )}
            </div>
        </section>
    );
}
