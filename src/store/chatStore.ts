
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications';
import { useSettingsStore } from './settingsStore';

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
    last_read_at?: string; // Added for "Unread Starts Here" feature
    pinned_message_id?: string | null;
    pinned_by?: string | null; // Added: Who pinned the message
    last_message_content?: string;
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
    reactions?: Record<string, string[]>; // { stamp_id: [user_id, ...] }
}

export interface SearchResult extends ChatMessage {
    thread?: ChatThread;
}

export interface Note {
    id: string;
    thread_id: string;
    author_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    images?: string[];
    attachments?: { name: string, type: string, url: string }[];
    author?: { display_name: string | null; email: string | null };
}

interface ChatState {
    threads: ChatThread[];
    messages: Record<string, ChatMessage[]>; // Keyed by threadId
    isLoading: boolean;
    error: string | null;
    currentUserId: string | null;

    // Search
    searchQuery: string;
    searchResults: SearchResult[];
    isSearching: boolean;
    setSearchQuery: (query: string) => void;
    searchMessages: (query: string) => Promise<void>;

    initialize: (userId: string) => void;
    fetchThreads: (query?: string) => Promise<void>;
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

    // Notes
    notes: Record<string, Note[]>;
    fetchNotes: (threadId: string) => Promise<void>;
    addNote: (threadId: string, content: string, attachments?: File[]) => Promise<void>;
    deleteNote: (threadId: string, noteId: string) => Promise<void>;

    // Pinned Messages (Announcements)
    pinMessage: (threadId: string, messageId: string) => Promise<void>;
    unpinMessage: (threadId: string) => Promise<void>;

    // Reactions
    addReaction: (threadId: string, messageId: string, stampId: string) => Promise<void>;
    removeReaction: (threadId: string, messageId: string, stampId: string) => Promise<void>;

    // Drafts
    drafts: Record<string, string>;
    setDraft: (threadId: string, draft: string) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            threads: [],
            messages: {},
            notes: {},
            drafts: {}, // Initialize drafts
            isLoading: false,
            error: null,
            currentUserId: null,

            // Search
            searchQuery: '',
            searchResults: [],
            isSearching: false,
            setSearchQuery: (query) => set({ searchQuery: query }),

            setDraft: (threadId, draft) =>
                set(state => ({ drafts: { ...state.drafts, [threadId]: draft } })),

            initialize: (userId) => {
                set({ currentUserId: userId });
                get().fetchThreads();
            },

            fetchThreads: async (query?: string) => {
                set({ isLoading: true });

                const userId = get().currentUserId;

                // 0. If query exists, look up thread IDs that contain matching messages
                let matchedThreadIds: string[] = [];
                if (query) {
                    const { data: messages } = await supabase
                        .from('messages')
                        .select('thread_id')
                        .ilike('content', `%${query}%`);

                    if (messages) {
                        matchedThreadIds = Array.from(new Set(messages.map(m => m.thread_id)));
                    }
                }

                // 1. Fetch threads
                let threadQuery = supabase
                    .from('threads')
                    .select('*')
                    .order('last_message_at', { ascending: false, nullsFirst: false }) // Sort by latest message
                    .order('created_at', { ascending: false });

                if (query) {
                    const orConditions = [
                        `title.ilike.%${query}%`,
                        `request_reason.ilike.%${query}%`,
                        `last_message_content.ilike.%${query}%`
                    ];
                    // If we found messages matching the query, include those threads too
                    if (matchedThreadIds.length > 0) {
                        orConditions.push(`id.in.(${matchedThreadIds.join(',')})`);
                    }
                    threadQuery = threadQuery.or(orConditions.join(','));
                }

                const { data: threadsData, error: threadsError } = await threadQuery;

                if (threadsError) {
                    console.error('Error fetching threads:', threadsError);
                    set({ isLoading: false });
                    return;
                }

                // 2. Fetch unread counts
                // To do this efficiently, we can fetch last_read for all threads for current user
                // Or we can rely on real-time updates and fetch individually?
                // Let's fetch all threads first, then we can fetch unread counts in a separate effect or query?
                // For now, let's keep it simple and just set threads. 
                // We will improve unread count logic later or if needed.
                // Actually, we need unread counts for the UI.

                // Let's fetch `thread_participants` for current user to get `last_read_at`
                const { data: participantData, error: participantError } = await supabase
                    .from('thread_participants')
                    .select('thread_id, last_read_at')
                    .eq('user_id', userId);

                if (participantError) {
                    console.error('Error fetching participant info', participantError);
                }

                const participantMap = new Map();
                participantData?.forEach(p => {
                    participantMap.set(p.thread_id, p.last_read_at);
                });

                // 3. For each thread, we ideally want to count messages > last_read_at
                // This is expensive to do for ALL threads at once if we have many.
                // A better approach often used is:
                // - Fetch threads
                // - Fetch unread counts via a specific RPC or view.
                // - Or client-side count if we have messages loaded (we don't for all threads).
                // For now, let's just initialize unreadCount to 0 or something simple, 
                // OR fetch counts for top N threads?
                // Let's implement a simple "unread" indicator based on `last_message_at > last_read_at`.
                // Accurate count requires query.

                // Let's execute a count query for each thread... that's N queries. Bad.
                // Alternative: creating a view or function in Supabase.
                // For V1, let's just stick to "Unread if last_message_at > last_read_at" boolean logic in UI?
                // But UI expects a number.
                // Let's try to get a count for all threads where user is participant.

                // For now, let's just Map last_read_at to the thread object.
                const threads = (threadsData as ChatThread[]).map(t => {
                    const lastRead = participantMap.get(t.id);
                    // approximate unread: if last_message_at > lastRead, set to 1 (indicator). 0 otherwise.
                    // Check dates
                    let unread = 0;
                    if (t.last_message_at && lastRead && new Date(t.last_message_at) > new Date(lastRead)) {
                        unread = 1;
                    } else if (t.last_message_at && !lastRead) {
                        unread = 1; // Never read
                    }

                    return {
                        ...t,
                        last_read_at: lastRead,
                        unreadCount: unread // boolean-ish
                    };
                });

                set({ threads, isLoading: false });
            },

