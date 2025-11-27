'use client';

import { useState } from 'react';
import { useNoticeStore } from '@/store/noticeStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Bell, Info, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { NoticeCategory } from '@/types/notice';
import NoticeFormModal from '@/components/notices/NoticeFormModal';

const categoryConfig: Record<NoticeCategory, { label: string; color: string; icon: any }> = {
    system: { label: 'システム', color: '#2563eb', icon: Info },
    general: { label: '一般', color: '#64748b', icon: Bell },
    urgent: { label: '重要', color: '#ef4444', icon: AlertTriangle },
};

export default function NoticesPage() {
    const { notices, markAsRead, deleteNotice } = useNoticeStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {notices.map((notice) => {
                    const config = categoryConfig[notice.category];
                    const Icon = config.icon;

                    return (
                        <div
                            key={notice.id}
                            className="glass-panel"
                            style={{
                                padding: '1.5rem',
                                display: 'flex',
                                gap: '1.5rem',
                                opacity: notice.isRead ? 0.8 : 1,
                                borderLeft: `4px solid ${config.color}`,
                                transition: 'all 0.2s',
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

                            <div style={{ flex: 1 }}>
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

                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {notice.title}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                    {notice.content}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {!notice.isRead && (
                                    <button
                                        onClick={() => markAsRead(notice.id)}
                                        className="btn btn-ghost"
                                        title="既読にする"
                                        style={{ color: 'var(--success)' }}
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteNotice(notice.id)}
                                    className="btn btn-ghost"
                                    title="削除"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {notices.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        お知らせはありません。
                    </div>
                )}
            </div>

            <NoticeFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
