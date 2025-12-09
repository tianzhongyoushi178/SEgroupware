'use client';


import { Calendar } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export default function ScheduleWidget() {
    const { events } = useScheduleStore();
    const router = useRouter();

    // 今日のイベントのみフィルタリングし、開始時間順にソート
    const todayEvents = events
        .filter(event => {
            const eventDate = new Date(event.start);
            const today = new Date();
            return (
                eventDate.getDate() === today.getDate() &&
                eventDate.getMonth() === today.getMonth() &&
                eventDate.getFullYear() === today.getFullYear()
            );
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return (
        <section
            className="glass-panel cursor-pointer transition-all hover:ring-2 hover:ring-[var(--primary)]/50"
            style={{ padding: '1.5rem' }}
            onClick={() => router.push('/schedule')}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Calendar size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>今日の予定</h2>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {todayEvents.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>今日の予定はありません。</p>
                ) : (
                    todayEvents.map((event) => (
                        <div key={event.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ minWidth: '60px', textAlign: 'center', background: 'var(--surface)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {event.isAllDay ? '終日' : format(new Date(event.start), 'HH:mm')}
                                </div>
                                {!event.isAllDay && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {format(new Date(event.end), 'HH:mm')}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p style={{ fontWeight: '500' }}>{event.title}</p>
                                {event.location && (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{event.location}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
