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
    isInitialized: boolean;
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

    isInitialized: false,

    initialize: () => {
        // Initial session check
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const user = session?.user ?? null;
            const isAdmin = user?.email === 'tanaka-yuj@seibudenki.co.jp';

            let profileData = null;
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('preferences, is_tutorial_completed')
                    .eq('id', user.id)
                    .single();
                profileData = data;
            }

            set({
                user,
                profile: user ? {
                    uid: user.id,
                    email: user.email!,
                    displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
                    role: isAdmin ? 'admin' : 'user',
                    createdAt: user.created_at,
                    preferences: profileData?.preferences,
                    isTutorialCompleted: profileData?.is_tutorial_completed === true // Strict check
                } : null,
                isAdmin,
                isLoading: false,
                isInitialized: true // Mark initialization as complete
            });
        });

        // Subscription to Auth State Changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            const isAdmin = user?.email === 'tanaka-yuj@seibudenki.co.jp';

            set((state) => {
                const currentProfile = state.profile;
                const isSameUser = currentProfile?.uid === user?.id;

                return {
                    user,
                    profile: user ? {
                        uid: user.id,
                        email: user.email!,
                        displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
                        role: isAdmin ? 'admin' : 'user',
                        createdAt: user.created_at,
                        preferences: isSameUser ? (currentProfile?.preferences || {}) : {},
                        isTutorialCompleted: isSameUser ? (currentProfile?.isTutorialCompleted || false) : false
                    } : null,
                    isAdmin,
                    isLoading: false
                };
            });
        });

        // Subscription to Profiles Table (Real-time Sync)
        const profileSub = supabase
            .channel('public:profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
                console.log('Profile change event received:', payload);
                const currentUser = get().user;
                if (!currentUser) return;

                // Allow payload.new (UPDATE/INSERT)
                const newRecord = payload.new as any;

                if (newRecord && newRecord.id === currentUser.id) {
                    const newProfileData = newRecord;
                    console.log('Syncing profile preferences:', newProfileData.preferences);
                    set((state) => {
                        if (!state.profile) return state;
                        return {
                            profile: {
                                ...state.profile,
                                preferences: newProfileData.preferences,
                                isTutorialCompleted: newProfileData.is_tutorial_completed,
                                displayName: newProfileData.display_name // Sync name changes too
                            }
                        };
                    });
                }
            })
            .subscribe((status) => {
                console.log('Profile subscription status:', status);
            });

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(profileSub);
        };
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

        if (error) {
            console.error('Failed to update preferences in DB:', error);
            throw error;
        }

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

