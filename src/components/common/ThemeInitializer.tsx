'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export default function ThemeInitializer() {
    const theme = useSettingsStore((state) => state.theme);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.setProperty('--background', '#111827'); // Gray 900
            root.style.setProperty('--surface', '#1f2937'); // Gray 800
            root.style.setProperty('--surface-glass', 'rgba(17, 24, 39, 0.85)'); // Gray 900 glass
            root.style.setProperty('--text-main', '#f9fafb'); // Gray 50
            root.style.setProperty('--text-secondary', '#d1d5db'); // Gray 300 (Lighter for better readability)
            root.style.setProperty('--border', '#374151'); // Gray 700
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
