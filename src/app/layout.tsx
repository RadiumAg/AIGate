import type { Metadata } from 'next';
import Script from 'next/script';
import { TRPCProvider } from '../components/trpc-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIGate - AI 网关管理后台',
  description: '智能 AI 网关管理系统，支持配额控制和多模型代理',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === 'development' && (
          <Script src="//unpkg.com/@react-grab/mcp/dist/client.global.js" strategy="lazyOnload" />
        )}
      </head>
      <body>
        {/* {process.env.NODE_ENV === 'development' && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" crossOrigin="anonymous" />
        )} */}
        <Toaster />
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
