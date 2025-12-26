import { useEffect, useState } from 'react';
import { useNoticeStore } from '@/store/noticeStore';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Info, Bell, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { Notice, NoticeCategory } from '@/types/notice';
import { X } from 'lucide-react';

interface NoticeDetailModalProps {
    notice: Notice | null;
    onClose: () => void;
}

const categoryConfig: Record<NoticeCategory, { label: string; color: string; icon: any }> = {
    system: { label: 'システム', color: '#2563eb', icon: Info },
    general: { label: '一般', color: '#64748b', icon: Bell },
    urgent: { label: '重要', color: '#ef4444', icon: AlertTriangle },
};

export default function NoticeDetailModal({ notice, onClose }: NoticeDetailModalProps) {
    const { markAsRead, deleteNotice } = useNoticeStore();
    const { user, isAdmin } = useAuthStore();
    const { getAllProfiles } = useAppSettingsStore();
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    const [loadingMap, setLoadingMap] = useState(false);

    useEffect(() => {
        if (notice && (notice.readStatusVisibleTo === 'all' || isAdmin)) {
            setLoadingMap(true);
            getAllProfiles().then((profiles) => {
                const map: Record<string, string> = {};
                profiles.forEach((p) => {
                    map[p.id] = p.display_name || p.email?.split('@')[0] || 'Unknown';
                });
                setUserMap(map);
                setLoadingMap(false);
            });
        }
    }, [notice, isAdmin, getAllProfiles]);

    if (!notice) return null;

    const config = categoryConfig[notice.category];

    const handleDelete = async () => {
        if (confirm('本当に削除しますか？')) {
            await deleteNotice(notice.id);
            onClose();
        }
    };

    return (
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
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    width: '95%',
                    maxWidth: '800px', // Unify size: wider like the page
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <header style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span
                                style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: config.color,
                                    padding: '2px 8px',
                                    background: `${config.color}15`,
                                    borderRadius: '999px'
                                }}
                            >
                                {config.label}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {format(new Date(notice.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            {notice.title}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            by {notice.author}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost">
                        <X size={24} />
                    </button>
                </header>

                <div style={{ lineHeight: '1.8', color: 'var(--text-main)', whiteSpace: 'pre-wrap', flex: 1 }}>
                    {notice.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                        if (part.match(/(https?:\/\/[^\s]+)/g)) {
                            return (
                                <a
                                    key={i}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {part}
                                </a>
                            );
                        }
                        return part;
                    })}
                </div>

                {/* Footer / Actions */}
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        {/* Mark as Read Button */}
                        {user?.id && !notice.readStatus?.[user.id] && (
                            <button
                                onClick={() => user?.id && markAsRead(notice.id, user.id)}
                                className="btn"
                                style={{
                                    background: '#fff7ed',
                                    color: '#c2410c',
                                    border: '1px solid #fed7aa',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <CheckCircle size={20} />
                                チェックして既読にする
                            </button>
                        )}
                        {user?.id && notice.readStatus?.[user.id] && (
                            <div style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={20} />
                                既読済み
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {(isAdmin || (user?.id && notice.authorId === user.id)) && (
                                <button
                                    onClick={handleDelete}
                                    className="btn btn-ghost"
                                    title="削除"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="btn btn-primary"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>

                    {/* Reader List */}
                    {(notice.readStatusVisibleTo === 'all' || isAdmin) && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                既読状況 ({Object.keys(notice.readStatus || {}).length}人)
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {Object.keys(notice.readStatus || {}).length > 0 ? (
                                    Object.keys(notice.readStatus || {}).map((readerId) => {
                                        const name = userMap[readerId] || (loadingMap ? '読み込み中...' : '不明なユーザー');
                                        return (
                                            <span
                                                key={readerId}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    background: 'var(--background-secondary)',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--border)',
                                                }}
                                            >
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
    );
}
