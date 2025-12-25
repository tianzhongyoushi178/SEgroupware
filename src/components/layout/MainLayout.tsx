'use client';

import { usePathname } from 'next/navigation';

import IframeViewer from '@/components/common/IframeViewer';

const tools = [
    { path: '/ai-chat', title: 'AI出張旅費アシスタント', url: 'https://ai-768252222357.us-west1.run.app/' },
    { path: '/se-tools', title: 'SEナレッジベース', url: 'https://se-768252222357.us-west1.run.app/' },
    { path: '/ocr-tools', title: 'OCRツール', url: 'https://ocr-768252222357.us-west1.run.app/' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullScreenPage = [...tools.map(t => t.path)].includes(pathname);
    const activeTool = tools.find(t => t.path === pathname);

    return (
        <main
            style={{
                marginLeft: '280px',
                padding: isFullScreenPage ? '0' : '2rem',
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
