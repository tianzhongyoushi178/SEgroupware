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
import NoticeDetailModal from '../notices/NoticeDetailModal';

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
            <NoticeDetailModal
                notice={selectedNotice}
                onClose={() => setSelectedNotice(null)}
            />
        </>
    );
}
