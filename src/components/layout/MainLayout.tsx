'use client';

import { usePathname } from 'next/navigation';

import IframeViewer from '@/components/common/IframeViewer';

import { useNoticeStore } from '@/store/noticeStore';
import { useEffect, useState } from 'react';

const tools = [
    { path: '/ai-chat', title: 'AI出張旅費アシスタント', url: 'https://ai-768252222357.us-west1.run.app/' },
    { path: '/se-tools', title: 'SEナレッジベース', url: 'https://se-768252222357.us-west1.run.app/' },
    { path: '/ocr-tools', title: 'OCRツール', url: 'https://ocr-768252222357.us-west1.run.app/' },
];

import { useChatStore } from '@/store/chatStore';
import { requestNotificationPermission } from '@/lib/notifications';
import { useAppSettingsStore } from '@/store/appSettingsStore';

import { useAuthStore } from '@/store/authStore';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullScreenPage = [...tools.map(t => t.path)].includes(pathname);
    const activeTool = tools.find(t => t.path === pathname);
    const { sidebarWidth } = useAppSettingsStore();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const { subscribeNotices } = useNoticeStore();
    const { subscribeToAll: subscribeChat, initialize: initChat } = useChatStore();
    const { user } = useAuthStore();

    useEffect(() => {
        // Request notification permission
        requestNotificationPermission();

        const unsubscribeNotices = subscribeNotices();
        let unsubscribeChat = () => { };

        if (user) {
            initChat(user.id);
            unsubscribeChat = subscribeChat();
        }

        return () => {
            unsubscribeNotices();
            unsubscribeChat();
        };
    }, [user]);

    return (
        <main
            style={{
                marginLeft: isMobile ? '0' : `${sidebarWidth}px`,
                padding: isFullScreenPage ? '0' : (isMobile ? '1rem' : '2rem'),
                paddingTop: isMobile && !isFullScreenPage ? '70px' : (isFullScreenPage ? '0' : '2rem'),
                minHeight: '100vh',
                height: isFullScreenPage ? '100vh' : 'auto',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {tools.map((tool) => (
                <div
                    key={tool.path}
                    style={{
                        display: pathname === tool.path ? 'block' : 'none',
                        flex: 1,
                        height: '100%',
                    }}
                >
                    <IframeViewer
                        title={tool.title}
                        url={tool.url}
                        height="100%"
                        fullScreen={true}
                    />
                </div>
            ))}
            <div style={{ display: activeTool ? 'none' : 'block', flex: 1 }}>
                {children}
            </div>
        </main>
    );
}
