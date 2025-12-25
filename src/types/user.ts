export type UserRole = 'admin' | 'user';

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    displayName: string;
    department?: string;
    createdAt: string;
}
