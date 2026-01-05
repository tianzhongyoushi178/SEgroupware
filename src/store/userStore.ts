import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
}

interface UserState {
    users: UserProfile[];
    isLoading: boolean;
    error: string | null;
    fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('display_name');

            if (error) throw error;

            set({ users: data || [] });
        } catch (error: any) {
            console.error('Error fetching users:', error);
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    }
}));
