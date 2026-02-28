import React from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import auth from '@/auth';
import { redirect } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
