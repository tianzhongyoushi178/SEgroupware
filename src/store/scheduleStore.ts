import { create } from 'zustand';
import { ScheduleEvent } from '@/types/schedule';
import { addHours, startOfToday, setHours } from 'date-fns';

interface ScheduleState {
    events: ScheduleEvent[];
    addEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
    deleteEvent: (id: string) => void;
}

const today = startOfToday();

const mockEvents: ScheduleEvent[] = [
    {
        id: '1',
        title: '定例ミーティング',
        start: setHours(today, 10).toISOString(),
        end: setHours(today, 11).toISOString(),
        location: '会議室A',
        color: '#2563eb',
    },
    {
        id: '2',
        title: 'プロジェクトキックオフ',
        start: setHours(addHours(today, 24), 14).toISOString(),
        end: setHours(addHours(today, 24), 16).toISOString(),
        location: '大会議室',
        color: '#7c3aed',
    },
];

export const useScheduleStore = create<ScheduleState>((set) => ({
    events: mockEvents,
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
}));
