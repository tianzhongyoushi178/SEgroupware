import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNoticeStore } from '@/store/noticeStore';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Info, Bell, AlertTriangle, CheckCircle, Trash2, Edit2 } from 'lucide-react';
import { Notice, NoticeCategory } from '@/types/notice';
import { X } from 'lucide-react';
import NoticeFormModal from './NoticeFormModal';

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
    const { markAsRead, deleteNotice, comments, fetchComments, addComment, isLoadingComments } = useNoticeStore();
    const { user, isAdmin } = useAuthStore();
    const { getAllProfiles } = useAppSettingsStore();
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    const [loadingMap, setLoadingMap] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const router = useRouter(); // Added useRouter

    useEffect(() => {
        if (notice) {
            fetchComments(notice.id);
        }
    }, [notice]);

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

    const handleAddComment = async () => {
        if (!notice || !newComment.trim()) return;
        try {
            await addComment(notice.id, newComment);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment', error);
        }
    };

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
                    padding: '1rem',
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
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{notice.title}</h2>
                        {isAdmin && (notice.startDate || notice.endDate) && (
                            <div style={{ fontSize: '0.8rem', color: '#eab308', marginTop: '0.25rem' }}>
                                掲載期間: {notice.startDate ? format(new Date(notice.startDate), 'M/d HH:mm') : ''} ~ {notice.endDate ? format(new Date(notice.endDate), 'M/d HH:mm') : ''}
                                {(new Date(notice.startDate || 0) > new Date() || new Date(notice.endDate || 9999999999999) < new Date()) && ' (期間外)'}
                            </div>
                        )}
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            by {notice.author}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(isAdmin || (user?.id && notice.authorId === user.id)) && (
                            <>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="btn btn-ghost"
                                    title="編集"
                                >
                                    <Edit2 size={24} />
                                </button>
                                <button
                                    onClick={() => handleDelete()}
                                    className="btn btn-ghost"
                                    title="削除"
                                    style={{ color: 'var(--error)' }}
                                >
                                    <Trash2 size={24} />
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="btn btn-ghost">
                            <X size={24} />
                        </button>
                    </div>
                </header>

                <div style={{ lineHeight: '1.8', color: 'var(--text-main)', whiteSpace: 'pre-wrap', flex: 1, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
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

                {/* Comments Section */}
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        コメント ({comments.length})
                    </h3>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {isLoadingComments ? (
                            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>読み込み中...</div>
                        ) : comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: '#ddd',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {comment.user?.avatarUrl ? (
                                            <img src={comment.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            comment.user?.displayName?.charAt(0) || '?'
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{comment.user?.displayName}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {format(new Date(comment.createdAt), 'M/d HH:mm', { locale: ja })}
                                            </span>
                                        </div>
                                        <div style={{
                                            background: 'var(--background-secondary)',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.9rem',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', background: 'var(--background-secondary)', borderRadius: 'var(--radius-md)' }}>
                                コメントはまだありません
                            </div>
                        )}
                    </div>

                    {user && (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="コメントを追加..."
                                rows={2}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                }}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="btn btn-primary"
                                style={{ height: 'fit-content', alignSelf: 'flex-end' }}
                            >
                                送信
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <footer style={{ marginTop: '2rem', paddingTop: '1rem' }}>
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
                            <button
                                onClick={onClose}
                                className="btn btn-primary"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>

                    {/* Reader List */}
                    {(notice.readStatusVisibleTo === 'all' || isAdmin || (user?.id && notice.authorId === user.id)) && (
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
                </footer>
            </div>

            <NoticeFormModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    // Optionally, refresh the notice data if needed after edit
                    // router.refresh(); // Or call a prop function to refresh parent state
                }}
                initialData={notice}
            />
        </div>
    );
}
