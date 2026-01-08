
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications';

export interface ChatThread {
    id: string;
    title: string;
    request_reason: string;
    status: 'pending' | 'approved' | 'rejected';
    created_by: string;
    created_at: string;
    unreadCount?: number;
    last_message_at?: string;
    is_private?: boolean;
}

export interface ChatMessage {
    id: string;
    content: string;
    thread_id: string;
    author_id: string;
    author_name: string;
    created_at: string;
    attachment_url?: string;
    attachment_type?: string;
    attachment_name?: string;
    is_deleted?: boolean;
}

interface ChatState {
    threads: ChatThread[];
    messages: Record<string, ChatMessage[]>; // Keyed by threadId
    isLoading: boolean;
    error: string | null;
    currentUserId: string | null;

    initialize: (userId: string) => void;
    fetchThreads: () => Promise<void>;
    startThread: (title: string, reason: string, isPrivate?: boolean, participantIds?: string[], initialStatus?: 'pending' | 'approved') => Promise<void>;
    updateThreadStatus: (threadId: string, status: 'approved' | 'rejected') => Promise<void>;

    fetchMessages: (threadId: string) => Promise<void>;
    sendMessage: (threadId: string, content: string, authorName: string, file?: File) => Promise<void>;
    deleteMessage: (threadId: string, messageId: string) => Promise<void>;

    markThreadAsRead: (threadId: string) => Promise<void>;
    updateThreadSettings: (threadId: string, isPrivate: boolean, participantIds: string[]) => Promise<void>;
    deleteThread: (threadId: string) => Promise<void>;

    // For notifications
    subscribeToAll: () => () => void;
    fetchThreadParticipants: (threadId: string) => Promise<string[]>;
}

