'use client';

import { useNoticeStore } from '@/store/noticeStore';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { MessageSquare, Bell, AlertTriangle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import NoticeDetailModal from '../notices/NoticeDetailModal';
import { NoticeCategory } from '@/types/notice';

const categoryConfig: Record<NoticeCategory, { label: string; color: string; icon: any }> = {
    system: { label: 'システム', color: '#2563eb', icon: Info },
    general: { label: '一般', color: '#64748b', icon: Bell },
    urgent: { label: '重要', color: '#ef4444', icon: AlertTriangle },
};

export default function CommentedNoticesWidget() {
    const { recentComments, fetchRecentComments, notices } = useNoticeStore();
    const { user } = useAuthStore();
    const { getAllProfiles } = useAppSettingsStore();
    const [mounted, setMounted] = useState(false);
    const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
    const [authorMap, setAuthorMap] = useState<Record<string, string>>({});

    // Find the full notice object for the modal
    // Try to find in notices list first (might have more up to date info like isRead), fallback to embedded notice in comment
    const selectedNotice = notices.find(n => n.id === selectedNoticeId) ||
        recentComments.find(c => c.notice?.id === selectedNoticeId)?.notice ||
        null;

    useEffect(() => {
        setMounted(true);
        fetchRecentComments();

        getAllProfiles().then(profiles => {
            const map: Record<string, string> = {};
            profiles.forEach(p => {
                map[p.id] = p.display_name || 'Unknown';
            });
            setAuthorMap(map);
        });
    }, [fetchRecentComments, getAllProfiles]);

    if (!mounted) {
        return (
            <section className="glass-panel" style={{ padding: '1.5rem', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <MessageSquare size={20} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>コメントがついたお知らせ</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>読み込み中...</p>
            </section>
        );
    }

    // Deduplicate comments per notice if needed? 
    // User asked "Display comments added". A stream of comments seems appropriate.
    // Limit to top 5 maybe? Store fetches 10.
    const displayComments = recentComments.filter(comment => {
        if (!comment.notice || !user) return false;
        const notice = comment.notice;
        const lastReadAt = notice.readStatus?.[user.id];


        if (!lastReadAt) return true; // Never read
        return new Date(lastReadAt) < new Date(comment.createdAt); // Comment is newer than read time
    }).slice(0, 5);

    return (
        <>
            <section className="glass-panel" style={{ padding: '1.5rem', height: '100%', minHeight: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <MessageSquare size={20} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>最新のコメント</h2>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {displayComments.length > 0 ? (
                        displayComments.map((comment) => {
                            if (!comment.notice) return null;
                            const notice = comment.notice;
                            const config = categoryConfig[notice.category] || categoryConfig.general;
                            const authorName = authorMap[notice.authorId || ''] || notice.author; // Use map if authorId exists, else raw author string
                            const commenterName = comment.user?.displayName || 'Unknown';

                            return (
                                <div
                                    key={comment.id}
                                    onClick={() => setSelectedNoticeId(notice.id)}
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
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                color: config.color,
                                                padding: '2px 6px',
                                                background: `${config.color}15`,
                                                borderRadius: '999px'
                                            }}
                                        >
                                            {config.label}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {format(new Date(comment.createdAt), 'MM/dd HH:mm', { locale: ja })}
                                        </span>
                                    </div>

                                    <p style={{ fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                                        {notice.title}
                                    </p>

                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        background: 'rgba(255,255,255,0.5)',
                                        borderRadius: '4px',
                                        padding: '4px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>💬 {commenterName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>👤 投稿者: {authorName}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p style={{ color: 'var(--text-secondary)' }}>最近のコメントはありません。</p>
                    )}
                </div>
            </section>

            <NoticeDetailModal
                notice={selectedNotice}
                onClose={() => setSelectedNoticeId(null)}
            />
        </>
    );
}
