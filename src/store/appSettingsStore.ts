import { create } from 'zustand';

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
}

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
    tabSettings: {},
    isLoading: true,
    subscribeSettings: () => {
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('mock_settings');
                if (saved) {
                    set({ tabSettings: JSON.parse(saved), isLoading: false });
                } else {
                    set({ tabSettings: {}, isLoading: false });
                }
            } else {
                set({ isLoading: false });
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
}));
