
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { Send, ArrowLeft, Paperclip, FileText, X, Image as ImageIcon } from 'lucide-react';

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
        if ((!newMessage.trim() && !selectedFile) || !user || !profile) return;

        try {
            await sendMessage(threadId, newMessage, profile.displayName || user.email || 'Unknown', selectedFile || undefined);
            setNewMessage('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error(error);
            alert('送信に失敗しました');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    if (!currentThread && threads.length > 0) {
        // If threads loaded but not found
        return <div>Thread not found</div>;
    }

    return (
        <div style={{
            height: 'calc(100vh - 4rem)', // Adjust for MainLayout padding
            display: 'flex',
            flexDirection: 'column',
            background: '#7297d2', // LINE-like background color
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 10
            }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}
                >
                    <ArrowLeft />
                </button>
                <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                    {currentThread ? currentThread.title : 'Loading...'}
                </h1>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {currentMessages.map((msg) => {
                    const isMe = msg.author_id === user?.id;
                    return (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                alignSelf: isMe ? 'flex-end' : 'flex-start'
                            }}
                        >
                            {!isMe && (
                                <span style={{ fontSize: '0.75rem', color: 'white', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
                                    {msg.author_name}
                                </span>
                            )}
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '0.5rem',
                                flexDirection: isMe ? 'row-reverse' : 'row'
                            }}>
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '1.2rem',
                                    background: isMe ? '#8de055' : 'white', // LINE green for me, white for others
                                    color: 'black',
                                    borderTopRightRadius: isMe ? '0' : '1.2rem',
                                    borderTopLeftRadius: !isMe ? '0' : '1.2rem',
                                    position: 'relative',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    wordBreak: 'break-word',
                                    lineHeight: '1.5'
                                }}>
                                    {msg.content}
                                    {msg.attachment_url && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            {msg.attachment_type?.startsWith('image/') ? (
                                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={msg.attachment_url}
                                                        alt="attachment"
                                                        style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '0.5rem', display: 'block' }}
                                                    />
                                                </a>
                                            ) : (
                                                <a
                                                    href={msg.attachment_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        color: isMe ? 'white' : 'var(--primary)',
                                                        textDecoration: 'none',
                                                        fontSize: '0.85rem',
                                                        background: 'rgba(0,0,0,0.1)',
                                                        padding: '0.5rem',
                                                        borderRadius: '0.5rem'
                                                    }}
                                                >
                                                    <FileText size={16} />
                                                    <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {msg.attachment_name || '添付ファイル'}
                                                    </span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ background: '#f0f0f0', borderTop: '1px solid #ddd' }}>
                {selectedFile && (
                    <div style={{
                        padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid #eee'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '4px', background: '#ddd',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                        }}>
                            {selectedFile.type.startsWith('image/') ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={URL.createObjectURL(selectedFile)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <FileText size={20} color="#666" />
                            )}
                        </div>
                        <span style={{ fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {selectedFile.name}
                        </span>
                        <button
                            onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                <form
                    onSubmit={handleSend}
                    style={{
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center'
                    }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        // Accept standard types
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer', color: '#666',
                            padding: '0.5rem'
                        }}
                    >
                        <Paperclip size={24} />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="メッセージを入力"
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            borderRadius: '20px',
                            border: '1px solid #ccc',
                            background: 'white',
                            outline: 'none',
                            fontSize: '0.95rem'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() && !selectedFile}
                        style={{
                            background: 'transparent',
                            color: (newMessage.trim() || selectedFile) ? '#007bff' : '#ccc',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.5rem',
                            transition: 'color 0.2s'
                        }}
                    >
                        <Send size={24} />
                    </button>
                </form>
            </div>
        </div>
    );
}