export const useChatStore = create<ChatState>((set, get) => ({
    threads: [],
    messages: {},
    isLoading: false,
    error: null,
    currentUserId: null,

    initialize: (userId) => {
        set({ currentUserId: userId });
        get().fetchThreads();
    },

    fetchThreads: async () => {
        set({ isLoading: true });

        const userId = get().currentUserId;

        // 1. Fetch threads
        const { data: threadsData, error: threadsError } = await supabase
            .from('threads')
            .select('*')
            .order('last_message_at', { ascending: false, nullsFirst: false }) // Sort by latest message
            .order('last_message_at', { ascending: false }) // Sort by latest activity
            .order('created_at', { ascending: false });

        if (threadsError) {
            console.error('Error fetching threads', threadsError);
            set({ error: threadsError.message, isLoading: false });
            return;
        }

        let threads = threadsData as ChatThread[];

        // 2. Fetch user's read status for these threads
        if (userId && threads.length > 0) {
            const { data: participants } = await supabase
                .from('thread_participants')
                .select('thread_id, last_read_at')
                .eq('user_id', userId);

            const readMap = new Map<string, string>();
            participants?.forEach(p => {
                readMap.set(p.thread_id, p.last_read_at);
            });

            // 3. Calculate unread
            threads = threads.map(thread => {
                const lastRead = readMap.get(thread.id);
                const lastMessage = thread.last_message_at;

                // If no last_message_at, no unread.
                // If I haven't read (no record), and there is a message, it's unread? 
                //   Or if I was added recently?
                //   Let's assume: if record exists, compare. If no record, strictly "unread" if messages exist?
                //   Usually "startThread" adds the creator. "updateThreadSettings" adds participants.
                //   So record should exist for valid participants.

                let isUnread = false;
                if (lastMessage) {
                    if (!lastRead) {
                        isUnread = true; // Never read
                    } else {
                        isUnread = new Date(lastMessage) > new Date(lastRead);
                    }
                }

                return {
                    ...thread,
                    unreadCount: isUnread ? 1 : 0 // Simply binary for now
                };
            });
        }

        set({ threads, isLoading: false });
    },

    startThread: async (title, reason, isPrivate = false, participantIds: string[] = [], initialStatus = 'pending') => {
        const userId = get().currentUserId;
        if (!userId) return;

        // 1. Create Thread
        const { data: threadData, error: threadError } = await supabase
            .from('threads')
            .insert({
                title,
                request_reason: reason,
                status: initialStatus,
                created_by: userId,
                is_private: isPrivate
            })
            .select()
            .single();

        if (threadError) throw threadError;

        // 2. Add Participants if private
        if (isPrivate && participantIds.length > 0 && threadData) {
            const participantsData = participantIds.map(uid => ({
                thread_id: threadData.id,
                user_id: uid,
                last_read_at: new Date().toISOString()
            }));

            // Also add creator explicitly to be safe? 
            // Usually creator can see via 'created_by' logic, but adding to participants table 
            // is good for consistency if the policy relies on it. 
            // Let's add creator if not in list.
            if (!participantIds.includes(userId)) {
                participantsData.push({
                    thread_id: threadData.id,
                    user_id: userId,
                    last_read_at: new Date().toISOString()
                });
            }

            const { error: partError } = await supabase
                .from('thread_participants')
                .insert(participantsData);

            if (partError) {
                console.error('Error adding participants on create:', partError);
                // Optionally delete thread if participant addition fails? 
                // For now just log it.
            }
        }

        get().fetchThreads();
    },

    updateThreadStatus: async (threadId, status) => {
        const { error } = await supabase
            .from('threads')
            .update({ status })
            .eq('id', threadId);

        if (error) throw error;
        get().fetchThreads();
    },

    fetchMessages: async (threadId) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error(error);
            return;
        }

        set(state => ({
            messages: { ...state.messages, [threadId]: data as ChatMessage[] }
        }));
    },

    sendMessage: async (threadId, content, authorName, file) => {
        const userId = get().currentUserId;
        if (!userId) return;

        let attachment_url = null;
        let attachment_type = null;
        let attachment_name = null;

        // 1. Upload File if exists
        if (file) {
            // ... (upload logic remains same) ...
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${threadId}/${userId}/${fileName}`;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', filePath);

            const uploadRes = await fetch('/api/chat/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json();
                throw new Error(errData.error || 'Upload failed');
            }

            const { publicUrl } = await uploadRes.json();

            attachment_url = publicUrl;
            attachment_type = file.type;
            attachment_name = file.name;
        }

        // 2. Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const tempMessage: ChatMessage = {
            id: tempId,
            content,
            thread_id: threadId,
            author_id: userId,
            author_name: authorName,
            created_at: new Date().toISOString(),
            attachment_url: attachment_url || undefined,
            attachment_type: attachment_type || undefined,
            attachment_name: attachment_name || undefined
        };

        set(state => ({
            messages: {
                ...state.messages,
                [threadId]: [...(state.messages[threadId] || []), tempMessage]
            }
        }));

        // 3. DB Insert
        const { data, error } = await supabase
            .from('messages')
            .insert({
                thread_id: threadId,
                content,
                author_id: userId,
                author_name: authorName,
                attachment_url,
                attachment_type,
                attachment_name
            })
            .select()
            .single();

        if (error) {
            // Revert optimistic update on error
            set(state => ({
                messages: {
                    ...state.messages,
                    [threadId]: state.messages[threadId].filter(m => m.id !== tempId)
                }
            }));
            throw error;
        }

        // 4. Update Id with real DB ID
        set(state => ({
            messages: {
                ...state.messages,
                [threadId]: state.messages[threadId].map(m =>
                    m.id === tempId ? data : m
                )
            }
        }));

        // Auto-mark as read for the sender
        await get().markThreadAsRead(threadId);
    },

    deleteMessage: async (threadId, messageId) => {
        // Optimistic update
        set(state => ({
            messages: {
                ...state.messages,
                [threadId]: (state.messages[threadId] || []).map(m =>
                    m.id === messageId ? { ...m, is_deleted: true } : m
                )
            }
        }));

        const { data, error } = await supabase
            .from('messages')
            .update({ is_deleted: true })
            .eq('id', messageId)
            .select();

        if (error) {
            // Revert on error (fetch fresh to be safe)
            console.error('Delete failed, reverting', error);
            get().fetchMessages(threadId);
            throw error;
        }
        if (!data || data.length === 0) {
            // Also revert if no data (permission denied etc)
            get().fetchMessages(threadId);
            throw new Error('メッセージが見つからないか、削除権限がありません。');
        }
    },

    markThreadAsRead: async (threadId) => {
        const userId = get().currentUserId;
        if (!userId) return;

        const { error } = await supabase
            .from('thread_participants')
            .upsert({
                thread_id: threadId,
                user_id: userId,
                last_read_at: new Date().toISOString()
            }, { onConflict: 'thread_id,user_id' });

        if (error) console.error('Error marking as read', error);

        // Update local state
        set(state => ({
            threads: state.threads.map(t =>
                t.id === threadId ? { ...t, unreadCount: 0 } : t
            )
        }));
    },

    updateThreadSettings: async (threadId, isPrivate, participantIds) => {
        const userId = get().currentUserId;
        // 1. Update thread privacy
        const { error: threadError } = await supabase
            .from('threads')
            .update({ is_private: isPrivate })
            .eq('id', threadId);

        if (threadError) throw threadError;

        // 2. Update participants
        if (isPrivate) {
            // Fetch existing to know what to add/remove
            const { data: existing } = await supabase
                .from('thread_participants')
                .select('user_id')
                .eq('thread_id', threadId);

            const existingIds = existing?.map(e => e.user_id) || [];

            // IDs to add
            const toAdd = participantIds.filter(id => !existingIds.includes(id));
            if (toAdd.length > 0) {
                await supabase.from('thread_participants').insert(
                    toAdd.map(uid => ({
                        thread_id: threadId,
                        user_id: uid,
                        last_read_at: new Date().toISOString()
                    }))
                );
            }

            // IDs to remove (exclude current user to prevent locking oneself out)
            const toRemove = existingIds.filter(id => !participantIds.includes(id) && id !== userId);
            if (toRemove.length > 0) {
                await supabase
                    .from('thread_participants')
                    .delete()
                    .eq('thread_id', threadId)
                    .in('user_id', toRemove);
            }
        }

        get().fetchThreads();
    },

    deleteThread: async (threadId) => {
        const { error } = await supabase
            .from('threads')
            .delete()
            .eq('id', threadId);

        if (error) throw error;

        set(state => ({
            threads: state.threads.filter(t => t.id !== threadId),
            messages: { ...state.messages, [threadId]: [] }
        }));
    },

    fetchThreadParticipants: async (threadId) => {
        const { data, error } = await supabase
            .from('thread_participants')
            .select('user_id')
            .eq('thread_id', threadId);

        if (error) {
            console.error(error);
            return [];
        }
        return data.map(d => d.user_id);
    },

    subscribeToAll: () => {
        // Subscribe to Threads
        const threadSub = supabase
            .channel('public:threads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, () => {
                get().fetchThreads();
            })
            .subscribe();

        // Subscribe to Messages
        const messageSub = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
                const userId = get().currentUserId;

                if (payload.eventType === 'INSERT') {
                    const newMsg = payload.new as ChatMessage;

                    // Avoid duplicate if it's my own message (already optimistically added)
                    // We check if we have a temp message or the real message already
                    const currentMessages = get().messages[newMsg.thread_id];
                    if (currentMessages) {
                        const exists = currentMessages.some(m => m.id === newMsg.id);
                        if (!exists) {
                            set(state => ({
                                messages: {
                                    ...state.messages,
                                    [newMsg.thread_id]: [...(state.messages[newMsg.thread_id] || []), newMsg]
                                }
                            }));
                        }
                    }

                    // Notification Logic
                    if (userId && newMsg.author_id !== userId) {
                        sendNotification(`New message from ${newMsg.author_name}`, newMsg.content, `/chat/${newMsg.thread_id}`);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updatedMsg = payload.new as ChatMessage;
                    set(state => {
                        const threadMessages = state.messages[updatedMsg.thread_id];
                        if (!threadMessages) return state;
                        return {
                            messages: {
                                ...state.messages,
                                [updatedMsg.thread_id]: threadMessages.map(m =>
                                    m.id === updatedMsg.id ? updatedMsg : m
                                )
                            }
                        };
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(threadSub);
            supabase.removeChannel(messageSub);
        };
    }
}));
