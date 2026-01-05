
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChatListPage() {
    const { user, isAdmin } = useAuthStore();
    const { threads, fetchThreads, startThread, updateThreadStatus, initialize, subscribeToAll } = useChatStore();
    const { users: allUsers, fetchUsers } = useUserStore();
    const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadReason, setNewThreadReason] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const router = useRouter();

    // Global initialization is handled in Sidebar/Layout
    // useEffect(() => {
    //     if (user) {
    //         initialize(user.id);
    //         const unsubscribe = subscribeToAll();
    //         return () => unsubscribe();
    //     }
    // }, [user]);

    useEffect(() => {
        if (isModalOpen) {
            fetchUsers();
            setNewThreadTitle('');
            setNewThreadReason('');
            setIsPrivate(false);
            setSelectedParticipants([]);
        }
    }, [isModalOpen]);

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const status = isAdmin ? 'approved' : 'pending';
            await startThread(newThreadTitle, newThreadReason, isPrivate, selectedParticipants, status);
            setIsModalOpen(false);
            setNewThreadTitle('');
            setNewThreadReason('');
            if (isAdmin) {
                alert('スレッドを作成しました。');
            } else {
                alert('スレッド作成を申請しました。管理者の承認をお待ちください。');
            }
        } catch (error: any) {
            console.error('Thread creation error:', error);
            alert(`エラーが発生しました: ${error.message || '不明なエラー'}`);
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

            {/* Tabs (Only for Admin) */}
            {isAdmin && (
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
                </div>
            )}

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
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {thread.title}
                                    {thread.unreadCount && thread.unreadCount > 0 ? (
                                        <span style={{
                                            background: 'red',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            padding: '0.1rem 0.5rem',
                                            borderRadius: '1rem',
                                            minWidth: '20px',
                                            textAlign: 'center',
                                            display: 'inline-block'
                                        }}>
                                            {thread.unreadCount}
                                        </span>
                                    ) : null}
                                </div>
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
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {isAdmin ? '新規スレッド作成' : '新規スレッド作成申請'}
                        </h2>
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
                                        minHeight: '80px'
                                    }}
                                    placeholder="このスレッドを作成する目的や理由"
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={e => setIsPrivate(e.target.checked)}
                                        style={{ width: '1.2rem', height: '1.2rem' }}
                                    />
                                    プライベートスレッド（参加者限定）
                                </label>
                                {isPrivate && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                            参加者を選択 ({selectedParticipants.length}名)
                                        </p>
                                        <div style={{
                                            border: '1px solid var(--border)', borderRadius: '4px',
                                            maxHeight: '150px', overflowY: 'auto', background: 'white'
                                        }}>
                                            {allUsers.map(u => (
                                                <label key={u.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                    padding: '0.5rem', borderBottom: '1px solid #eee', cursor: 'pointer',
                                                    background: selectedParticipants.includes(u.id) ? '#f0f9ff' : 'white'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedParticipants.includes(u.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                setSelectedParticipants(prev => [...prev, u.id]);
                                                            } else {
                                                                setSelectedParticipants(prev => prev.filter(id => id !== u.id));
                                                            }
                                                        }}
                                                        style={{ width: '1rem', height: '1rem' }}
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{u.display_name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#888' }}>{u.email}</span>
                                                    </div>
                                                    {selectedParticipants.includes(u.id) && <Check size={16} color="var(--primary)" style={{ marginLeft: 'auto' }} />}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                                    {isAdmin ? '作成する' : '申請する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
