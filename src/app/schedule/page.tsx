'use client';

import IframeViewer from '@/components/common/IframeViewer';

export default function SchedulePage() {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
                <IframeViewer
                    title="NI Collabo 365"
                    url="http://10.1.27.101/ni/niware/portal/?portal=145"
                    height="100%"
                    fullScreen={true}
                />
            </div>
        </div>
    );
}
