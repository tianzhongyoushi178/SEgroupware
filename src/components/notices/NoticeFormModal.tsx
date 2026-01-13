'use client';

import { useState, useEffect } from 'react';
import { useNoticeStore } from '@/store/noticeStore';
import { useAuthStore } from '@/store/authStore';
import { NoticeCategory, Notice } from '@/types/notice';
import { X, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NoticeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Notice;
}

export default function NoticeFormModal({ isOpen, onClose, initialData }: NoticeFormModalProps) {
    const { addNotice, updateNotice } = useNoticeStore();
    const { user, profile } = useAuthStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<NoticeCategory>('general');
    const [isReadVisibleToAll, setIsReadVisibleToAll] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Auto-derive author name
    const authorName = profile?.displayName || profile?.email || '匿名';

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title);
            setContent(initialData.content);
            setCategory(initialData.category);
            setIsReadVisibleToAll(initialData.readStatusVisibleTo === 'all');
            setStartDate(initialData.startDate || '');
            setEndDate(initialData.endDate || '');
        } else if (isOpen) {
            // Reset for new entry
            setTitle('');
            setContent('');
            setCategory('general');
            setIsReadVisibleToAll(true);
            setStartDate('');
            setEndDate('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (initialData) {
                await updateNotice(initialData.id, {
                    title,
                    content,
                    category,
                    readStatusVisibleTo: isReadVisibleToAll ? 'all' : 'author_admin',
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                });
                toast.success('お知らせを更新しました');
            } else {
                await addNotice({
                    title,
                    content,
                    category,
                    author: authorName,
                    authorId: user?.id,
                    readStatusVisibleTo: isReadVisibleToAll ? 'all' : 'author_admin',
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                });
                toast.success('お知らせを投稿しました');
            }
            onClose();
        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error('投稿に失敗しました: ' + (error.message || '不明なエラー'));
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
                zIndex: 100,
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                className="glass-panel"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    background: 'var(--surface)',
                    padding: '2rem',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{initialData ? 'お知らせを編集' : 'お知らせ作成'}</h2>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>タイトル</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>カテゴリ</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                outline: 'none',
                            }}
                        >
                            <option value="general">一般</option>
                            <option value="system">システム</option>
                            <option value="urgent">重要</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>投稿者名</label>
                        <input
                            type="text"
                            value={authorName}
                            readOnly
                            disabled
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                outline: 'none',
                                background: 'var(--background-secondary)',
                                color: 'var(--text-secondary)',
                                cursor: 'not-allowed'
                            }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            ※プロフィール設定のユーザー名が自動入力されます
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>内容</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows={5}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>掲載開始日 (任意)</label>
                            <input
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>掲載終了日 (任意)</label>
                            <input
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ padding: '0.5rem', background: 'var(--background-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isReadVisibleToAll}
                                onChange={(e) => setIsReadVisibleToAll(e.target.checked)}
                                style={{ width: '1rem', height: '1rem' }}
                            />
                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>既読者を全員に公開する</span>
                        </label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1.5rem', marginTop: '0.2rem' }}>
                            {isReadVisibleToAll
                                ? 'お知らせを読んだ人の名前が全員に表示されます'
                                : '既読者は投稿者と管理者のみ確認できます'}
                        </p>
                    </div>


                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            キャンセル
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={!user}>
                            {initialData ? '更新する' : '投稿する'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
