'use client';

import { useState, useEffect } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';
import { X } from 'lucide-react';
import { format, addHours } from 'date-fns';

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate: Date;
}

export default function EventFormModal({ isOpen, onClose, initialDate }: EventFormModalProps) {
    const addEvent = useScheduleStore((state) => state.addEvent);
    const [title, setTitle] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [location, setLocation] = useState('');
    const [color, setColor] = useState('#2563eb');

    useEffect(() => {
        if (isOpen) {
            // Set initial times based on initialDate
            // Default: 10:00 - 11:00 on the selected date
            const startDate = new Date(initialDate);
            startDate.setHours(10, 0, 0, 0);
            const endDate = addHours(startDate, 1);

            setStart(format(startDate, "yyyy-MM-dd'T'HH:mm"));
            setEnd(format(endDate, "yyyy-MM-dd'T'HH:mm"));
        }
    }, [isOpen, initialDate]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addEvent({
            title,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            location,
            color,
        });
        onClose();
        // Reset form
        setTitle('');
        setLocation('');
        setColor('#2563eb');
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                className="glass-panel"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    background: 'var(--surface)',
                    padding: '2rem',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>予定を追加</h2>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>タイトル</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>開始日時</label>
                            <input
                                type="datetime-local"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>終了日時</label>
                            <input
                                type="datetime-local"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>場所</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="会議室A"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>色</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['#2563eb', '#ef4444', '#22c55e', '#eab308', '#7c3aed', '#64748b'].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: c,
                                        border: color === c ? '2px solid var(--text-main)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s',
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            キャンセル
                        </button>
                        <button type="submit" className="btn btn-primary">
                            保存する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
