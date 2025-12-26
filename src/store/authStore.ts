import { create } from 'zustand';
import { UserProfile } from '@/types/user';

import { create } from 'zustand';
import { UserProfile } from '@/types/user';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    isAdmin: boolean;
    login: (email: string, password: string, isSignUp?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => () => void;
    updateProfileName: (name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
    isAdmin: false,

    initialize: () => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            const user = session?.user ?? null;
            const isAdmin = user?.email === 'tanaka-yuj@seibudenki.co.jp';

            set({
                user,
                profile: user ? {
                    uid: user.id,
                    email: user.email!,
                    displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
                    role: isAdmin ? 'admin' : 'user',
                    createdAt: user.created_at
                } : null,
                isAdmin,
                isLoading: false
            });
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            const isAdmin = user?.email === 'tanaka-yuj@seibudenki.co.jp';

            set({
                user,
                profile: user ? {
                    uid: user.id,
                    email: user.email!,
                    displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
                    role: isAdmin ? 'admin' : 'user',
                    createdAt: user.created_at
                } : null,
                isAdmin,
                isLoading: false
            });
        });

        return () => subscription.unsubscribe();
    },

    login: async (email, password, isSignUp = false) => {
        set({ isLoading: true, error: null });

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({ user: null, profile: null, isAdmin: false, isLoading: false });
    },

    updateProfileName: async (name: string) => {
        const { error } = await supabase.auth.updateUser({
            data: { display_name: name }
        });

        if (error) throw error;

        // Optimistic update
        const currentProfile = get().profile;
        if (currentProfile) {
            set({
                profile: { ...currentProfile, displayName: name }
            });
        }
    }
}));
