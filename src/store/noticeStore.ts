import { create } from 'zustand';
import { Notice } from '@/types/notice';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './authStore';

interface NoticeState {
    notices: Notice[];
    isLoading: boolean;
    error: string | null;
    fetchNotices: () => Promise<void>;
    subscribeNotices: () => () => void;
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'isRead' | 'readStatus'>) => Promise<void>;
    updateNotice: (id: string, updates: Partial<Notice>) => Promise<void>;
    markAsRead: (id: string, userId: string) => Promise<void>;
    deleteNotice: (id: string) => Promise<void>;
}

export const useNoticeStore = create<NoticeState>((set, get) => ({
    notices: [],
    isLoading: false,
    error: null,

    fetchNotices: async () => {
        const { data, error } = await supabase
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notices:', JSON.stringify(error, null, 2));
            set({ error: error.message, isLoading: false });
            return;
        }

        // Map DB fields to Frontend types
        const mappedNotices = (data || []).map(n => ({
            ...n,
            createdAt: n.created_at,
            readStatus: n.read_status || {},
            readStatusVisibleTo: n.read_status_visible_to || 'all',
            startDate: n.start_date,
            endDate: n.end_date,
            targetAudience: n.target_audience || ['all'],
            // isRead is calculated in component based on user context
            authorId: n.author_id // Ensure authorId is mapped
        }));

        // Filter based on user role (Client-side filtering for simplicity)
        // Ideally RLS or query filter
        /*
        const { user, profile } = useAuthStore.getState();
        const filteredNotices = mappedNotices.filter(n => {
            if (n.targetAudience?.includes('all')) return true;
            if (profile?.role === 'admin' && n.targetAudience?.includes('admin')) return true;
            // Add more specific user checks if needed
            return false;
        });
        */
        // For now, let's keep all in store and filter in UI selector if needed OR strictly filter here.
        // It's safer to filter here so components don't need to know.
        // Accessing other store inside store action:
        const { user, profile } = useAuthStore.getState();
        const isAdmin = profile?.role === 'admin';

        const filteredNotices = mappedNotices.filter(n => {
            const audience = n.targetAudience || ['all'];
            if (audience.includes('all')) return true;
            if (audience.includes('admin') && isAdmin) return true;
            // Creator can always see
            if (user && n.authorId === user.id) return true;
            return false;
        });

        set({ notices: filteredNotices, isLoading: false });
    },

    subscribeNotices: () => {
        set({ isLoading: true });

        // Initial Fetch
        get().fetchNotices();

        // Realtime Subscription
        const channel = supabase
            .channel('public:notices')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notices' },
                () => {
                    get().fetchNotices();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    addNotice: async (notice) => {
        const { error } = await supabase
            .from('notices')
            .insert({
                title: notice.title,
                content: notice.content,
                category: notice.category,
                author: notice.author,
                author_id: notice.authorId,
                read_status: {}, // Initialize empty
                read_status_visible_to: notice.readStatusVisibleTo || 'all',
                read_status_visible_to: notice.readStatusVisibleTo || 'all',
                start_date: notice.startDate,
                end_date: notice.endDate,
                target_audience: notice.targetAudience || ['all']
            });

        if (error) {
            console.error('Error adding notice:', error);
            throw error;
        }
    },

    updateNotice: async (id, updates) => {
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.readStatusVisibleTo !== undefined) dbUpdates.read_status_visible_to = updates.readStatusVisibleTo;
        if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
        if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
        if (updates.targetAudience !== undefined) dbUpdates.target_audience = updates.targetAudience;

        const { error } = await supabase
            .from('notices')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating notice:', error);
            throw error;
        }
    },

    markAsRead: async (id, userId) => {
        // optimistically update local
        set((state) => {
            const updated = state.notices.map((n) => {
                if (n.id === id) {
                    const newStatus = { ...n.readStatus, [userId]: new Date().toISOString() };
                    return { ...n, readStatus: newStatus, isRead: true };
                }
                return n;
            });
            return { notices: updated };
        });

        // 1. Fetch current to ensure we don't overwrite others (race condition possible but low traffic)
        const { data: current } = await supabase.from('notices').select('read_status').eq('id', id).single();
        const currentStatus = current?.read_status || {};

        const newStatus = { ...currentStatus, [userId]: new Date().toISOString() };

        const { error } = await supabase
            .from('notices')
            .update({ read_status: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Error marking as read:', error);
        }
    },

    deleteNotice: async (id) => {
        const { error } = await supabase
            .from('notices')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting notice:', error);
            throw error;
        }
    },
}));
