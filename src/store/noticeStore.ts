import { create } from 'zustand';
import { Notice } from '@/types/notice';
import { supabase } from '@/lib/supabase';

interface NoticeState {
    notices: Notice[];
    isLoading: boolean;
    error: string | null;
    subscribeNotices: () => () => void;
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
    markAsRead: (id: string) => void; // Temporarily local only
    deleteNotice: (id: string) => Promise<void>;
}

export const useNoticeStore = create<NoticeState>((set, get) => ({
    notices: [],
    isLoading: false,
    error: null,
    subscribeNotices: () => {
        set({ isLoading: true });

        const fetchNotices = async () => {
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notices:', error);
                set({ error: 'お知らせの取得に失敗しました', isLoading: false });
                return;
            }

            // Map keys if necessary (snake_case to camelCase)
            // Assuming Supabase returns snake_case columns by default unless configured otherwise
            const notices = (data || []).map((item: any) => ({
                id: item.id,
                title: item.title,
                content: item.content,
                category: item.category,
                createdAt: item.created_at, // Mapping created_at to createdAt
                author: item.author || 'System', // Map author, default to System
                isRead: false // Default
            }));

            set({ notices, isLoading: false });
        };

        fetchNotices();

        // Realtime subscription
        const channel = supabase
            .channel('public:notices')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => {
                fetchNotices(); // Reload on any change for simplicity
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },
    addNotice: async (notice) => {
        try {
            const { error } = await supabase
                .from('notices')
                .insert([{
                    title: notice.title,
                    content: notice.content,
                    category: notice.category,
                    author: notice.author,
                    // created_at is default
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error adding notice:', error);
            throw error;
        }
    },
    markAsRead: (id) => {
        set((state) => ({
            notices: state.notices.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
            ),
        }));
    },
    deleteNotice: async (id) => {
        try {
            const { error } = await supabase
                .from('notices')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting notice:', error);
            throw error;
        }
    },
}));
