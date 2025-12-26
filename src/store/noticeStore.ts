import { create } from 'zustand';
import { Notice } from '@/types/notice';

interface NoticeState {
    notices: Notice[];
    isLoading: boolean;
    error: string | null;
    subscribeNotices: () => () => void;
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
    markAsRead: (id: string) => void;
    deleteNotice: (id: string) => Promise<void>;
}

const mockNotices: Notice[] = [];

export const useNoticeStore = create<NoticeState>((set) => ({
    notices: [],
    isLoading: false,
    error: null,
    subscribeNotices: () => {
        set({ isLoading: true });
        // Simulate fetch delay
        setTimeout(() => {
            // Load from localStorage if available, else mock
            let storedNotices = mockNotices;
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('mock_notices');
                if (saved) {
                    storedNotices = JSON.parse(saved);
                }
            }
            set({ notices: storedNotices, isLoading: false });
        }, 500);

        return () => { };
    },
    addNotice: async (notice) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const newNotice: Notice = {
            id: Math.random().toString(36).substr(2, 9),
            title: notice.title,
            content: notice.content,
            category: notice.category,
            createdAt: new Date().toISOString(),
            author: notice.author || 'system',
            isRead: false
        };

        set(state => {
            const updated = [newNotice, ...state.notices];
            if (typeof window !== 'undefined') {
                localStorage.setItem('mock_notices', JSON.stringify(updated));
            }
            return { notices: updated };
        });
    },
    markAsRead: (id) => {
        set((state) => {
            const updated = state.notices.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
            );
            if (typeof window !== 'undefined') {
                localStorage.setItem('mock_notices', JSON.stringify(updated));
            }
            return { notices: updated };
        });
    },
    deleteNotice: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        set(state => {
            const updated = state.notices.filter(n => n.id !== id);
            if (typeof window !== 'undefined') {
                localStorage.setItem('mock_notices', JSON.stringify(updated));
            }
            return { notices: updated };
        });
    },
}));
