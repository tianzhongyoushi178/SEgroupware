'use client';

import { useState } from 'react';
import { useNoticeStore } from '@/store/noticeStore';
import { NoticeCategory } from '@/types/notice';
import { X } from 'lucide-react';

interface NoticeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NoticeFormModal({ isOpen, onClose }: NoticeFormModalProps) {
    const addNotice = useNoticeStore((state) => state.addNotice);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<NoticeCategory>('general');
    const [author, setAuthor] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addNotice({
            title,
            content,
            category,
            author: author || '匿名',
        });
        onClose();
        // Reset form
        setTitle('');
        setContent('');
        setCategory('general');
        setAuthor('');
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
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>お知らせ作成</h2>
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
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="あなたの名前"
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            キャンセル
                        </button>
                        <button type="submit" className="btn btn-primary">
                            投稿する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
