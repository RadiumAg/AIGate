import type { Metadata } from 'next';
import { TRPCProvider } from '../components/TRPCProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIGate - AI 网关管理后台',
  description: '智能 AI 网关管理系统，支持配额控制和多模型代理',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
