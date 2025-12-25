import { LayoutDashboard, Bell, MessageSquare, Wrench, FileText } from 'lucide-react';

export const navigation = [
    { name: 'ダッシュボード', href: '/', icon: LayoutDashboard },
    { name: 'お知らせ', href: '/notices', icon: Bell },
    { name: 'AI出張旅費アシスタント', href: '/ai-chat', icon: MessageSquare },
    { name: 'SEナレッジベース', href: '/se-tools', icon: Wrench },
    { name: 'OCRツール', href: '/ocr-tools', icon: FileText },
];
