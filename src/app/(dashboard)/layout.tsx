import { ReactNode } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: DashboardLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
