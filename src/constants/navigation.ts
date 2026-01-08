import { LayoutDashboard, Bell, MessageSquare, Wrench, FileText, Bot, Link, ExternalLink } from 'lucide-react';

export const navigation = [
    { name: 'ダッシュボード', href: '/', icon: LayoutDashboard },
    { name: 'お知らせ', href: '/notices', icon: Bell },
    { name: 'チャット', href: '/chat', icon: MessageSquare },
    {
        name: 'AIツール',
        href: '#ai-tools',
        icon: Bot,
        children: [
            { name: 'AI出張旅費アシスタント', href: '/ai-chat', icon: MessageSquare },
            { name: 'SEナレッジベース', href: '/se-tools', icon: Wrench },
            { name: 'OCRツール', href: '/ocr-tools', icon: FileText },
        ]
    },
    {
        name: 'リンク集',
        href: '#links',
        icon: Link,
        children: [
            { name: "desknet'sNEO", href: 'http://10.1.1.39/Scripts/dneo/dneo.exe', icon: ExternalLink },
            { name: 'NI Collabo 360', href: 'http://10.1.27.101/ni/niware/portal/index.php?hkey=clbheader_677ca37a278c9ee84282d13070ceb44c', icon: ExternalLink },
            { name: 'Salesforce', href: 'https://seibudenki.my.salesforce.com/?ec=302&startURL=%2Fvisualforce%2Fsession%3Furl%3Dhttps%253A%252F%252Fseibudenki.lightning.force.com%252Flightning%252Fpage%252Fhome', icon: ExternalLink },
            { name: 'リシテア', href: 'http://10.1.1.161/Lysithea/login', icon: ExternalLink },
            { name: 'WEB申請', href: 'http://10.1.1.31:8080/workflow/Wfe_LoginAction.do', icon: ExternalLink },
            { name: '経費・旅費精算', href: 'http://10.1.1.158/eteam/seibu01/appl/', icon: ExternalLink },
        ]
    },
];

