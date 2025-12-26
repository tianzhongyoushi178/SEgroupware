'use client';

import { useState, useEffect } from 'react';
import { useNoticeStore } from '@/store/noticeStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Bell, Info, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { Notice, NoticeCategory } from '@/types/notice';
import NoticeFormModal from '@/components/notices/NoticeFormModal';
import NoticeDetailModal from '@/components/notices/NoticeDetailModal';
import { useAuthStore } from '@/store/authStore';

const categoryConfig: Record<NoticeCategory, { label: string; color: string; icon: any }> = {
    system: { label: 'システム', color: '#2563eb', icon: Info },
    general: { label: '一般', color: '#64748b', icon: Bell },
    urgent: { label: '重要', color: '#ef4444', icon: AlertTriangle },
};

export default function NoticesPage() {
    const { notices, markAsRead, deleteNotice, fetchNotices } = useNoticeStore();
    const { user, isAdmin } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);

    const selectedNotice = notices.find(n => n.id === selectedNoticeId) || null;
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [filterCategory, setFilterCategory] = useState<NoticeCategory | 'all'>('all');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    // Polling for read status updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotices();
        }, 60000); // Every 1 minute
        return () => clearInterval(interval);
    }, [fetchNotices]);

    // フィルタリングとソートの適用
    const filteredAndSortedNotices = notices
        .filter((notice) => {
            if (filterCategory !== 'all' && notice.category !== filterCategory) return false;

            // Correctly determine if read for the current user based on readStatus map
            const isRead = user?.id ? !!notice.readStatus?.[user.id] : false;

            // If checking "Unread Only", hide if already read
            if (showUnreadOnly && isRead) return false;

            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            お知らせ
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            社内の最新情報やお知らせを確認できます。
                        </p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                        新規作成
                    </button>
                </div>

                {/* フィルター・ソートコントロール */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>並び替え:</span>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                background: 'var(--background)',
                                color: 'var(--text-main)',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="newest">新しい順</option>
                            <option value="oldest">古い順</option>
                        </select>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>カテゴリ:</span>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value as NoticeCategory | 'all')}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                background: 'var(--background)',
                                color: 'var(--text-main)',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="all">すべて</option>
                            <option value="system">システム</option>
                            <option value="general">一般</option>
                            <option value="urgent">重要</option>
                        </select>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showUnreadOnly}
                            onChange={(e) => setShowUnreadOnly(e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>未読のみ表示</span>
                    </label>
                </div>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredAndSortedNotices.map((notice) => {
                    const config = categoryConfig[notice.category];
                    const Icon = config.icon;
                    const isRead = user?.id ? !!notice.readStatus?.[user.id] : false;

                    return (
                        <div
                            key={notice.id}
                            className="glass-panel"
                            onClick={() => setSelectedNotice(notice)}
                            style={{
                                padding: '1.5rem',
                                display: 'flex',
                                gap: '1.5rem',
                                opacity: isRead ? 0.9 : 1,
                                borderLeft: `4px solid ${config.color}`,
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                background: isRead ? 'var(--background-secondary)' : 'var(--surface)',
                            }}
                        >
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'var(--radius-md)',
                                    background: `${config.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: config.color,
                                    flexShrink: 0,
                                }}
                            >
                                <Icon size={24} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: config.color,
                                            background: `${config.color}15`,
                                            padding: '0.125rem 0.5rem',
                                            borderRadius: 'var(--radius-full)',
                                        }}
                                    >
                                        {config.label}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {format(new Date(notice.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        by {notice.author}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {notice.title}
                                </h3>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    lineHeight: '1.6',
                                    fontSize: '0.9rem',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {notice.content}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', minWidth: '80px' }}>
                                {!isRead && user?.id ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notice.id, user.id);
                                        }}
                                        className="btn btn-ghost"
                                        title="既読にする"
                                        style={{ color: 'var(--success)' }}
                                    >
                                        <CheckCircle size={28} />
                                    </button>
                                ) : (
                                    <div style={{ color: 'var(--success)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <CheckCircle size={24} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>既読済み</span>
                                    </div>
                                )}

                                {(isAdmin || (user?.id && notice.authorId === user.id)) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('本当に削除しますか？')) {
                                                deleteNotice(notice.id);
                                            }
                                        }}
                                        className="btn btn-ghost"
                                        title="削除"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredAndSortedNotices.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        条件に一致するお知らせはありません。
                    </div>
                )}
            </div>

            <NoticeFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <NoticeDetailModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />
        </div>
    );
}
