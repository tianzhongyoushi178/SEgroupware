export type NoticeCategory = 'system' | 'general' | 'urgent';

export interface Notice {
    id: string;
    title: string;
    content: string;
    category: NoticeCategory;
    createdAt: string;
    author: string;
    isRead: boolean;
}
