'use client';

import { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Users, Calendar } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useSettingsStore } from '@/store/settingsStore';
import EventFormModal from '@/components/schedule/EventFormModal';
import styles from './page.module.css';

export default function SchedulePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const { events, users, fetchEvents, syncEvents } = useScheduleStore();
    const { niCollaboCookie } = useSettingsStore();

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // 0 for Sunday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

    const weekDays = eachDayOfInterval({
        start: weekStart,
        end: weekEnd,
    });

    const handleCellClick = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const handleAddEvent = () => {
        setSelectedDate(new Date());
        setIsModalOpen(true);
    };

    const handleSync = () => {
        const cookie = prompt('NI Collaboのセッションクッキー(__NISID__)を入力してください', niCollaboCookie);
        if (cookie) {
            syncEvents(cookie);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header Controls */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.navButtons}>
                        <button onClick={prevWeek} className={styles.navBtn} aria-label="Previous week">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={nextWeek} className={styles.navBtn} aria-label="Next week">
                            <ChevronRight size={16} />
                        </button>
                        <button onClick={goToToday} className={styles.todayBtn}>
                            今日
                        </button>
                    </div>
                    <h1 className={styles.monthTitle}>
                        {format(weekStart, 'yyyy年 M月', { locale: ja })}
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSync} className={styles.addBtn} style={{ backgroundColor: '#2196f3' }}>
                        <span>同期</span>
                    </button>
                    <button onClick={handleAddEvent} className={styles.addBtn}>
                        <Plus size={16} />
                        <span>予定登録</span>
                    </button>
                </div>
            </div>

            {/* Timeline Grid */}
            <div className={styles.timelineContainer}>
                <div className={styles.grid}>
                    {/* Header Row */}
                    <div className={styles.headerRow}>
                        <div className={styles.cornerCell}>
                            <Users size={16} style={{ marginRight: 8 }} />
                            <span>メンバー</span>
                        </div>
                        {weekDays.map((day, index) => {
                            const isSunday = day.getDay() === 0;
                            const isSaturday = day.getDay() === 6;
                            const isCurrentDay = isToday(day);
                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`
                                        ${styles.dateHeader} 
                                        ${isSunday ? styles.sunday : ''} 
                                        ${isSaturday ? styles.saturday : ''}
                                        ${isCurrentDay ? styles.today : ''}
                                    `}
                                >
                                    <span style={{ fontSize: '12px' }}>{format(day, 'E', { locale: ja })}</span>
                                    <span style={{ fontSize: '18px', lineHeight: 1 }}>{format(day, 'd')}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* User Rows */}
                    {users.map(user => (
                        <div key={user.id} className={styles.userRow}>
                            {/* User Info Cell */}
                            <div className={styles.userCell} style={{ backgroundColor: user.color ? `${user.color}40` : '#fff' }}>
                                <div className={styles.userName}>{user.name}</div>
                                <div className={styles.userDept}>{user.department}</div>
                            </div>

                            {/* Day Cells for User */}
                            {weekDays.map(day => {
                                const dayEvents = events.filter(event =>
                                    event.userId === user.id && isSameDay(new Date(event.start), day)
                                );
                                const isSunday = day.getDay() === 0;
                                const isSaturday = day.getDay() === 6;

                                return (
                                    <div
                                        key={`${user.id}-${day.toISOString()}`}
                                        className={`
                                            ${styles.timeCell}
                                            ${isSunday ? styles.sunday : ''} 
                                            ${isSaturday ? styles.saturday : ''}
                                        `}
                                        onClick={() => handleCellClick(day)}
                                    >
                                        <div className={styles.eventList}>
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    className={styles.eventItem}
                                                    style={{
                                                        backgroundColor: event.color ? `${event.color}20` : '#e3f2fd',
                                                        borderLeft: `2px solid ${event.color || '#2196f3'}`,
                                                        color: '#333'
                                                    }}
                                                >
                                                    <span className={styles.eventTime}>
                                                        {format(new Date(event.start), 'HH:mm')}
                                                    </span>
                                                    <span className={styles.eventTitle}>{event.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <EventFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialDate={selectedDate || new Date()}
            />
        </div>
    );
}
