
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem',
        borderRadius: '0.5rem',
        background: 'var(--background-secondary)',
        marginBottom: '0.5rem',
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div
                {...listeners}
                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
            >
                <GripVertical size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                {children}
            </div>
        </div>
    );
}
