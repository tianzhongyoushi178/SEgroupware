import { create } from 'zustand';
import { Notice } from '@/types/notice';
import { supabase } from '@/lib/supabase';

interface NoticeState {
    notices: Notice[];
    isLoading: boolean;
    error: string | null;
    subscribeNotices: () => () => void;
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
    markAsRead: (id: string) => void;
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
            const mappedNotices = (data || []).map(n => ({
                ...n,
                createdAt: n.created_at // Map snake_case from DB to camelCase
            }));

            set({ notices: mergeWithLocalReadStatus(mappedNotices), isLoading: false });
        };

        fetchNotices();

        // Realtime Subscription
        const channel = supabase
            .channel('public:notices')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notices' },
                () => {
                    // Re-fetch on any change to keep it simple and consistent
                    fetchNotices();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    addNotice: async (notice) => {
        // Optimistic update could go here, but for now we rely on realtime feedback
        const { error } = await supabase
            .from('notices')
            .insert({
                title: notice.title,
                content: notice.content,
                category: notice.category,
                author: notice.author,
                // created_at is handled by default gen
            });

        if (error) {
            console.error('Error adding notice:', error);
            throw error;
        }
    },

    markAsRead: (id) => {
        set((state) => {
            // Update local state
            const updated = state.notices.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
            );

            // Persist read status locally
            if (typeof window !== 'undefined') {
                const readIds = JSON.parse(localStorage.getItem('read_notices') || '[]');
                if (!readIds.includes(id)) {
                    readIds.push(id);
                    localStorage.setItem('read_notices', JSON.stringify(readIds));
                }
            }

            return { notices: updated };
        });
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
