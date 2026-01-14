import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    theme: 'light' | 'dark';
    notifications: {
        desktop: boolean;
        notice: boolean; // お知らせ通知
        chat: boolean;   // チャット通知
    };
    defaultNoticeView: 'all' | 'unread';
    profile: {
        name: string;
        email: string;
    };
    niCollaboCookie: string;
    setTheme: (theme: 'light' | 'dark') => void;
    setNiCollaboCookie: (cookie: string) => void;
    toggleDesktopNotification: (enabled: boolean) => Promise<void>;
    toggleNotificationType: (type: 'notice' | 'chat', enabled: boolean) => void; // 新規追加
    setDefaultNoticeView: (view: 'all' | 'unread') => void;
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
                notice: true, // デフォルトON
                chat: true,   // デフォルトON
            },
            defaultNoticeView: 'all',
            profile: {
                name: '田中 太郎',
                email: 'tanaka.taro@example.com',
            },
            niCollaboCookie: 'n7o9ahn4jhfap86g90cik8kta2',

            setTheme: (theme) => set({ theme }),

            setDefaultNoticeView: (view) => set({ defaultNoticeView: view }),

            setNiCollaboCookie: (cookie) => set({ niCollaboCookie: cookie }),

            toggleDesktopNotification: async (enabled) => {
                if (enabled) {
                    try {
                        const granted = await get().requestNotificationPermission();
                        if (granted) {
                            set((state) => ({
                                notifications: {
                                    ...state.notifications,
                                    desktop: true,
                                    // 既存データの移行: undefinedの場合はtrueにする
                                    notice: state.notifications.notice ?? true,
                                    chat: state.notifications.chat ?? true
                                },
                            }));
                        } else {
                            // 許可されなかった場合はOFFのまま
                            alert('通知の許可が得られませんでした。\niOSの場合は：\n1. 「ホーム画面に追加」しているか確認\n2. iOS設定 > 通知 > (アプリ名) で許可されているか確認');
                            set((state) => ({
                                notifications: { ...state.notifications, desktop: false },
                            }));
                        }
                    } catch (error) {
                        console.error('Notification permission error:', error);
                        alert('通知設定のエラーが発生しました: ' + (error as any).message);
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

            toggleNotificationType: (type, enabled) => {
                set((state) => ({
                    notifications: {
                        ...state.notifications,
                        [type]: enabled
                    }
                }));
            },

            updateProfile: (profile) =>
                set((state) => ({
                    profile: { ...state.profile, ...profile },
                })),

            requestNotificationPermission: async () => {
                if (!('Notification' in window)) {
                    console.warn('This browser does not support desktop notification');
                    alert('このブラウザは通知をサポートしていません。\niOSをご利用の場合は、Safariの「共有」ボタンから「ホーム画面に追加」を行い、そのアイコンからアプリを起動してください。');
                    return false;
                }

                if (Notification.permission === 'granted') {
                    return true;
                }

                if (Notification.permission === 'denied') {
                    // すでに拒否されている場合
                    alert('通知がブロックされています。ブラウザまたは本体の設定から通知を許可してください。');
                    return false;
                }

                try {
                    const permission = await Notification.requestPermission();
                    return permission === 'granted';
                } catch (e) {
                    console.error('requestPermission error:', e);
                    return false;
                }
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
                defaultNoticeView: state.defaultNoticeView,
                profile: state.profile,
                niCollaboCookie: state.niCollaboCookie, // Persist cookie
            }),
        }
    )
);
