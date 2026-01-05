
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
}

export interface ChatMessage {
    id: string;
    content: string;
    thread_id: string;
    author_id: string;
    author_name: string;
    created_at: string;
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
    sendMessage: (threadId: string, content: string, authorName: string) => Promise<void>;

    markThreadAsRead: (threadId: string) => Promise<void>;

    // For notifications
    subscribeToAll: () => () => void;
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

    sendMessage: async (threadId, content, authorName) => {
        const userId = get().currentUserId;
        if (!userId) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                thread_id: threadId,
                content,
                author_id: userId,
                author_name: authorName
            });

        if (error) throw error;
        // Optimistic update or wait for subscription
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
