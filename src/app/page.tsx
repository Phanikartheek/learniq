import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardHero from './components/DashboardHero';
import DashboardMetrics from './components/DashboardMetrics';
import DashboardCharts from './components/DashboardCharts';
import RecentActivity from './components/RecentActivity';
import { ToastContainer } from '@/components/ui/Toast';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="min-h-full bg-background bg-grid-pattern">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 py-8 space-y-8">
          <DashboardHero />
          <DashboardMetrics />
          <DashboardCharts />
          <RecentActivity />
        </div>
      </div>
      <ToastContainer />
    </AppLayout>
  );
}