import { create } from 'zustand';
import { Notice } from '@/types/notice';

interface NoticeState {
    notices: Notice[];
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    deleteNotice: (id: string) => void;
}

const mockNotices: Notice[] = [];

import { persist } from 'zustand/middleware';

export const useNoticeStore = create<NoticeState>()(
    persist(
        (set) => ({
            notices: mockNotices,
            addNotice: (notice) =>
                set((state) => ({
                    notices: [
                        {
                            ...notice,
                            id: Math.random().toString(36).substring(7),
                            createdAt: new Date().toISOString(),
                            isRead: false,
                        },
                        ...state.notices,
                    ],
                })),
            markAsRead: (id) =>
                set((state) => ({
                    notices: state.notices.map((n) =>
                        n.id === id ? { ...n, isRead: true } : n
                    ),
                })),
            deleteNotice: (id) =>
                set((state) => ({
                    notices: state.notices.filter((n) => n.id !== id),
                })),
        }),
        {
            name: 'notice-storage',
        }
    )
);
