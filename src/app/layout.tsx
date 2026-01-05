import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import Sidebar from '@/components/layout/Sidebar';
import MainLayout from '@/components/layout/MainLayout';
import ThemeInitializer from '@/components/common/ThemeInitializer';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import AuthGuard from '@/components/auth/AuthGuard';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  preload: false,
});

export const metadata: Metadata = {
  title: 'Sales Hub',
  description: 'Sales Hub Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeInitializer />
          <AuthGuard>
            <Sidebar />
            <MainLayout>
              {children}
            </MainLayout>
          </AuthGuard>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
