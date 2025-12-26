export type UserRole = 'admin' | 'user';

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    displayName: string;
    department?: string;
    createdAt: string;
    preferences?: {
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
    };
}
