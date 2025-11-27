import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import Sidebar from '@/components/layout/Sidebar';
import MainLayout from '@/components/layout/MainLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  preload: false,
});

export const metadata: Metadata = {
  title: 'SEグループウェア',
  description: 'Internal Groupware Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} ${notoSansJP.className}`}>
        <Sidebar />
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
