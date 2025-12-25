import { create } from 'zustand';
import { UserProfile } from '@/types/user';

// Mock User Type
interface MockUser {
    id: string;
    email: string;
    aud: string;
    app_metadata: Record<string, unknown>;
    user_metadata: Record<string, unknown>;
    created_at: string;
}

interface AuthState {
    user: MockUser | null;
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    isAdmin: boolean;
    login: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
    isAdmin: false,

    initialize: () => {
        const cleanup = () => { };

        // Mock initialization
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('mock_user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    const isAdmin = user.email === 'tanaka-yuj@seibudenki.co.jp';
                    set({
                        user,
                        profile: {
                            uid: user.id,
                            email: user.email,
                            displayName: user.email.split('@')[0],
                            role: isAdmin ? 'admin' : 'user',
                            createdAt: new Date().toISOString()
                        } as UserProfile,
                        isAdmin,
                        isLoading: false
                    });
                    return cleanup;
                } catch (e) {
                    console.error('Failed to parse mock user', e);
                }
            }
        }
        set({ isLoading: false });
        return cleanup;
    },

    login: async (email: string) => {
        set({ isLoading: true, error: null });
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

        const isAdmin = email === 'tanaka-yuj@seibudenki.co.jp';
        const mockUser: MockUser = {
            id: 'mock-user-id-' + Math.random().toString(36).substr(2, 9),
            email,
            aud: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString()
        };

        if (typeof window !== 'undefined') {
            localStorage.setItem('mock_user', JSON.stringify(mockUser));
        }

        set({
            user: mockUser,
            profile: {
                uid: mockUser.id,
                email,
                displayName: email.split('@')[0],
                role: isAdmin ? 'admin' : 'user',
                createdAt: new Date().toISOString()
            } as UserProfile,
            isAdmin,
            isLoading: false
        });
    },

    logout: async () => {
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 300));
        if (typeof window !== 'undefined') {
            localStorage.removeItem('mock_user');
        }
        set({ user: null, profile: null, isAdmin: false, isLoading: false });
    },
}));
