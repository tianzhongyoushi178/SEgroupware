'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export default function ThemeInitializer() {
    const theme = useSettingsStore((state) => state.theme);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.setProperty('--background', '#0f172a');
            root.style.setProperty('--surface', '#1e293b');
            root.style.setProperty('--text-main', '#f1f5f9'); // Slate 100
            root.style.setProperty('--text-secondary', '#cbd5e1'); // Slate 300
            root.style.setProperty('--border', '#334155');
        } else {
            root.classList.remove('dark');
            root.style.removeProperty('--background');
            root.style.removeProperty('--surface');
            root.style.removeProperty('--text-main');
            root.style.removeProperty('--text-secondary');
            root.style.removeProperty('--border');
        }
    }, [theme]);

    return null;
}