            searchMessages: async (query: string) => {
                if (!query.trim()) {
                    set({ searchResults: [], isSearching: false });
                    return;
                }

                set({ isSearching: true });
                const userId = get().currentUserId;

                try {
                    // search messages
                    const { data: messages, error } = await supabase
                        .from('messages')
                        .select('*, threads(*)') // Join threads to get metadata
                        .ilike('content', `%${query}%`)
                        .order('created_at', { ascending: false });

                    if (error) throw error;

                    const results = (messages as any[]).map(m => ({
                        ...m,
                        thread: m.threads // Supabase join result
                    })) as SearchResult[];

                    // Filter out private threads user is not part of if RLS doesn't handle it perfectly 
                    // (Note: RLS should handle it, but sometimes joins are tricky. 
                    // However, messages table RLS usually checks thread participation.)

                    set({ searchResults: results, isSearching: false });
                } catch (e) {
                    console.error('Search error:', e);
                    set({ searchResults: [], isSearching: false });
                }
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
                        is_private: isPrivate,
                        last_message_at: new Date().toISOString()
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

                // Update thread's last_message_at and last_message_content
                const { error: updateThreadError } = await supabase
                    .from('threads')
                    .update({
                        last_message_at: new Date().toISOString(),
                        last_message_content: content
                    })
                    .eq('id', threadId);

                if (updateThreadError) {
                    console.error('Failed to update thread metadata', updateThreadError);
                }

                // Clear draft
                get().setDraft(threadId, '');
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

                // Use API to bypass RLS
                const { error } = await supabase
                    .functions.invoke('dummy', { body: {} }); // Just to keep type check happy if needed, but we use fetch

                // Call the API route
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        await fetch('/api/chat/read', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({ threadId })
                        });
                    }
                } catch (e) {
                    console.error('Error calling mark read API', e);
                }

                // Update local state
                set(state => ({
                    threads: state.threads.map(t =>
                        t.id === threadId ? { ...t, unreadCount: 0, last_read_at: new Date().toISOString() } : t
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
                                const { notifications } = useSettingsStore.getState();
                                if (notifications.desktop && (notifications.chat ?? true)) {
                                    sendNotification(`New message from ${newMsg.author_name}`, newMsg.content, `/chat/${newMsg.thread_id}`);
                                }
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
            },

            fetchNotes: async (threadId) => {
                // Assuming public.users is linked to auth.users via triggers or similar, 
                // OR we just select author_id and map later. 
                // For now, let's try to select author details if possible, otherwise just IDs.
                // Given existing code uses 'author_name' on messages, let's try to join if relations exist.
                // If simply selecting *, we get author_id.
                // We'll try to fetch author details via FK if we configured it, but standard Supabase auth doesn't expose users table easily unless public.
                // Let's assume we can fetch profiles or users. 
                // Actually, let's just fetch notes and we'll use useUserStore to map names in UI if needed, 
                // OR simpler: just fetch and see.

                const { data, error } = await supabase
                    .from('thread_notes')
                    .select('*')
                    .eq('thread_id', threadId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching notes:', error);
                    return;
                }

                // We might need to fetch author info manually if not joined
                const notes = data as Note[];

                // Fetch authors manually for now to be safe
                const authorIds = Array.from(new Set(notes.map(n => n.author_id)));
                if (authorIds.length > 0) {
                    // We can't access auth.users directly. 
                    // But usually there is a public_users or similar view. 
                    // Let's assume we rely on 'users' table if it exists? 
                    // Previous code used useUserStore.users. 
                    // Let's leave author undefined and handle in UI by mapping ID to name using UserStore.
                }

                set(state => ({
                    notes: { ...state.notes, [threadId]: notes }
                }));
            },

            addNote: async (threadId, content, files = []) => {
                const userId = get().currentUserId;
                if (!userId) return;

                const attachments: { name: string, type: string, url: string }[] = [];

                // Upload files if any
                for (const file of files) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                    const filePath = `${threadId}/${userId}/notes/${fileName}`;

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('path', filePath);

                    try {
                        const uploadRes = await fetch('/api/chat/upload', {
                            method: 'POST',
                            body: formData
                        });

                        if (uploadRes.ok) {
                            const { publicUrl } = await uploadRes.json();
                            attachments.push({
                                name: file.name,
                                type: file.type,
                                url: publicUrl
                            });
                        } else {
                            console.error('Failed to upload attachment', await uploadRes.text());
                        }
                    } catch (e) {
                        console.error('Upload error', e);
                    }
                }

                const { error } = await supabase
                    .from('thread_notes')
                    .insert({
                        thread_id: threadId,
                        author_id: userId,
                        content,
                        attachments
                    });

                if (error) throw error;
                get().fetchNotes(threadId);
            },

            deleteNote: async (threadId, noteId) => {
                const { error } = await supabase
                    .from('thread_notes')
                    .delete()
                    .eq('id', noteId);

                if (error) throw error;
                get().fetchNotes(threadId);
            },

            pinMessage: async (threadId, messageId) => {
                const userId = get().currentUserId;
                const { error } = await supabase
                    .from('threads')
                    .update({
                        pinned_message_id: messageId,
                        pinned_by: userId // Record who pinned it
                    })
                    .eq('id', threadId);

                if (error) {
                    console.error('Failed to pin message', error);
                    throw error;
                }

                // Optimistic update
                set(state => ({
                    threads: state.threads.map(t =>
                        t.id === threadId ? { ...t, pinned_message_id: messageId, pinned_by: userId } : t
                    )
                }));
            },

            unpinMessage: async (threadId) => {
                const { error } = await supabase
                    .from('threads')
                    .update({
                        pinned_message_id: null,
                        pinned_by: null
                    })
                    .eq('id', threadId);

                if (error) {
                    console.error('Failed to unpin message', error);
                    throw error;
                }

                // Optimistic update
                set(state => ({
                    threads: state.threads.map(t =>
                        t.id === threadId ? { ...t, pinned_message_id: undefined, pinned_by: undefined } : t
                    )
                }));
            },

            addReaction: async (threadId, messageId, stampId) => {
                const userId = get().currentUserId;
                if (!userId) return;

                const message = get().messages[threadId]?.find(m => m.id === messageId);
                if (!message) return;

                const currentReactions = message.reactions || {};
                const currentUsers = currentReactions[stampId] || [];

                if (currentUsers.includes(userId)) return; // Already reacted

                const newReactions = {
                    ...currentReactions,
                    [stampId]: [...currentUsers, userId]
                };

                // Optimistic Update
                set(state => ({
                    messages: {
                        ...state.messages,
                        [threadId]: state.messages[threadId].map(m =>
                            m.id === messageId ? { ...m, reactions: newReactions } : m
                        )
                    }
                }));

                const { error } = await supabase
                    .from('messages')
                    .update({ reactions: newReactions })
                    .eq('id', messageId);

                if (error) {
                    console.error('Failed to add reaction', error);
                    // Revert
                    get().fetchMessages(threadId);
                }
            },

            removeReaction: async (threadId, messageId, stampId) => {
                const userId = get().currentUserId;
                if (!userId) return;

                const message = get().messages[threadId]?.find(m => m.id === messageId);
                if (!message) return;

                const currentReactions = message.reactions || {};
                const currentUsers = currentReactions[stampId] || [];

                if (!currentUsers.includes(userId)) return; // Not reacted

                const newReactions = {
                    ...currentReactions,
                    [stampId]: currentUsers.filter(uid => uid !== userId)
                };

                // If empty, maybe remove key? Optional.
                if (newReactions[stampId].length === 0) {
                    delete newReactions[stampId];
                }

                // Optimistic Update
                set(state => ({
                    messages: {
                        ...state.messages,
                        [threadId]: state.messages[threadId].map(m =>
                            m.id === messageId ? { ...m, reactions: newReactions } : m
                        )
                    }
                }));

                const { error } = await supabase
                    .from('messages')
                    .update({ reactions: newReactions })
                    .eq('id', messageId);

                if (error) {
                    console.error('Failed to remove reaction', error);
                    get().fetchMessages(threadId);
                }
            }
        }),
        {
            name: 'chat-storage',
            partialize: (state) => ({ drafts: state.drafts }),
        }
    )
);
