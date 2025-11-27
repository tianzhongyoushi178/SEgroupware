export interface ScheduleEvent {
    id: string;
    title: string;
    start: string; // ISO string
    end: string; // ISO string
    description?: string;
    location?: string;
    color?: string;
}
