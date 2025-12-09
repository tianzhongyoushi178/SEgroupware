'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { format } from 'date-fns';

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate: Date;
}

export default function EventFormModal({ isOpen, onClose, initialDate }: EventFormModalProps) {
    const { addEvent } = useScheduleStore();
    const [title, setTitle] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [isAllDay, setIsAllDay] = useState(false);
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            const dateStr = format(initialDate, 'yyyy-MM-dd');
            setStart(`${dateStr}T09:00`);
            setEnd(`${dateStr}T10:00`);
            setTitle('');
            setLocation('');
            setDescription('');
            setIsAllDay(false);
        }
    }, [isOpen, initialDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addEvent({
            title,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            isAllDay,
            location,
            description,
            color: '#2563eb', // Default blue
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--surface)] rounded-xl shadow-xl w-full max-w-md border border-[var(--border)]">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold">予定を作成</h2>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--hover)] rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">タイトル</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 rounded bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="予定のタイトル"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isAllDay"
                            checked={isAllDay}
                            onChange={(e) => setIsAllDay(e.target.checked)}
                            className="rounded border-[var(--border)]"
                        />
                        <label htmlFor="isAllDay" className="text-sm">終日</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">開始</label>
                            <input
                                type="datetime-local"
                                required
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                className="w-full p-2 rounded bg-[var(--background)] border border-[var(--border)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">終了</label>
                            <input
                                type="datetime-local"
                                required
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                className="w-full p-2 rounded bg-[var(--background)] border border-[var(--border)]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">場所</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full p-2 rounded bg-[var(--background)] border border-[var(--border)]"
                            placeholder="会議室Aなど"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">詳細</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 rounded bg-[var(--background)] border border-[var(--border)] h-24 resize-none"
                            placeholder="メモや詳細事項"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded hover:bg-[var(--hover)]"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
