'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export default function ThemeInitializer() {
    const theme = useSettingsStore((state) => state.theme);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.setProperty('--background', '#020617'); // Slate 950
            root.style.setProperty('--surface', '#0f172a'); // Slate 900
            root.style.setProperty('--surface-glass', 'rgba(2, 6, 23, 0.8)'); // Dark glass
            root.style.setProperty('--text-main', '#ffffff'); // White
            root.style.setProperty('--text-secondary', '#94a3b8'); // Slate 400
            root.style.setProperty('--border', '#1e293b'); // Slate 800
        } else {
            root.classList.remove('dark');
            root.style.removeProperty('--background');
            root.style.removeProperty('--surface');
            root.style.removeProperty('--surface-glass');
            root.style.removeProperty('--text-main');
            root.style.removeProperty('--text-secondary');
            root.style.removeProperty('--border');
        }
    }, [theme]);

    return null;
}
