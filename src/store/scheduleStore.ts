import { create } from 'zustand';
import { ScheduleEvent, ScheduleUser } from '@/types/schedule';
import { addHours, startOfToday, setHours, addDays } from 'date-fns';

interface ScheduleState {
    events: ScheduleEvent[];
    users: ScheduleUser[];
    addEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
    deleteEvent: (id: string) => void;
    fetchEvents: () => Promise<void>;
    syncEvents: (cookieValue: string) => Promise<void>;
}

const today = startOfToday();

const mockUsers: ScheduleUser[] = [
    { id: 'u1', name: '田中 優史', department: 'ソリューショングループ', color: '#BBDEFB' },
    { id: 'u2', name: '須藤 浩輔', department: 'SE課', color: '#E1BEE7' },
    { id: 'u3', name: '井上 宗敬', department: 'SE課', color: '#FFECB3' },
    { id: 'u4', name: '田中 伸尚', department: '本社SEグループ', color: '#C8E6C9' },
    { id: 'u5', name: '今泉 雄妃', department: '本社SEグループ', color: '#F8BBD0' },
    { id: 'u6', name: '原 成', department: '本社SEグループ', color: '#D1C4E9' },
    { id: 'u7', name: '梶原 麻希', department: '本社SEグループ', color: '#B2DFDB' },
    { id: 'u8', name: '安部 玲理', department: '本社SEグループ', color: '#FFCDD2' },
    { id: 'u9', name: '西隈 啓二', department: '本社SEグループ', color: '#F0F4C3' },
    { id: 'u10', name: '久我 愛', department: 'SE課', color: '#FFE0B2' },
    { id: 'u11', name: '松下 和央', department: 'SE課', color: '#CFD8DC' },
    { id: 'u12', name: '伊藤 敦', department: 'SE課', color: '#B3E5FC' },
    { id: 'u13', name: '李 英杰', department: '大阪SEグループ', color: '#DCEDC8' },
    { id: 'u14', name: '七村 優妃', department: '大阪SEグループ', color: '#F5F5F5' },
    { id: 'u15', name: '三嶽 悟', department: '東京SEグループ', color: '#FFCCBC' },
    { id: 'u16', name: '大坪 隆', department: '東京SEグループ', color: '#D7CCC8' },
    { id: 'u17', name: '玉木 陽介', department: '東京SEグループ', color: '#C5CAE9' },
    { id: 'u18', name: '山本 健斗', department: '東京SEグループ', color: '#B2EBF2' },
    { id: 'u19', name: '崎村 悠登', department: 'ソリューショングループ', color: '#FFAB91' },
    { id: 'u20', name: '副田 武司', department: 'ソリューショングループ', color: '#A5D6A7' },
];

const mockEvents: ScheduleEvent[] = [
    {
        id: '1',
        title: '定例ミーティング',
        start: setHours(today, 10).toISOString(),
        end: setHours(today, 11).toISOString(),
        location: '会議室A',
        color: '#2563eb',
        userId: 'u1',
    },
    {
        id: '2',
        title: 'プロジェクトキックオフ',
        start: setHours(addDays(today, 1), 14).toISOString(),
        end: setHours(addDays(today, 1), 16).toISOString(),
        location: '大会議室',
        color: '#7c3aed',
        userId: 'u2',
    },
    {
        id: '3',
        title: '週次報告会',
        start: setHours(today, 13).toISOString(),
        end: setHours(today, 14).toISOString(),
        location: 'オンライン',
        color: '#d97706',
        userId: 'u3',
    },
    {
        id: '4',
        title: 'クライアント訪問',
        start: setHours(addDays(today, 2), 10).toISOString(),
        end: setHours(addDays(today, 2), 12).toISOString(),
        location: '外出',
        color: '#059669',
        userId: 'u1',
    },
    {
        id: '5',
        title: '社内研修',
        start: setHours(addDays(today, 3), 15).toISOString(),
        end: setHours(addDays(today, 3), 17).toISOString(),
        location: '研修室',
        color: '#db2777',
        userId: 'u4',
    },
];

export const useScheduleStore = create<ScheduleState>((set) => ({
    events: mockEvents,
    users: mockUsers,
    addEvent: (event) =>
        set((state) => ({
            events: [
                {
                    ...event,
                    id: Math.random().toString(36).substring(7),
                },
                ...state.events,
            ],
        })),
    deleteEvent: (id) =>
        set((state) => ({
            events: state.events.filter((e) => e.id !== id),
        })),
    fetchEvents: async () => {
        try {
            const response = await fetch('/api/schedule');
            if (response.ok) {
                const data = await response.json();
                if (data.events) {
                    set((state) => {
                        return { events: [...state.events, ...data.events] };
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    },
    syncEvents: async (cookieValue: string) => {
        try {
            const response = await fetch('/api/schedule/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    cookie_value: cookieValue,
                }),
            });
            const data = await response.json();
            console.log('Sync result:', data);
            if (data.success) {
                set((state) => {
                    // Filter out old events that might be replaced, or just append distinct ones?
                    // For now, let's just append new ones. 
                    // Ideally we should replace events for the synced range. 
                    // But since we generate IDs based on ukey or distinct keys, duplication might be low.
                    // However, to be safe, let's just merge.

                    // Actually, if we are "syncing", we might want to replace events for these users?
                    // But data.events is all we got.

                    // Simple approach: Add new events. (User can clear via "deleteEvent" if needed or we can implement clear logic later)
                    // Better: Filter out events that clash?
                    // For now, satisfy "Members are fixed" -> Don't touch users.

                    return {
                        // users: state.users, // KEEP FIXED
                        events: [...state.events, ...(data.events || [])]
                    };
                });

                alert(`同期成功: ${data.message}\n` +
                    `取得イベント数: ${data.events?.length || 0}`);
            } else {
                alert(`同期失敗: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to sync events:', error);
            alert('同期エラーが発生しました');
        }
    },
}));
