import { create } from 'zustand';
import { Notice } from '@/types/notice';

interface NoticeState {
    notices: Notice[];
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    deleteNotice: (id: string) => void;
}

const mockNotices: Notice[] = [
    {
        id: '1',
        title: 'システムメンテナンスについて',
        content: '11月30日(土) 22:00〜24:00の間、サーバーメンテナンスのためシステムが利用できません。',
        category: 'system',
        createdAt: '2025-11-26T10:00:00',
        author: 'システム管理者',
        isRead: false,
    },
    {
        id: '2',
        title: '年末年始の営業日について',
        content: '年内は12月28日まで、年始は1月6日から営業開始となります。',
        category: 'general',
        createdAt: '2025-11-25T09:00:00',
        author: '総務部',
        isRead: true,
    },
    {
        id: '3',
        title: '【重要】セキュリティ研修の受講について',
        content: '全社員対象のセキュリティ研修を12月10日までに受講してください。',
        category: 'urgent',
        createdAt: '2025-11-24T15:00:00',
        author: '人事部',
        isRead: false,
    },
];

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
