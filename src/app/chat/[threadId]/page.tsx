
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, Send, Trash2, User, Bot, Paperclip, FileText, X, Settings, StickyNote, Megaphone, ChevronDown, Check, AlertTriangle, Smile, Plus } from 'lucide-react';
import NoteOverlay from '@/components/chat/NoteOverlay';

const STAMPS = [
    { id: 'ok', src: '/stamps/stamp_ok.png', label: 'OK' },
    { id: 'good', src: '/stamps/stamp_good.png', label: 'Good' },
    { id: 'check', src: '/stamps/stamp_check.png', label: 'Check' },
];

export default function ChatRoomPage() {
    const { threadId } = useParams() as { threadId: string };
    const { user, profile, isAdmin } = useAuthStore();
    const {
        messages,
        threads,
        fetchMessages,
        sendMessage,
        initialize,
        subscribeToAll,
        markThreadAsRead,
        updateThreadSettings,
        fetchThreadParticipants,
        deleteThread,
        deleteMessage,
        addReaction,
        removeReaction
    } = useChatStore();

    const { users: allUsers, fetchUsers, isLoading: isUsersLoading } = useUserStore();

    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [errorModal, setErrorModal] = useState<string | null>(null);
    // undefined = loading, null = never read, string = read at
    const [initialReadTimestamp, setInitialReadTimestamp] = useState<string | null | undefined>(undefined);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Track last message ID to detect new messages for auto-scroll
    const lastMessageIdRef = useRef<string | null>(null);
    const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const currentMessages = messages[threadId] || [];
    const currentThread = threads.find(t => t.id === threadId);

    // Data fetch
    useEffect(() => {
        if (user) {
            fetchMessages(threadId);
        }
    }, [user, threadId]);

    // Read status management
    useEffect(() => {
        // Wait for user and thread data to be ready
        if (!user || !currentThread) return;

        // Capture initial read timestamp ONLY if we haven't done so yet
        if (initialReadTimestamp === undefined) {
            const currentRead = currentThread.last_read_at || null;
            setInitialReadTimestamp(currentRead);

            // Mark as read immediately after capturing
            // ensuring we don't overwrite the DB before capturing
            markThreadAsRead(threadId);
        }
    }, [user, currentThread, initialReadTimestamp, threadId, markThreadAsRead]);

    // Scroll to bottom logic
    useEffect(() => {
        if (currentMessages.length > 0) {
            const lastMsg = currentMessages[currentMessages.length - 1];

            // 1. Initial Scroll
            if (!hasInitialScrolled) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                setHasInitialScrolled(true);
                lastMessageIdRef.current = lastMsg.id;
                return;
            }

            // 2. New Message Scroll
            // Only scroll if the last message ID has changed
            if (lastMsg.id !== lastMessageIdRef.current) {
                // Determine if we should scroll? 
                // For now, always scroll on new message ensures we see incoming. 
                // Ideally, check if user is near bottom or if it's my message.
                // But simplified: Just scroll.
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                lastMessageIdRef.current = lastMsg.id;

                // Also mark as read when new messages arrive
                if (user) {
                    markThreadAsRead(threadId);
                }
            }
        }
    }, [currentMessages, hasInitialScrolled, user, threadId, markThreadAsRead]);

    // Fetch settings when modal opens
    useEffect(() => {
        if (isSettingsOpen) {
            fetchUsers();
            if (currentThread) {
                setIsPrivate(currentThread.is_private || false);
                // Fetch current participants
                fetchThreadParticipants(threadId).then(ids => {
                    setSelectedParticipants(ids);
                });
            }
        }
    }, [isSettingsOpen, threadId, currentThread]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !user || !profile) return;

        try {
            await sendMessage(threadId, newMessage, profile.displayName || user.email || 'Unknown', selectedFile || undefined);
            setNewMessage('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            console.error(error);
            alert(`送信に失敗しました: ${error.message || '不明なエラー'}`);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // 10MB limit
            if (file.size > 10 * 1024 * 1024) {
                setErrorModal('ファイルサイズは10MBまでです。');
                e.target.value = ''; // Reset input
                return;
            }
            setSelectedFile(file);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    if (blob.size > 10 * 1024 * 1024) {
                        setErrorModal('ファイルサイズは10MBまでです。');
                        return;
                    }
                    setSelectedFile(blob);
                    e.preventDefault(); // Prevent pasting the image binary string
                }
            }
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('このメッセージを削除しますか？')) return;
        try {
            await deleteMessage(threadId, messageId);
        } catch (error) {
            console.error(error);
            alert('削除に失敗しました');
        }
    };

    const handleSaveSettings = async () => {
        try {
            await updateThreadSettings(threadId, isPrivate, selectedParticipants);
            setIsSettingsOpen(false);
            alert('設定を保存しました');
        } catch (e) {
            console.error(e);
            alert('設定の保存に失敗しました');
        }
    };

    const handleDeleteThread = async () => {
        if (!confirm('本当にこのスレッドを削除しますか？\nメッセージもすべて削除され、元に戻すことはできません。')) return;

        try {
            await deleteThread(threadId);
            router.push('/chat'); // Back to list
        } catch (e) {
            console.error(e);
            alert('削除に失敗しました');
        }
    }

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, [newMessage]);

    const handleQuote = (text: string) => {
        const quoteText = text.split('\n').map(line => `> ${line}`).join('\n') + '\n';
        setNewMessage(prev => prev + quoteText);
        // Focus input
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const formatMessage = (content: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.split(urlRegex).map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>
                        {part}
                    </a>
                );
            }
            return part;
        });
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
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 10,
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => router.back()}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}
                    >
                        <ArrowLeft />
                    </button>
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                        {currentThread ? currentThread.title : 'Loading...'}
                        {currentThread?.is_private && <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', color: '#666' }}>🔒</span>}
                    </h1>
                </div>
                {/* Header Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setIsNoteOpen(!isNoteOpen)}
                        style={{
                            background: isNoteOpen ? 'rgba(0,0,0,0.1)' : 'none',
                            border: 'none', cursor: 'pointer', color: '#555',
                            padding: '0.5rem', borderRadius: '4px',
                            display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}
                        title="ノート"
                    >
                        <StickyNote size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>ノート</span>
                    </button>
                    {/* Settings Button (Only for creator or admin) */}
                    {(isAdmin || currentThread?.created_by === user?.id) && (
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}
                        >
                            <Settings size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Announcement Bar */}
            {currentThread?.pinned_message_id && (
                <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.85rem', color: '#333',
                    zIndex: 9,
                    cursor: 'pointer'
                }}
                    onClick={() => {
                        // Scroll to message
                        const el = document.getElementById(`wrapper-${currentThread.pinned_message_id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                >
                    <Megaphone size={16} color="#007bff" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>アナウンス:</span>
                        {/* Find message content if available, otherwise "Loading..." or similar. 
                             Ideally we should look up content from thread messages. */}
                        {(() => {
                            const pinnedMsg = currentMessages.find(m => m.id === currentThread.pinned_message_id);
                            return pinnedMsg ? pinnedMsg.content : 'メッセージを読み込み中...';
                        })()}
                    </div>
                    {(isAdmin || currentThread.created_by === user?.id) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!currentThread) return;
                                if (confirm('アナウンスを解除しますか？')) {
                                    useChatStore.getState().unpinMessage(currentThread.id);
                                }
                            }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999' }}
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={14} color="#999" />
                </div>
            )}

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {currentMessages.map((msg, index) => {
                    const isMe = msg.author_id === user?.id;
                    const isAI = msg.author_name === 'AI';

                    // Check if this is the first unread message
                    let showUnreadDivider = false;
                    // Check if strictly undefined (loading). If null (never read), we proceed.
                    if (initialReadTimestamp !== undefined && !isMe) {
                        const msgTime = new Date(msg.created_at).getTime();
                        // If never read (null), treat readTime as 0
                        const readTime = initialReadTimestamp ? new Date(initialReadTimestamp).getTime() : 0;

                        // If message is newer than read time
                        if (msgTime > readTime) {
                            // Check if previous message was read (or if this is the first message)
                            const prevMsg = index > 0 ? currentMessages[index - 1] : null;
                            if (!prevMsg) {
                                // First message in list is unread
                                showUnreadDivider = true;
                            } else {
                                const prevMsgTime = new Date(prevMsg.created_at).getTime();
                                // Display if previous message was older or equal to read time
                                if (prevMsgTime <= readTime) {
                                    showUnreadDivider = true;
                                }
                            }
                        }
                    }

                    return (
                        <div id={`wrapper-${msg.id}`} key={`wrapper-${msg.id}`} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                            {showUnreadDivider && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '1rem 0',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        height: '1px',
                                        background: '#cc0000',
                                        flex: 1,
                                        opacity: 0.5
                                    }}></div>
                                    <span style={{
                                        background: '#cc0000',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        padding: '0.1rem 0.5rem',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        zIndex: 1
                                    }}>
                                        ここから未読
                                    </span>
                                    <div style={{
                                        height: '1px',
                                        background: '#cc0000',
                                        flex: 1,
                                        opacity: 0.5
                                    }}></div>
                                </div>
                            )}
                            <div style={{
                                display: 'flex',
                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                marginBottom: '0.5rem',
                                paddingLeft: isMe ? '20%' : '0',
                                paddingRight: isMe ? '0' : '20%'
                            }}>
                                {!isMe && (
                                    <div style={{ marginRight: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%', background: isAI ? '#19c37d' : '#ccc',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                                            fontWeight: 'bold', fontSize: '0.8rem', overflow: 'hidden'
                                        }}>
                                            {isAI ? <Bot size={20} /> : <User size={20} />}
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                                    {!isMe && (
                                        <span style={{ fontSize: '0.75rem', marginBottom: '0.2rem', color: '#333' }}>
                                            {msg.author_name}
                                        </span>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                        <div style={{
                                            background: msg.is_deleted ? '#f0f0f0' : (isMe ? '#007bff' : 'white'),
                                            color: msg.is_deleted ? '#666' : (isMe ? 'white' : 'black'),
                                            padding: '0.75rem 1rem',
                                            borderRadius: '1.2rem',
                                            borderTopRightRadius: isMe ? '0' : '1.2rem',
                                            borderTopLeftRadius: !isMe ? '0' : '1.2rem',
                                            position: 'relative',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            wordBreak: 'break-word',
                                            lineHeight: '1.5',
                                            whiteSpace: 'pre-wrap',
                                            fontStyle: msg.is_deleted ? 'italic' : 'normal',
                                            cursor: !msg.is_deleted ? 'pointer' : 'default',
                                            minWidth: '60px'
                                        }}
                                            onClick={() => !msg.is_deleted && handleQuote(msg.content)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                if (msg.is_deleted) return;
                                                // Basic implementation: confirm to pin
                                                if (isAdmin || currentThread?.created_by === user?.id) {
                                                    if (confirm('このメッセージをアナウンスとしてピン留めしますか？')) {
                                                        useChatStore.getState().pinMessage(currentThread!.id, msg.id);
                                                    }
                                                }
                                            }}
                                            title="クリック: 引用 / 右クリック: アナウンス登録"
                                        >
                                            {msg.is_deleted ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Trash2 size={14} /> このメッセージは削除されました
                                                </span>
                                            ) : (
                                                <>
                                                    {formatMessage(msg.content)}
                                                    {msg.attachment_url && (
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            {msg.attachment_type?.startsWith('image/') ? (
                                                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
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
                                                                    onClick={(e) => e.stopPropagation()}
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
                                                </>
                                            )}
                                        </div>
                                        {!msg.is_deleted && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }}>
                                                    {new Date(msg.created_at).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteMessage(msg.id);
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '0',
                                                            color: 'rgba(255,255,255,0.9)', // Increased visibility
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            zIndex: 5 // Ensure it's on top
                                                        }}
                                                        title="削除"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* Reactions Display */}
                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                            {Object.entries(msg.reactions).map(([stampId, userIds]) => {
                                                if (!userIds || userIds.length === 0) return null;
                                                const stamp = STAMPS.find(s => s.id === stampId);
                                                if (!stamp) return null;
                                                const isReactedByMe = userIds.includes(user?.id || '');
                                                return (
                                                    <button
                                                        key={stampId}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isReactedByMe) {
                                                                removeReaction(threadId, msg.id, stampId);
                                                            } else {
                                                                addReaction(threadId, msg.id, stampId);
                                                            }
                                                        }}
                                                        style={{
                                                            background: isReactedByMe ? 'rgba(0,123,255,0.2)' : 'rgba(255,255,255,0.8)',
                                                            border: isReactedByMe ? '1px solid #007bff' : '1px solid #ddd',
                                                            borderRadius: '12px',
                                                            padding: '2px 6px',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            fontSize: '0.75rem'
                                                        }}
                                                        title={userIds.length + '人がリアクションしました'}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={stamp.src} alt={stamp.label} style={{ width: '20px', height: '20px' }} />
                                                        <span style={{ color: '#555' }}>{userIds.length}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Reaction Picker Button (Visible on hover or if picker is open) */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        marginTop: '2px'
                                    }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReactionPickerMessageId(reactionPickerMessageId === msg.id ? null : msg.id);
                                            }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer', color: '#999',
                                                padding: '2px', display: 'flex', alignItems: 'center'
                                            }}
                                            title="リアクションを追加"
                                        >
                                            <Smile size={16} />
                                        </button>

                                        {reactionPickerMessageId === msg.id && (
                                            <div style={{
                                                position: 'absolute',
                                                zIndex: 100,
                                                background: 'white',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                display: 'flex',
                                                gap: '8px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                marginTop: '24px', // Push down slightly
                                            }}
                                                onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
                                            >
                                                {STAMPS.map(stamp => (
                                                    <button
                                                        key={stamp.id}
                                                        onClick={() => {
                                                            addReaction(threadId, msg.id, stamp.id);
                                                            setReactionPickerMessageId(null);
                                                        }}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            padding: '4px', borderRadius: '4px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={stamp.src} alt={stamp.label} style={{ width: '32px', height: '32px' }} />
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setReactionPickerMessageId(null)}
                                                    style={{ marginLeft: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#999' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {/* Reactions Display */}
                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                            {Object.entries(msg.reactions).map(([stampId, userIds]) => {
                                                if (!userIds || userIds.length === 0) return null;
                                                const stamp = STAMPS.find(s => s.id === stampId);
                                                if (!stamp) return null;
                                                const isReactedByMe = userIds.includes(user?.id || '');
                                                return (
                                                    <button
                                                        key={stampId}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isReactedByMe) {
                                                                removeReaction(threadId, msg.id, stampId);
                                                            } else {
                                                                addReaction(threadId, msg.id, stampId);
                                                            }
                                                        }}
                                                        style={{
                                                            background: isReactedByMe ? 'rgba(0,123,255,0.2)' : 'rgba(255,255,255,0.8)',
                                                            border: isReactedByMe ? '1px solid #007bff' : '1px solid #ddd',
                                                            borderRadius: '12px',
                                                            padding: '2px 6px',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            fontSize: '0.75rem'
                                                        }}
                                                        title={userIds.length + '人がリアクションしました'}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={stamp.src} alt={stamp.label} style={{ width: '20px', height: '20px' }} />
                                                        <span style={{ color: '#555' }}>{userIds.length}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Reaction Picker Button */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        marginTop: '2px',
                                        position: 'relative'
                                    }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReactionPickerMessageId(reactionPickerMessageId === msg.id ? null : msg.id);
                                            }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer', color: '#999',
                                                padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.6
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                                            title="リアクションを追加"
                                        >
                                            <Smile size={16} />
                                        </button>

                                        {reactionPickerMessageId === msg.id && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                [isMe ? 'right' : 'left']: 0,
                                                zIndex: 100,
                                                background: 'white',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                display: 'flex',
                                                gap: '8px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                marginTop: '4px'
                                            }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {STAMPS.map(stamp => (
                                                    <button
                                                        key={stamp.id}
                                                        onClick={() => {
                                                            addReaction(threadId, msg.id, stamp.id);
                                                            setReactionPickerMessageId(null);
                                                        }}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            padding: '4px', borderRadius: '4px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={stamp.src} alt={stamp.label} style={{ width: '32px', height: '32px' }} />
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setReactionPickerMessageId(null)}
                                                    style={{ marginLeft: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#999' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                        <button
                            onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginRight: '0.5rem' }}
                        >
                            <X size={18} />
                        </button>
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
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={e => {
                            // Desktop: Enter sends, Shift+Enter newlines
                            // Mobile: Enter newlines (default), only Send button sends
                            if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder="メッセージを入力"
                        className="chat-input-textarea"
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            borderRadius: '20px',
                            border: '1px solid #ccc',
                            outline: 'none',
                            fontSize: '0.95rem',
                            resize: 'none',
                            minHeight: '44px',
                            maxHeight: '120px',
                            fontFamily: 'inherit'
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

            {/* Settings Modal */}
            {
                isSettingsOpen && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 100,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <div style={{
                            background: 'var(--surface)', borderRadius: '8px', padding: '1.5rem',
                            width: '90%', maxWidth: '500px', maxHeight: '90%', overflowY: 'auto',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            color: 'var(--text-main)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>スレッド設定</h2>
                                <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: 'var(--text-main)' }}><X size={24} /></button>
                            </div>

                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--background-secondary)', borderRadius: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={e => setIsPrivate(e.target.checked)}
                                        style={{ width: '1.2rem', height: '1.2rem' }}
                                    />
                                    プライベートスレッド（参加者限定）
                                </label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '2rem', marginTop: '0.5rem' }}>
                                    チェックを入れると、選択したユーザーのみがこのスレッドを閲覧・投稿できるようになります。
                                </p>
                            </div>

                            {isPrivate && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        参加者を選択 ({selectedParticipants.length}名)
                                    </h3>
                                    <div style={{
                                        border: '1px solid var(--border)', borderRadius: '4px',
                                        maxHeight: '250px', overflowY: 'auto'
                                    }}>
                                        {isUsersLoading && allUsers.length === 0 && (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>ユーザーを読み込み中...</div>
                                        )}
                                        {!isUsersLoading && allUsers.length === 0 && (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>ユーザーが見つかりません</div>
                                        )}
                                        {allUsers.map(u => (
                                            <label key={u.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '0.75rem', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                                background: selectedParticipants.includes(u.id) ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                                transition: 'background 0.2s'
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
                                                    style={{ width: '1.1rem', height: '1.1rem' }}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{u.display_name || '名称未設定'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</span>
                                                </div>
                                                {selectedParticipants.includes(u.id) && <Check size={16} color="var(--primary)" style={{ marginLeft: 'auto' }} />}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                {/* Delete Button */}
                                <button
                                    onClick={handleDeleteThread}
                                    style={{
                                        padding: '0.6rem 1.2rem', background: 'transparent', color: '#dc2626',
                                        border: '1px solid #dc2626', borderRadius: '4px', cursor: 'pointer',
                                        fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <Trash2 size={16} />
                                    スレッドを削除
                                </button>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => setIsSettingsOpen(false)}
                                        style={{
                                            padding: '0.6rem 1.2rem', background: 'var(--background-secondary)', color: 'var(--text-main)',
                                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500'
                                        }}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={handleSaveSettings}
                                        style={{
                                            padding: '0.6rem 1.2rem', background: 'var(--primary)', color: 'white',
                                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500'
                                        }}
                                    >
                                        保存する
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                errorModal && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            background: 'white', padding: '2rem', borderRadius: '1rem',
                            maxWidth: '400px', width: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '50%', color: '#dc2626' }}>
                                    <AlertTriangle size={32} />
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
                                エラー
                            </h3>
                            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                {errorModal}
                            </p>
                            <button
                                onClick={() => setErrorModal(null)}
                                style={{
                                    background: '#dc2626', color: 'white', padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                                    width: '100%'
                                }}
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                )
            }

            <NoteOverlay
                isOpen={isNoteOpen}
                onClose={() => setIsNoteOpen(false)}
                threadId={threadId}
            />
        </div >
    );
}
