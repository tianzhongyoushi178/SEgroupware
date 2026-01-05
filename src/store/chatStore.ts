
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
}

interface ChatState {
    threads: ChatThread[];
    messages: Record<string, ChatMessage[]>; // Keyed by threadId
    isLoading: boolean;
    error: string | null;
    currentUserId: string | null;

    initialize: (userId: string) => void;
    fetchThreads: () => Promise<void>;
    startThread: (title: string, reason: string, initialStatus?: 'pending' | 'approved') => Promise<void>;
    updateThreadStatus: (threadId: string, status: 'approved' | 'rejected') => Promise<void>;

    fetchMessages: (threadId: string) => Promise<void>;
    sendMessage: (threadId: string, content: string, authorName: string, file?: File) => Promise<void>;

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
        // Fetch all threads. Policies will filter if needed, but for now fetch all.
        const { data: threads, error } = await supabase
            .from('threads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching threads', error);
            set({ error: error.message, isLoading: false });
            return;
        }

        // Fetch unread status (simplified: fetching participant record)
        const userId = get().currentUserId;
        if (userId) {
            const { data: participants } = await supabase
                .from('thread_participants')
                .select('*')
                .eq('user_id', userId);

            // To calculate unread accurately we need 'last_message_at' on thread or similar.
            // For now, we rely on checking messages logic or we just default unreadCount to 0 until we have a better query.
            // We can implement a separate logic to fetch unread counts if needed.
        }

        set({ threads: threads as ChatThread[], isLoading: false });
    },

    startThread: async (title, reason, initialStatus = 'pending') => {
        const userId = get().currentUserId;
        if (!userId) return;

        const { error } = await supabase
            .from('threads')
            .insert({
                title,
                request_reason: reason,
                status: initialStatus,
                created_by: userId
            });

        if (error) throw error;
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

        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${threadId}/${userId}/${fileName}`;

            const { error: uploadError } = await supabase
                .storage
                .from('chat-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase
                .storage
                .from('chat-attachments')
                .getPublicUrl(filePath);

            attachment_url = publicUrl;
            attachment_type = file.type;
            attachment_name = file.name;
        }

        const { error } = await supabase
            .from('messages')
            .insert({
                thread_id: threadId,
                content,
                author_id: userId,
                author_name: authorName,
                attachment_url,
                attachment_type,
                attachment_name
            });

        if (error) throw error;
    },

    updateThreadSettings: async (threadId: string, isPrivate: boolean, participantIds: string[]) => {
        // 1. Update thread privacy
        const { error: threadError } = await supabase
            .from('threads')
            .update({ is_private: isPrivate })
            .eq('id', threadId);

        if (threadError) throw threadError;

        // 2. Manage participants
        // First, get current participants to avoid duplicates or identify removals if needed
        // For simplicity, we can delete non-selected (except owner) or just upsert all selected.
        // A safer approach for "set participants":
        // simple approach: just insert ignore duplicates? 
        // Better:
        // If isPrivate is true, ensure these users are in thread_participants.

        if (isPrivate && participantIds.length > 0) {
            const participantsData = participantIds.map(uid => ({
                thread_id: threadId,
                user_id: uid,
                last_read_at: new Date().toISOString() // Set initial read time or keep existing?
            }));

            // We use upsert to keep existing last_read_at if exists, but we need to match keys.
            // However, the standard insert might fail if exists. 
            // thread_participants has primary key (thread_id, user_id).
            // Let's use upsert with ignoreDuplicates if we want to preserve read status?
            // Actually, if we just want to GRANT access, we just need them to be in the table.

            const { error: partError } = await supabase
                .from('thread_participants')
                .upsert(participantsData, { onConflict: 'thread_id,user_id', ignoreDuplicates: true });

            if (partError) throw partError;
        }

        // Note: Removing participants who are NOT in the list is also important if we uncheck them.
        // But the requirement says "select display target".
        // If I limit visibility, I should probably remove those who are not selected?
        // Let's implement full sync: remove those not in list (excluding creator/current user if needed).
        // For safely, let's just ADD for now as per common "Invite" pattern, 
        // OR if it's "Settings" it implies "Restriction".
        // "表示対象者を選択できる" -> "Select viewers". Implies Only these users can view.
        // So we should remove others.

        if (isPrivate) {
            // Remove users NOT in participantIds (and not the creator ideally, but creator should be in list or handled by RLS)
            // We can't easily do "delete where user_id not in ..." without a complex query or multiple steps.
            // Given the complexity, let's assume the UI sends the FULL list of desired participants.
            // We will delete all and re-insert? No, that loses read status.
            // We will delete where thread_id = id AND user_id NOT IN (ids).

            if (participantIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('thread_participants')
                    .delete()
                    .eq('thread_id', threadId)
                    .not('user_id', 'in', `(${participantIds.join(',')})`);

                if (deleteError) throw deleteError;
            }
        }
    },

    deleteThread: async (threadId) => {
        const { error } = await supabase
            .from('threads')
            .delete()
            .eq('id', threadId);

        if (error) throw error;
        get().fetchThreads(); // Refresh list to remove deleted thread if viewing list (optional here)
    },

    markThreadAsRead: async (threadId) => {
        const userId = get().currentUserId;
        if (!userId) return;

        const now = new Date().toISOString();
        const { error } = await supabase
            .from('thread_participants')
            .upsert({
                thread_id: threadId,
                user_id: userId,
                last_read_at: now
            }, { onConflict: 'thread_id,user_id' }); // Use the constraint name if known, or just columns

        if (error) console.error(error);

        // Update local state if we tracked unread count
    },

    fetchThreadParticipants: async (threadId: string) => {
        const { data, error } = await supabase
            .from('thread_participants')
            .select('user_id')
            .eq('thread_id', threadId);

        if (error) {
            console.error('Error fetching participants', error);
            return [];
        }
        return data.map(p => p.user_id);
    },

    subscribeToAll: () => {
        // Subscribe to Threads
        const threadSub = supabase
            .channel('public:threads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, () => {
                get().fetchThreads();
            })
            .subscribe();

        // Subscribe to Messages (Global or Per Thread? Global might be noisy but simple for notifications)
        const messageSub = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
                const newMsg = payload.new as ChatMessage;
                const userId = get().currentUserId;

                // Update messages store if we have this thread loaded
                const currentMessages = get().messages[newMsg.thread_id];
                if (currentMessages) {
                    set(state => ({
                        messages: {
                            ...state.messages,
                            [newMsg.thread_id]: [...currentMessages, newMsg]
                        }
                    }));
                }

                // Notification Logic
                // If I am NOT the author, notify me
                if (userId && newMsg.author_id !== userId) {
                    // Ideally check if thread is approved and I am interested? 
                    // For now, notify all messages in threads I can see?
                    // Let's simplified: Notify all new messages for now.
                    sendNotification(`New message from ${newMsg.author_name}`, newMsg.content, `/chat/${newMsg.thread_id}`);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(threadSub);
            supabase.removeChannel(messageSub);
        };
    }
}));
