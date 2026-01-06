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
    updatePreferences: (preferences: any) => Promise<void>;
    completeTutorial: () => Promise<void>;
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

            set((state) => {
                const currentProfile = state.profile;
                // Only preserve if it's the same user
                const isSameUser = currentProfile?.uid === user?.id;

                return {
                    user,
                    profile: user ? {
                        uid: user.id,
                        email: user.email!,
                        displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
                        role: isAdmin ? 'admin' : 'user',
                        createdAt: user.created_at,
                        // Preserve preferences and tutorial status if same user, otherwise reset
                        preferences: isSameUser ? (currentProfile?.preferences || {}) : {},
                        isTutorialCompleted: isSameUser ? (currentProfile?.isTutorialCompleted || false) : false
                    } : null,
                    isAdmin,
                    isLoading: false
                };
            });
        });

        // Fetch extra profile data (preferences) if user is logged in
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('preferences, is_tutorial_completed')
                    .eq('id', session.user.id)
                    .single();

                if (data) {
                    set(state => ({
                        profile: state.profile ? {
                            ...state.profile,
                            preferences: data.preferences,
                            isTutorialCompleted: data.is_tutorial_completed
                        } : null
                    }));
                }
            }
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
        const { data: { user }, error } = await supabase.auth.updateUser({
            data: { display_name: name }
        });

        if (error) throw error;

        // Also update public.profiles using upsert to ensure record exists
        if (user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    display_name: name
                }, { onConflict: 'id' });

            if (profileError) {
                console.error('Failed to sync profile', profileError);
                // Don't throw here, as auth update succeeded
            }
        }

        // Optimistic update
        const currentProfile = get().profile;
        if (currentProfile) {
            set({
                profile: { ...currentProfile, displayName: name }
            });
        }
    },

    updatePreferences: async (preferences: any) => {
        const user = get().user;
        if (!user) return;

        // Merge with existing preferences
        const currentProfile = get().profile;
        const newPreferences = { ...(currentProfile?.preferences || {}), ...preferences };

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                preferences: newPreferences
            }, { onConflict: 'id' });

        if (error) throw error;

        // Optimistic update
        if (currentProfile) {
            set({
                profile: { ...currentProfile, preferences: newPreferences }
            });
        }
    },

    completeTutorial: async () => {
        const user = get().user;
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ is_tutorial_completed: true })
            .eq('id', user.id);

        if (error) {
            console.error('Failed to complete tutorial:', error);
            return;
        }

        const currentProfile = get().profile;
        if (currentProfile) {
            set({
                profile: { ...currentProfile, isTutorialCompleted: true }
            });
        }
    }
}));
