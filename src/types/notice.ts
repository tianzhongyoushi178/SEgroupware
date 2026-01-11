export type NoticeCategory = 'system' | 'general' | 'urgent';

export interface Notice {
    id: string;
    title: string;
    content: string;
    category: NoticeCategory;
    createdAt: string;
    author: string;
    authorId?: string; // UUID of the author
    isRead: boolean; // Local computed property
    readStatus?: Record<string, string>; // JSONB from DB: { userId: timestamp }
    readStatusVisibleTo?: 'all' | 'author_admin';
    startDate?: string;
    endDate?: string;
    targetAudience?: string[]; // ['all'] or ['admin', 'user:id', etc]
}

export interface NoticeComment {
    id: string;
    noticeId: string;
    userId: string;
    content: string;
    createdAt: string;
    user?: {
        displayName: string;
        avatarUrl?: string;
    };
}
