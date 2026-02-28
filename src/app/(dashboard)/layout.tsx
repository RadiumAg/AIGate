import React from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { getServerSession } from '@/auth';
import { redirect } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: DashboardLayoutProps) {
  const session = await getServerSession();
  console.log(session);

  if (!session) {
    redirect('/login');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
