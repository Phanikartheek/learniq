import React from 'react';
import AuthScreen from './components/AuthScreen';
import { ToastContainer } from '@/components/ui/Toast';

export default function SignUpLoginPage() {
  return (
    <>
      <AuthScreen />
      <ToastContainer />
    </>
  );
}