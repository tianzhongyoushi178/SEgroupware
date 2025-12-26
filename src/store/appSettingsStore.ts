import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { UserProfileWithPermission, UserPermission } from '@/types/userPermission';

export interface TabSetting {
    visible: boolean;
    adminOnly: boolean;
    label?: string;
}

export interface TabSettings {
    [path: string]: TabSetting;
}

interface AppSettingsState {
    tabSettings: TabSettings;
    isLoading: boolean;
    subscribeSettings: () => () => void;
    updateTabSetting: (path: string, setting: TabSetting) => Promise<void>;
    fetchUserPermissions: (userId: string) => Promise<UserPermission>;
    updateUserPermission: (userId: string, path: string, visible: boolean) => Promise<void>;
    updateUserPermissions: (userId: string, permissions: UserPermission) => Promise<void>;
    getAllProfiles: () => Promise<any[]>;
    sidebarWidth: number;
    setSidebarWidth: (width: number) => void;
}

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
    tabSettings: {},
    sidebarWidth: 280,
    setSidebarWidth: (width) => set({ sidebarWidth: width }),
    isLoading: true,
    subscribeSettings: () => {
        // Mock default settings for now, will start using DB permissions soon
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('mock_settings');
                if (saved) {
                    set({ tabSettings: JSON.parse(saved), isLoading: false });
                } else {
                    set({ tabSettings: {}, isLoading: false });
                }
            }
        }, 300);
        return () => { };
    },
    updateTabSetting: async (path, setting) => {
        const currentSettings = get().tabSettings;
        const newSettings = { ...currentSettings, [path]: setting };
        if (typeof window !== 'undefined') {
            localStorage.setItem('mock_settings', JSON.stringify(newSettings));
        }
        set({ tabSettings: newSettings });
    },
    // New methods for User Permissions
    fetchUserPermissions: async (userId: string) => {
        const { data, error } = await supabase
            .from('user_permissions')
            .select('permissions')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching permissions:', error);
            return {};
        }

        return data?.permissions || {};
    },
    updateUserPermission: async (userId: string, path: string, visible: boolean) => {
        // Fetch current first
        const { data } = await supabase
            .from('user_permissions')
            .select('permissions')
            .eq('user_id', userId)
            .single();

        const currentPermissions = data?.permissions || {};
        const newPermissions = { ...currentPermissions, [path]: visible };

        const { error } = await supabase
            .from('user_permissions')
            .upsert({ user_id: userId, permissions: newPermissions, updated_at: new Date().toISOString() });

        if (error) {
            console.error('Error updating permission:', error);
            throw error;
        }
    },
    updateUserPermissions: async (userId: string, permissions: UserPermission) => {
        const { error } = await supabase
            .from('user_permissions')
            .upsert({ user_id: userId, permissions, updated_at: new Date().toISOString() });

        if (error) {
            console.error('Error updating permissions:', error);
            throw error;
        }
    },
    getAllProfiles: async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data || [];
    }
}));
