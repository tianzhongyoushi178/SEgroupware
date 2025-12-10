import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    theme: 'light' | 'dark';
    notifications: {
        desktop: boolean;
    };
    profile: {
        name: string;
        email: string;
    };
    niCollaboCookie: string;
    setTheme: (theme: 'light' | 'dark') => void;
    setNiCollaboCookie: (cookie: string) => void;
    toggleDesktopNotification: (enabled: boolean) => Promise<void>;
    updateProfile: (profile: Partial<SettingsState['profile']>) => void;
    requestNotificationPermission: () => Promise<boolean>;
    sendTestNotification: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            theme: 'light',
            notifications: {
                desktop: false,
            },
            profile: {
                name: '田中 太郎',
                email: 'tanaka.taro@example.com',
            },
            niCollaboCookie: 'n7o9ahn4jhfap86g90cik8kta2',

            setTheme: (theme) => set({ theme }),

            setNiCollaboCookie: (cookie) => set({ niCollaboCookie: cookie }),

            toggleDesktopNotification: async (enabled) => {
                if (enabled) {
                    const granted = await get().requestNotificationPermission();
                    if (granted) {
                        set((state) => ({
                            notifications: { ...state.notifications, desktop: true },
                        }));
                    } else {
                        // 許可されなかった場合はOFFのまま
                        set((state) => ({
                            notifications: { ...state.notifications, desktop: false },
                        }));
                    }
                } else {
                    set((state) => ({
                        notifications: { ...state.notifications, desktop: false },
                    }));
                }
            },

            updateProfile: (profile) =>
                set((state) => ({
                    profile: { ...state.profile, ...profile },
                })),

            requestNotificationPermission: async () => {
                if (!('Notification' in window)) {
                    console.warn('This browser does not support desktop notification');
                    return false;
                }

                if (Notification.permission === 'granted') {
                    return true;
                }

                const permission = await Notification.requestPermission();
                return permission === 'granted';
            },

            sendTestNotification: () => {
                const { notifications } = get();
                if (!notifications.desktop) {
                    alert('デスクトップ通知が有効になっていません。');
                    return;
                }

                if (!('Notification' in window)) {
                    alert('このブラウザは通知をサポートしていません。');
                    return;
                }

                if (Notification.permission === 'granted') {
                    new Notification('テスト通知', {
                        body: 'これはSEグループウェアからのテスト通知です。',
                        icon: '/logo.png',
                    });
                } else {
                    alert('通知の許可がありません。');
                }
            },
        }),
        {
            name: 'settings-storage',
            partialize: (state) => ({
                theme: state.theme,
                notifications: state.notifications,
                profile: state.profile,
                niCollaboCookie: state.niCollaboCookie, // Persist cookie
            }),
        }
    )
);
