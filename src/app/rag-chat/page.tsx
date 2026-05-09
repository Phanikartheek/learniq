import React from 'react';
import AppLayout from '@/components/AppLayout';
import RAGChatContent from './components/RAGChatContent';
import { ToastContainer } from '@/components/ui/Toast';

export default function RAGChatPage() {
  return (
    <AppLayout>
      <RAGChatContent />
      <ToastContainer />
    </AppLayout>
  );
}