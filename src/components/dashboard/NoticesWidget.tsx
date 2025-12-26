'use client';

import { useNoticeStore } from '@/store/noticeStore';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Bell, Info, AlertTriangle } from 'lucide-react';
import { Notice, NoticeCategory } from '@/types/notice';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

// Component to fetch/display user name efficiently
const UserInfo = ({ userId }: { userId: string }) => {
    const { getAllProfiles } = useAppSettingsStore();
    const [name, setName] = useState('読み込み中...');

    // Simple in-memory cache for this session to avoid spamming
    // In a real app, use SWR or React Query
    useEffect(() => {
        let mounted = true;

        // Check if we have a global cache or just fetch
        // We will fetch all profiles once in the parent if possible, but here individually is safer for now
        // Actually, getting all profiles is better.
        // But for this patch, let's just fetch single user info if possible? 
        // Stores usually don't have getUser(id).
        // Let's use `getAllProfiles` once in parent and pass down map.
        // But for minimal code change without refactoring parent deeply:
        // We can just query supabase directly via helper? Or use the store.
        // Let's defer to the store's getAllProfiles.
        // Optimization: NoticeWidget should load profiles once.
        return () => { mounted = false; };
    }, [userId]);

    // Placeholder - Logic moved to Parent
    return <span className="badge" style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>{userId}</span>;
}

const categoryConfig: Record<NoticeCategory, { label: string; color: string; icon: any }> = {
    system: { label: 'システム', color: '#2563eb', icon: Info },
    general: { label: '一般', color: '#64748b', icon: Bell },
    urgent: { label: '重要', color: '#ef4444', icon: AlertTriangle },
};

export default function NoticesWidget() {
    const { notices, markAsRead } = useNoticeStore();
    const { user, isAdmin } = useAuthStore();
    const { getAllProfiles } = useAppSettingsStore();
    const [mounted, setMounted] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [userMap, setUserMap] = useState<Record<string, string>>({});

    useEffect(() => {
        setMounted(true);
        // Fetch profiles for names
        getAllProfiles().then(profiles => {
            const map: Record<string, string> = {};
            profiles.forEach(p => {
                map[p.id] = p.display_name || p.email?.split('@')[0] || 'Unknown';
            });
            setUserMap(map);
        });
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
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            width: '95%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: 'var(--shadow-lg)',
                            display: 'flex',
                            flexDirection: 'column',
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
                            {selectedNotice.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                                if (part.match(/(https?:\/\/[^\s]+)/g)) {
                                    return (
                                        <a
                                            key={i}
                                            href={part}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                                        >
                                            {part}
                                        </a>
                                    );
                                }
                                return part;
                            })}
                        </div>

                        {/* Read Status Section */}
                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                {/* Mark as Read Button */}
                                {user?.id && !selectedNotice.readStatus?.[user.id] && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (user?.id) {
                                                markAsRead(selectedNotice.id, user.id);
                                                // Ideally strictly optimistic update or fetch
                                                // We can manually update selectedNotice state for immediate feedback
                                                setSelectedNotice(prev => prev ? ({
                                                    ...prev,
                                                    readStatus: { ...prev.readStatus, [user.id]: new Date().toISOString() },
                                                    isRead: true
                                                }) : null);
                                            }
                                        }}
                                        className="btn"
                                        style={{
                                            background: '#fff7ed',
                                            color: '#c2410c',
                                            border: '1px solid #fed7aa',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        チェックして既読にする
                                    </button>
                                )}
                                {user?.id && selectedNotice.readStatus?.[user.id] && (
                                    <div style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                        ✓ 既読済み
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => setSelectedNotice(null)}
                                        className="btn btn-primary"
                                    >
                                        閉じる
                                    </button>
                                </div>
                            </div>

                            {/* Reader List */}
                            {(selectedNotice.readStatusVisibleTo === 'all' || isAdmin) && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        既読状況 ({Object.keys(selectedNotice.readStatus || {}).length}人)
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {Object.keys(selectedNotice.readStatus || {}).length > 0 ? (
                                            Object.keys(selectedNotice.readStatus || {}).map(readerId => {
                                                const name = userMap[readerId] || (Object.keys(userMap).length > 0 ? '不明なユーザー' : '読み込み中...');
                                                return (
                                                    <span key={readerId} style={{ fontSize: '0.75rem', background: 'var(--background-secondary)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                        {name}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>まだ誰も読んでいません</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
