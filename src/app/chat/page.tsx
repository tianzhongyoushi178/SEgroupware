
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChatListPage() {
    const { user, isAdmin } = useAuthStore();
    const { threads, fetchThreads, startThread, updateThreadStatus, initialize, subscribeToAll } = useChatStore();
    const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadReason, setNewThreadReason] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (user) {
            initialize(user.id);
            const unsubscribe = subscribeToAll();
            return () => unsubscribe();
        }
    }, [user]);

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await startThread(newThreadTitle, newThreadReason);
            setIsModalOpen(false);
            setNewThreadTitle('');
            setNewThreadReason('');
            alert('スレッド作成を申請しました。管理者の承認をお待ちください。');
        } catch (error) {
            alert('エラーが発生しました');
        }
    };

    const handleApprove = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link click
        e.stopPropagation();
        if (confirm('このスレッドを承認しますか？')) {
            await updateThreadStatus(id, 'approved');
        }
    };

    const handleReject = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('このスレッドを却下しますか？')) {
            await updateThreadStatus(id, 'rejected');
        }
    };

    const displayedThreads = threads.filter(t => t.status === activeTab);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare /> チャットルーム
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> 新規スレッド作成
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('approved')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'approved' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'approved' ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'approved' ? 'bold' : 'normal'
                    }}
                >
                    承認済み
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('pending')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'pending' ? '2px solid var(--primary)' : 'none',
                            color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
                            position: 'relative'
                        }}
                    >
                        申請中
                        {threads.some(t => t.status === 'pending') && (
                            <span style={{
                                position: 'absolute', top: 0, right: 0,
                                width: '8px', height: '8px', borderRadius: '50%', background: 'red'
                            }} />
                        )}
                    </button>
                )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {displayedThreads.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        スレッドがありません
                    </div>
                )}
                {displayedThreads.map(thread => (
                    <Link
                        key={thread.id}
                        href={`/chat/${thread.id}`}
                        style={{
                            display: 'block',
                            padding: '1rem',
                            background: 'var(--surface)',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--border)',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'background 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{thread.title}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {activeTab === 'pending' ? `申請理由: ${thread.request_reason}` : `作成日: ${new Date(thread.created_at).toLocaleDateString()}`}
                                </div>
                            </div>
                            {isAdmin && activeTab === 'pending' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={(e) => handleApprove(thread.id, e)}
                                        style={{ color: 'green', background: 'none', border: 'none', cursor: 'pointer' }}
                                        title="承認"
                                    >
                                        <CheckCircle />
                                    </button>
                                    <button
                                        onClick={(e) => handleReject(thread.id, e)}
                                        style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                                        title="却下"
                                    >
                                        <XCircle />
                                    </button>
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'var(--surface)', padding: '2rem', borderRadius: '1rem',
                        width: '90%', maxWidth: '500px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>新規スレッド作成申請</h2>
                        <form onSubmit={handleCreateThread}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>スレッド名</label>
                                <input
                                    type="text"
                                    value={newThreadTitle}
                                    onChange={e => setNewThreadTitle(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                        border: '1px solid var(--border)', background: 'var(--background)'
                                    }}
                                    placeholder="例: 新規プロジェクトについて"
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>申請理由</label>
                                <textarea
                                    value={newThreadReason}
                                    onChange={e => setNewThreadReason(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                        border: '1px solid var(--border)', background: 'var(--background)',
                                        minHeight: '100px'
                                    }}
                                    placeholder="このスレッドを作成する目的や理由"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={{
                                        padding: '0.5rem 1rem', background: 'transparent',
                                        border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer'
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white',
                                        border: 'none', borderRadius: '0.5rem', cursor: 'pointer'
                                    }}
                                >
                                    申請する
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
