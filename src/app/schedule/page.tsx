'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import EventFormModal from '@/components/schedule/EventFormModal';
import styles from './page.module.css';

export default function SchedulePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const { events, fetchEvents } = useScheduleStore();

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const handleAddEvent = () => {
        setSelectedDate(new Date());
        setIsModalOpen(true);
    };

    return (
        <div className={styles.container}>
            {/* Header Controls */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.navButtons}>
                        <button onClick={prevMonth} className={styles.navBtn}>
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={nextMonth} className={styles.navBtn}>
                            <ChevronRight size={16} />
                        </button>
                        <button onClick={goToToday} className={styles.todayBtn}>
                            今日
                        </button>
                    </div>
                    <h1 className={styles.monthTitle}>
                        {format(currentDate, 'yyyy/MM')}
                    </h1>
                </div>
                <button onClick={handleAddEvent} className={styles.addBtn}>
                    <Plus size={16} />
                    <span>予定登録</span>
                </button>
            </div>

            {/* Calendar Grid */}
            <div className={styles.calendarContainer}>
                {/* Weekday Headers */}
                <div className={styles.weekdayHeader}>
                    {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                        <div
                            key={day}
                            className={`${styles.weekday} ${index === 0 ? styles.sunday : index === 6 ? styles.saturday : ''}`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className={styles.grid}>
                    {calendarDays.map((day, dayIdx) => {
                        const dayEvents = events.filter(event =>
                            isSameDay(new Date(event.start), day)
                        );
                        const isSunday = day.getDay() === 0;
                        const isSaturday = day.getDay() === 6;
                        const isOtherMonth = !isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    ${styles.cell}
                                    ${isOtherMonth ? styles.otherMonth : ''}
                                    ${isTodayDate ? styles.today : ''}
                                `}
                            >
                                {/* Date Number */}
                                <div className={`${styles.dateNumber} ${isSunday ? styles.sunday : isSaturday ? styles.saturday : ''} ${isOtherMonth ? styles.otherMonth : ''}`}>
                                    {format(day, 'M/d')}
                                </div>

                                {/* Events */}
                                <div className={styles.eventsList}>
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className={styles.eventItem}
                                            style={{
                                                backgroundColor: event.color ? `${event.color}33` : '#e3f2fd',
                                                borderLeft: `3px solid ${event.color || '#2196f3'}`
                                            }}
                                        >
                                            <span className={styles.eventTime}>
                                                {event.isAllDay ? '終日' : format(new Date(event.start), 'HH:mm')}
                                            </span>
                                            <span className={styles.eventTitle}>{event.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
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
