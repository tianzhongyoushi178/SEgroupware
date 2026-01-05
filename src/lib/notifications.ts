
import { supabase } from './supabase';

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

export function sendNotification(title: string, body: string, url?: string) {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body,
            icon: '/icon-192x192.png', // Assuming pwa icon exists, or use logo
        });

        if (url) {
            notification.onclick = () => {
                window.open(url, '_blank');
                notification.close();
            };
        }
    }
}
