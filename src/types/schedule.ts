export interface ScheduleEvent {
    id: string;
    title: string;
    start: string; // ISO string
    end: string; // ISO string
    description?: string;
    location?: string;
    color?: string;
    isAllDay?: boolean;
    userId: string;
}

export interface ScheduleUser {
    id: string;
    name: string;
    department: string;
    avatar?: string;
    color?: string;
}
