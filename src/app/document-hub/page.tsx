import React from 'react';
import AppLayout from '@/components/AppLayout';
import DocumentHubContent from './components/DocumentHubContent';
import { ToastContainer } from '@/components/ui/Toast';

export default function DocumentHubPage() {
  return (
    <AppLayout>
      <div className="min-h-full bg-background bg-grid-pattern">
        <DocumentHubContent />
      </div>
      <ToastContainer />
    </AppLayout>
  );
}