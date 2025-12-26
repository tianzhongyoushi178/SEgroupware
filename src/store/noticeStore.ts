import { create } from 'zustand';
import { Notice } from '@/types/notice';
import { supabase } from '@/lib/supabase';

interface NoticeState {
    notices: Notice[];
    isLoading: boolean;
    error: string | null;
    subscribeNotices: () => () => void;
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'isRead' | 'readStatus'>) => Promise<void>;
    markAsRead: (id: string, userId: string) => Promise<void>;
    deleteNotice: (id: string) => Promise<void>;
}

export const useNoticeStore = create<NoticeState>((set, get) => ({
    notices: [],
    isLoading: false,
    error: null,

    subscribeNotices: () => {
        set({ isLoading: true });

        // Helper to merge server data with local read status
        const mergeWithLocalReadStatus = (serverNotices: any[]) => {
            if (typeof window === 'undefined') return serverNotices;

            const readIds = JSON.parse(localStorage.getItem('read_notices') || '[]');
            return serverNotices.map(notice => ({
                ...notice,
                isRead: readIds.includes(notice.id)
            }));
        };

        // Initial Fetch
        const fetchNotices = async () => {
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notices:', error);
                set({ error: error.message, isLoading: false });
                return;
            }

            // Map DB fields to Frontend types if necessary (snake_case to camelCase)
            // Assuming DB columns match or we map them: created_at -> createdAt
            // Map DB fields to Frontend types
            const mappedNotices = (data || []).map(n => ({
                ...n,
                createdAt: n.created_at,
                readStatus: n.read_status || {},
                readStatusVisibleTo: n.read_status_visible_to || 'all'
            }));

            // Calculate isRead based on server data (or local fallback if needed, but server is truth)
            // But we need the current user's ID to check if *they* read it.
            // Since we don't have user ID in fetchNotices scope easily (unless we useAuthStore.getState()),
            // we will let the component determine `isRead` or we can pass userId to fetchNotices?
            // Actually, let's keep `isRead` as a derived property in the Component or computed here if we can.
            // For now, let's map it raw and let component derive `isRead` from `readStatus[userId]`.
            // But to keep compatibility with existing code that uses `isRead`, we might need to rely on the component using `readStatus`.
            // OR we fetch current user here?
            // Easier: just map the data and let the UI handle `isRead` check using `user.id`.
            // Removing `mergeWithLocalReadStatus` logic effectively as we move to server side.

            set({ notices: mappedNotices, isLoading: false });
        };

        fetchNotices();

        // Realtime Subscription
        const channel = supabase
            .channel('public:notices')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notices' },
                () => {
                    fetchNotices();
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
                read_status: {}, // Initialize empty
                read_status_visible_to: notice.readStatusVisibleTo || 'all'
            });

        if (error) {
            console.error('Error adding notice:', error);
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
        // Ideally use a stored procedure or jsonb_set, but simple fetch-modify-save is okay for MVP
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
