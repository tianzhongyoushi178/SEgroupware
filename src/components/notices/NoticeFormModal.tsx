'use client';

import { useState, useEffect } from 'react';
import { useNoticeStore } from '@/store/noticeStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { NoticeCategory, Notice } from '@/types/notice';
import { X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NoticeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Notice;
    prefillData?: Partial<Notice>;
}

export default function NoticeFormModal({ isOpen, onClose, initialData, prefillData }: NoticeFormModalProps) {
    const { addNotice, updateNotice } = useNoticeStore();
    const { user, profile } = useAuthStore();
    const { users, fetchUsers } = useUserStore();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<NoticeCategory>('general');
    const [isReadVisibleToAll, setIsReadVisibleToAll] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [targetType, setTargetType] = useState<'all' | 'admin' | 'specific'>('all');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // Auto-derive author name
    const authorName = profile?.displayName || profile?.email || '匿名';

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                setTitle(initialData.title);
                setContent(initialData.content);
                setCategory(initialData.category);
                setIsReadVisibleToAll(initialData.readStatusVisibleTo === 'all');
                setStartDate(initialData.startDate || '');
                setEndDate(initialData.endDate || '');

                const audience = initialData.targetAudience || ['all'];
                if (audience.includes('all')) {
                    setTargetType('all');
                    setSelectedUserIds([]);
                } else if (audience.includes('admin') && audience.length === 1) {
                    setTargetType('admin');
                    setSelectedUserIds([]);
                } else {
                    setTargetType('specific');
                    const userIds = audience.filter(a => a.startsWith('user:')).map(a => a.replace('user:', ''));
                    setSelectedUserIds(userIds);
                }
            } else {
                // New Mode (possibly with prefill)
                setTitle(prefillData?.title || '');
                setContent(prefillData?.content || '');
                setCategory(prefillData?.category || 'general');
                setIsReadVisibleToAll(true);
                setStartDate('');
                setEndDate('');
                setTargetType('all');
                setSelectedUserIds([]);
            }
        }
    }, [isOpen, initialData, prefillData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let targetAudience: string[] = ['all'];
            if (targetType === 'admin') {
                targetAudience = ['admin'];
            } else if (targetType === 'specific') {
                if (selectedUserIds.length === 0) {
                    toast.error('対象ユーザーを選択してください');
                    return;
                }
                targetAudience = selectedUserIds.map(id => `user:${id}`);
            }

            if (initialData) {
                await updateNotice(initialData.id, {
                    title,
                    content,
                    category,
                    readStatusVisibleTo: isReadVisibleToAll ? 'all' : 'author_admin',
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    targetAudience
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
                    targetAudience
                });
                toast.success('お知らせを投稿しました');
            }
            onClose();
        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error('投稿に失敗しました: ' + (error.message || '不明なエラー'));
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
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
                padding: '1rem', // Prevent full edge touch
            }}
            onClick={onClose}
        >
            <div
                className="glass-panel"
                style={{
                    width: '100%',
                    maxWidth: '600px', // Slightly wider
                    background: 'var(--surface)',
                    padding: '2rem',
                    maxHeight: '90vh', // Prevent overflow
                    overflowY: 'auto', // Enable scrolling
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'sticky', top: '-2rem', background: 'var(--surface)', zIndex: 10, padding: '1rem 0', marginTop: '-1rem', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{initialData ? 'お知らせを編集' : 'お知らせ作成'}</h2>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Title */}
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

                    {/* Category */}
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

                    {/* Target Audience */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>公開範囲</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: targetType === 'all' ? 'var(--primary-light)' : 'var(--background-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                                <input
                                    type="radio"
                                    checked={targetType === 'all'}
                                    onChange={() => setTargetType('all')}
                                    name="audience"
                                    style={{ display: 'none' }}
                                />
                                {targetType === 'all' && <Check size={16} />}
                                全員
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: targetType === 'admin' ? 'var(--primary-light)' : 'var(--background-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                                <input
                                    type="radio"
                                    checked={targetType === 'admin'}
                                    onChange={() => setTargetType('admin')}
                                    name="audience"
                                    style={{ display: 'none' }}
                                />
                                {targetType === 'admin' && <Check size={16} />}
                                管理者のみ
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: targetType === 'specific' ? 'var(--primary-light)' : 'var(--background-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                                <input
                                    type="radio"
                                    checked={targetType === 'specific'}
                                    onChange={() => setTargetType('specific')}
                                    name="audience"
                                    style={{ display: 'none' }}
                                />
                                {targetType === 'specific' && <Check size={16} />}
                                ユーザー指定
                            </label>
                        </div>

                        {targetType === 'specific' && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--background-secondary)', borderRadius: 'var(--radius-md)', maxHeight: '200px', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>ユーザーを選択 ({selectedUserIds.length})</span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUserIds(users.map(u => u.id))}
                                        style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        全選択
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                    {users.map(u => (
                                        <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px', background: selectedUserIds.includes(u.id) ? 'white' : 'transparent', color: selectedUserIds.includes(u.id) ? 'black' : 'inherit' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedUserIds.includes(u.id)}
                                                onChange={() => toggleUserSelection(u.id)}
                                            />
                                            <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}>{u.display_name || u.email}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Author (Read-only) */}
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
                    </div>

                    {/* Content */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>内容</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows={8}
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

                    {/* Dates - REMOVED 
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
                    */}

                    {/* Read Status Visibility */}
                    <div style={{ padding: '0.75rem', background: 'var(--background-secondary)', borderRadius: 'var(--radius-md)' }}>
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', position: 'sticky', bottom: '-2rem', background: 'var(--surface)', padding: '1rem 0', margin: '-1rem 0 -2rem', borderTop: '1px solid var(--border)' }}>
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
