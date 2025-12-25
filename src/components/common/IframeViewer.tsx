'use client';

import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface IframeViewerProps {
    url: string;
    title: string;
    height?: string;
    fullScreen?: boolean;
}

export default function IframeViewer({ url, title, height = '600px', fullScreen = false }: IframeViewerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
        <div
            className={fullScreen ? '' : 'glass-panel'}
            style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: height,
                width: '100%',
                borderRadius: fullScreen ? '0' : undefined,
            }}
        >
            <div
                style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.5)',
                }}
            >
                <h3 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {title}
                </h3>
            </div>

            <div style={{ position: 'relative', flex: 1, width: '100%', background: 'white' }}>
                {isLoading && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--surface)',
                            zIndex: 10,
                        }}
                    >
                        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                    </div>
                )}

                <iframe
                    src={url}
                    title={title}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                />

                {hasError && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--surface)',
                            padding: '2rem',
                            textAlign: 'center',
                            zIndex: 20,
                        }}
                    >
                        <AlertCircle size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>表示できませんでした</p>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>
                            セキュリティ設定により、このサイトを埋め込んで表示することが許可されていない可能性があります。
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
