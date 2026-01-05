'use client';

import { useState, useEffect } from 'react';
import { useNoticeStore } from '@/store/noticeStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Bell, Info, AlertTriangle, CheckCircle, Trash2, Filter, ArrowUpDown } from 'lucide-react'; // Added icons
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
    const [isMobile, setIsMobile] = useState(false);

    // Responsive check
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            // Retention Policy: 1 Month
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            if (new Date(notice.createdAt) < oneMonthAgo) return false;

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
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '5rem' }}>
            <header style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: isMobile ? '1rem' : '0' }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            お知らせ
                        </h1>
                        {!isMobile && (
                            <p style={{ color: 'var(--text-secondary)' }}>
                                社内の最新情報やお知らせを確認できます。（保存期間: 1ヶ月）
                            </p>
                        )}
                    </div>
                    <button id="tutorial-notice-create-btn" onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ padding: isMobile ? '0.5rem 1rem' : undefined }}>
                        {isMobile ? '投稿' : '新規作成'}
                    </button>
                </div>

                {/* Mobile Tabs */}
                {isMobile ? (
                    <div id="tutorial-notice-filter-mobile" style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        background: 'var(--background)',
                        padding: '0.5rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        gap: '0.5rem',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        scrollbarWidth: 'none'
                    }}>
                        <button
                            onClick={() => setFilterCategory('all')}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '999px',
                                background: filterCategory === 'all' ? 'var(--primary)' : 'var(--surface)',
                                color: filterCategory === 'all' ? 'white' : 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                            }}
                        >
                            すべて
                        </button>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setFilterCategory(key as NoticeCategory)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '999px',
                                    background: filterCategory === key ? config.color : 'var(--surface)',
                                    color: filterCategory === key ? 'white' : config.color,
                                    border: filterCategory === key ? 'none' : `1px solid ${config.color}30`,
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    opacity: filterCategory === key || filterCategory === 'all' ? 1 : 0.6
                                }}
                            >
                                {config.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    /* Desktop Controls */
                    <div id="tutorial-notice-filter-desktop" style={{
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
                            <ArrowUpDown size={16} />
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
                            <Filter size={16} />
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
                )}
            </header>

            <div style={{ display: 'grid', gap: '1rem', padding: isMobile ? '0 1rem' : '0' }}>
                {filteredAndSortedNotices.map((notice) => {
                    const config = categoryConfig[notice.category];
                    const Icon = config.icon;
                    const isRead = user?.id ? !!notice.readStatus?.[user.id] : false;

                    return (
                        <div
                            key={notice.id}
                            className={isMobile ? '' : 'glass-panel'}
                            onClick={() => setSelectedNoticeId(notice.id)}
                            style={{
                                padding: '1.5rem',
                                display: 'flex',
                                gap: '1.5rem',
                                opacity: isRead ? 0.9 : 1,
                                borderLeft: `4px solid ${config.color}`,
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                background: isRead ? 'var(--background-secondary)' : 'var(--surface)',
                                boxShadow: isMobile ? '0 1px 3px rgba(0,0,0,0.1)' : undefined,
                                borderRadius: isMobile ? '0.5rem' : undefined,
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
                                        {format(new Date(notice.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                    </span>
                                    {!isMobile && (
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            by {notice.author}
                                        </span>
                                    )}
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

                            {!isMobile && (
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
                            )}
                        </div>
                    );
                })}

                {filteredAndSortedNotices.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        お知らせはありません。
                    </div>
                )}
            </div>

            <NoticeFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <NoticeDetailModal notice={selectedNotice} onClose={() => setSelectedNoticeId(null)} />
        </div>
    );
}
