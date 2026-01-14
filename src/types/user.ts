export type UserRole = 'admin' | 'user';

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    displayName: string;
    department?: string;
    createdAt: string;
    isTutorialCompleted?: boolean;
    preferences?: {
        theme?: 'light' | 'dark';
        notifications?: {
            desktop: boolean;
            notice: boolean;
            chat: boolean;
        };
        defaultNoticeView?: 'all' | 'unread';
        niCollaboCookie?: string;
        quickAccess?: {
            [key: string]: boolean;
        };
        customQuickAccess?: {
            id: string;
            title: string;
            url: string;
        }[];
        customLinks?: {
            id: string;
            title: string;
            url: string;
        }[];
        quickAccessOrder?: string[];
    };
}
