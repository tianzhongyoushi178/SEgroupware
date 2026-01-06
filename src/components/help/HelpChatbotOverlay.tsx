import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User as UserIcon } from 'lucide-react';
import styles from './HelpChatbotOverlay.module.css';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

interface HelpChatbotOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HelpChatbotOverlay({ isOpen, onClose }: HelpChatbotOverlayProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: 'こんにちは！SEグループウェアの使い方について、何か知りたいことはありますか？',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dragging state
    const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Center on mount
    useEffect(() => {
        if (isOpen && position === null) {
            const width = 350;
            const height = 500;
            setPosition({
                x: window.innerWidth / 2 - width / 2,
                y: window.innerHeight / 2 - height / 2
            });
        }
    }, [isOpen]);

    // Handle global mouse events for dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!position) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsTyping(true);

        // Mock response logic
        setTimeout(() => {
            const botResponse = getMockResponse(newUserMessage.text);
            const newBotMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, newBotMessage]);
            setIsTyping(false);
        }, 1000);
    };

    const getMockResponse = (input: string): string => {
        if (input.includes('スケジュール') || input.includes('予定')) {
            return 'スケジュールの確認・登録は、ダッシュボードの「クイックアクセス」から行うことができます。カレンダーアイコンをクリックしてください。';
        }
        if (input.includes('お知らせ') || input.includes('投稿')) {
            return 'お知らせの投稿は、ダッシュボードの「お知らせ」ウィジェットにある「投稿」ボタンから行えます。重要なお知らせはメール通知も可能です。';
        }
        if (input.includes('設定') || input.includes('通知')) {
            return '設定画面では、テーマの変更やデスクトップ通知のON/OFFが切り替えられます。「一般設定」タブをご確認ください。';
        }
        if (input.includes('申請') || input.includes('ワークフロー')) {
            return '各種申請は、サイドバーの「リンク集」にある「WEB申請」または「経費・旅費精算」から外部システムへアクセスしてください。';
        }
        return '申し訳ありません、その質問にはまだ答えられません。具体的な機能名を含めて聞いてみてください（例：スケジュールの使い方は？）。';
    };

    if (!isOpen) return null;

    return (
        <div
            className={styles.overlay}
            style={{
                left: position ? `${position.x}px` : '50%',
                top: position ? `${position.y}px` : '50%',
                transform: position ? 'none' : 'translate(-50%, -50%)',
                // Reset bottom/right from CSS if they interfere, though inline style usually overrides?
                // CSS uses fixed positioning. We need to override bottom/right to auto if we use top/left.
                bottom: 'auto',
                right: 'auto'
            }}
        >
            <div
                className={styles.header}
                onMouseDown={handleMouseDown}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <div className={styles.title}>
                    <Bot size={20} />
                    <span>ヘルプチャットボット</span>
                </div>
                <button onClick={onClose} className={styles.closeButton}>
                    <X size={18} />
                </button>
            </div>

            <div className={styles.messagesContainer}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}>
                        <div className={styles.avatar}>
                            {msg.sender === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={styles.bubble}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className={`${styles.message} ${styles.botMessage}`}>
                        <div className={styles.avatar}><Bot size={14} /></div>
                        <div className={styles.bubble}>...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className={styles.inputArea}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="質問を入力..."
                    className={styles.input}
                />
                <button type="submit" disabled={!inputValue.trim() || isTyping} className={styles.sendButton}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
