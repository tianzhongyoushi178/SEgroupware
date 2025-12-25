import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface TabSetting {
    visible: boolean;
    adminOnly: boolean;
    label?: string; // Optional custom label
}

export interface TabSettings {
    [path: string]: TabSetting;
}

interface AppSettingsState {
    tabSettings: TabSettings;
    isLoading: boolean;
    subscribeSettings: () => () => void;
    updateTabSetting: (path: string, setting: TabSetting) => Promise<void>;
}

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
    tabSettings: {},
    isLoading: true,
    subscribeSettings: () => {

        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'sidebar_tabs')
                .single();

            if (data) {
                set({ tabSettings: data.value as TabSettings, isLoading: false });
            } else {
                set({ tabSettings: {}, isLoading: false });
            }
        };

        fetchSettings();

        // Realtime subscription
        const channel = supabase
            .channel('public:settings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.sidebar_tabs' }, () => {
                // Fetch latest on any change (simplified)
                fetchSettings();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },
    updateTabSetting: async (path, setting) => {
        const currentSettings = get().tabSettings;
        const newSettings = { ...currentSettings, [path]: setting };

        // Upsert settings
        await supabase
            .from('settings')
            .upsert({ key: 'sidebar_tabs', value: newSettings });

        // Update local state immediately for responsiveness (realtime will confirm it)
        set({ tabSettings: newSettings });
    },
}));
