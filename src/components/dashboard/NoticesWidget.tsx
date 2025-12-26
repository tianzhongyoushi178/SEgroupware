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
    const [selectedNotice, setSelectedNotice] = useState<any | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Hydration Mismatchを防ぐため、マウントされるまでレンダリングしない
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
        <>
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
                                    onClick={() => setSelectedNotice(notice)}
                                    style={{
                                        padding: '0.75rem',
                                        borderLeft: `3px solid ${config.color}`,
                                        background: `${config.color}08`,
                                        borderRadius: '0 4px 4px 0',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = `${config.color}15`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = `${config.color}08`;
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

            {/* Detail Modal */}
            {selectedNotice && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => setSelectedNotice(null)}
                >
                    <div
                        style={{
                            background: 'var(--surface)',
                            padding: '2rem',
                            borderRadius: 'var(--radius-lg)',
                            width: '90%',
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: 'var(--shadow-lg)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span
                                    style={{
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        color: categoryConfig[selectedNotice.category].color,
                                        padding: '2px 8px',
                                        background: `${categoryConfig[selectedNotice.category].color}15`,
                                        borderRadius: '999px'
                                    }}
                                >
                                    {categoryConfig[selectedNotice.category].label}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {format(new Date(selectedNotice.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {selectedNotice.title}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                by {selectedNotice.author}
                            </p>
                        </header>

                        <div style={{ lineHeight: '1.8', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                            {selectedNotice.content}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setSelectedNotice(null)}
                                className="btn btn-primary"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
