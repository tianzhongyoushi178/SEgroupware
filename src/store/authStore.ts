import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';
import { supabase } from '@/lib/supabase';

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    isAdmin: boolean;
    initialize: () => () => void;
    logout: () => Promise<void>;
    setLocalAdmin: (email: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
    isAdmin: false,
    setLocalAdmin: (email: string) => {
        set({
            user: { id: 'local-admin', email, aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } as User,
            profile: { uid: 'local-admin', email, role: 'admin', displayName: '管理者', department: 'System', createdAt: new Date().toISOString() } as UserProfile,
            isAdmin: true,
            isLoading: false
        });
    },
    initialize: () => {
        set({ isLoading: true });

        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                set({ user: null, profile: null, isAdmin: false, isLoading: false });
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchProfile(session.user);
            } else {
                set({ user: null, profile: null, isAdmin: false, isLoading: false });
            }
        });

        return () => subscription.unsubscribe();
    },
    logout: async () => {
        try {
            await supabase.auth.signOut();
            set({ user: null, profile: null, isAdmin: false, error: null });
        } catch (error) {
            set({ error: 'ログアウトに失敗しました' });
        }
    },
}));

async function fetchProfile(user: User) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            // If profile doesn't exist, just set basic user info
            useAuthStore.setState({
                user,
                profile: null,
                isAdmin: false,
                isLoading: false,
                error: null
            });
            return;
        }

        const profile = data as UserProfile;
        useAuthStore.setState({
            user,
            profile,
            isAdmin: profile.role === 'admin' || user.email === 'tanaka-yuj@seibudenki.co.jp',
            isLoading: false,
            error: null
        });

    } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        useAuthStore.setState({
            user,
            profile: null,
            isAdmin: false,
            isLoading: false
        });
    }
}
