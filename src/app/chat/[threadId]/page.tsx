
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { Send, ArrowLeft } from 'lucide-react';

export default function ChatRoomPage() {
    const { threadId } = useParams() as { threadId: string };
    const { user, profile } = useAuthStore();
    const {
        messages,
        threads,
        fetchMessages,
        sendMessage,
        initialize,
        subscribeToAll,
        markThreadAsRead
    } = useChatStore();

    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const currentMessages = messages[threadId] || [];
    const currentThread = threads.find(t => t.id === threadId);

    useEffect(() => {
        if (user) {
            initialize(user.id);
            const unsubscribe = subscribeToAll();

            // Initial fetch for this thread
            fetchMessages(threadId);

            // Mark as read on enter
            markThreadAsRead(threadId);

            return () => unsubscribe();
        }
    }, [user, threadId]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        // Also mark as read when new messages arrive if we are looking at it
        if (user) {
            markThreadAsRead(threadId);
        }
    }, [currentMessages, user, threadId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !profile) return;

        try {
            await sendMessage(threadId, newMessage, profile.displayName || user.email || 'Unknown');
            setNewMessage('');
        } catch (error) {
            console.error(error);
            alert('送信に失敗しました');
        }
    };

    if (!currentThread && threads.length > 0) {
        // If threads loaded but not found
        return <div>Thread not found</div>;
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
                padding: '1rem', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface)'
            }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
                >
                    <ArrowLeft />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {currentThread ? currentThread.title : 'Loading...'}
                </h1>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentMessages.map((msg) => {
                    const isMe = msg.author_id === user?.id;
                    return (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '70%',
                                alignSelf: isMe ? 'flex-end' : 'flex-start'
                            }}
                        >
                            {!isMe && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    {msg.author_name}
                                </span>
                            )}
                            <div style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '1rem',
                                background: isMe ? 'var(--primary)' : 'var(--surface-active)',
                                color: isMe ? 'white' : 'var(--text)',
                                borderTopRightRadius: isMe ? '0' : '1rem',
                                borderTopLeftRadius: !isMe ? '0' : '1rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                                {msg.content}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
                onSubmit={handleSend}
                style={{
                    padding: '1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)',
                    display: 'flex', gap: '0.5rem'
                }}
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    style={{
                        flex: 1, padding: '0.75rem', borderRadius: '0.5rem',
                        border: '1px solid var(--border)', background: 'var(--background)'
                    }}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                        padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white',
                        border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
                        opacity: !newMessage.trim() ? 0.5 : 1
                    }}
                >
                    <Send />
                </button>
            </form>
        </div>
    );
}
