
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
    startThread: (title: string, reason: string, isPrivate?: boolean, participantIds?: string[], initialStatus?: 'pending' | 'approved') => Promise<void>;
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
        const userId = get().currentUserId;

        // 1. Update thread privacy
        const { error: threadError } = await supabase
            .from('threads')
            .update({ is_private: isPrivate })
            .eq('id', threadId);

        if (threadError) throw threadError;

        // 2. Manage participants
        if (isPrivate) {
            // A. Add/Update provided participants
            if (participantIds.length > 0) {
                const participantsData = participantIds.map(uid => ({
                    thread_id: threadId,
                    user_id: uid,
                    last_read_at: new Date().toISOString()
                }));
                const { error: upsertError } = await supabase
                    .from('thread_participants')
                    .upsert(participantsData, { onConflict: 'thread_id,user_id', ignoreDuplicates: true });

                if (upsertError) throw upsertError;
            }

            // B. Remove participants NOT in the list
            // If list is empty, delete all. If list has items, delete those not in list.
            let query = supabase
                .from('thread_participants')
                .delete()
                .eq('thread_id', threadId);

            if (participantIds.length > 0) {
                // Use .filter for explicit not.in
                // Format for 'in' filter is (val1,val2)
                const inList = `(${participantIds.join(',')})`;
                query = query.filter('user_id', 'not.in', inList);
            }
            // If participantIds is empty, we just delete all for this thread (except maybe we want to keep owner? 
            // but the inputs should usually include the owner if the UI is correct. 
            // If UI doesn't allow unchecking owner, we are safe. 
            // If owner unchecks themselves, they lose access. That's on them, or RLS might block it.)

            const { error: deleteError } = await query;
            if (deleteError) throw deleteError;
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
