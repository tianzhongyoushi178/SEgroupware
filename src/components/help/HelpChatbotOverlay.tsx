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

    // Resizing state
    const [size, setSize] = useState({ width: 420, height: 600 });
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Center on mount
    useEffect(() => {
        if (isOpen && position === null) {
            setPosition({
                x: window.innerWidth / 2 - size.width / 2,
                y: window.innerHeight / 2 - size.height / 2
            });
        }
    }, [isOpen]);

    // Handle global mouse events for dragging and resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            } else if (isResizing && position) {
                setSize({
                    width: Math.max(300, e.clientX - position.x),
                    height: Math.max(400, e.clientY - position.y)
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, position]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!position) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
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

        try {
            const response = await fetch('/api/chat/help', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newUserMessage.text }),
            });

            const data = await response.json();
            const replyText = data.reply || (data.error ? `エラー: ${data.error}` : 'エラーが発生しました');

            const newBotMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: replyText,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, newBotMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: '通信エラーが発生しました。しばらく待ってから再度お試しください。',
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={styles.overlay}
            style={{
                left: position ? `${position.x}px` : '50%',
                top: position ? `${position.y}px` : '50%',
                width: `${size.width}px`,
                height: `${size.height}px`,
                transform: position ? 'none' : 'translate(-50%, -50%)',
                // Reset bottom/right from CSS if they interfere
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

            <div
                className={styles.resizerHandle}
                onMouseDown={handleResizeStart}
            />
        </div>
    );
}
