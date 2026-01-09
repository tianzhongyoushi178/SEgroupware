import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, StickyNote, User } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';

interface NoteOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    threadId: string;
}

export default function NoteOverlay({ isOpen, onClose, threadId }: NoteOverlayProps) {
    const { user } = useAuthStore();
    const { notes, fetchNotes, addNote, deleteNote } = useChatStore();
    const { users } = useUserStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');

    const threadNotes = notes[threadId] || [];

    useEffect(() => {
        if (isOpen) {
            fetchNotes(threadId);
        }
    }, [isOpen, threadId, fetchNotes]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteContent.trim()) return;
        try {
            await addNote(threadId, newNoteContent);
            setNewNoteContent('');
            setIsCreating(false);
        } catch (error) {
            console.error(error);
            alert('ノートの作成に失敗しました');
        }
    };

    const handleDelete = async (noteId: string) => {
        if (!confirm('このノートを削除しますか？')) return;
        try {
            await deleteNote(threadId, noteId);
        } catch (error) {
            console.error(error);
            alert('削除に失敗しました');
        }
    };

    const getUserName = (uid: string) => {
        const u = users.find(u => u.id === uid);
        return u ? (u.display_name || u.email) : 'Unknown User';
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            width: '100%', maxWidth: '400px',
            background: 'var(--surface)',
            borderLeft: '1px solid var(--border)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.1)'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--surface)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                    <StickyNote size={20} />
                    ノート
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--background-secondary)' }}>
                {isCreating ? (
                    <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>新規ノート作成</h3>
                        <form onSubmit={handleAddNote}>
                            <textarea
                                value={newNoteContent}
                                onChange={e => setNewNoteContent(e.target.value)}
                                style={{
                                    width: '100%', minHeight: '100px', padding: '0.5rem',
                                    borderRadius: '4px', border: '1px solid var(--border)',
                                    marginBottom: '0.5rem', fontFamily: 'inherit'
                                }}
                                placeholder="重要な情報をここに入力..."
                                required
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    style={{
                                        padding: '0.5rem 1rem', background: 'transparent',
                                        border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer'
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white',
                                        border: 'none', borderRadius: '4px', cursor: 'pointer'
                                    }}
                                >
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setIsCreating(true)}
                            style={{
                                width: '100%', padding: '0.75rem',
                                background: 'white', border: '2px dashed var(--border)',
                                borderRadius: '8px', color: 'var(--text-secondary)',
                                cursor: 'pointer', marginBottom: '1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                fontWeight: 'bold'
                            }}
                        >
                            <Plus size={18} /> ノートを作成
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {threadNotes.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                                    ノートはまだありません
                                </div>
                            )}
                            {threadNotes.map(note => (
                                <div key={note.id} style={{
                                    background: 'var(--surface)', padding: '1rem',
                                    borderRadius: '8px', border: '1px solid var(--border)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        {note.content}
                                    </div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        fontSize: '0.8rem', color: 'var(--text-secondary)',
                                        borderTop: '1px solid var(--border)', paddingTop: '0.5rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <User size={12} />
                                            {getUserName(note.author_id)}
                                            <span style={{ margin: '0 0.25rem' }}>•</span>
                                            {new Date(note.created_at).toLocaleDateString()}
                                        </div>
                                        {user?.id === note.author_id && (
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#dc2626', padding: '0.2rem'
                                                }}
                                                title="削除"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
