'use client';
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import AuthBrandPanel from './AuthBrandPanel';

export default function AuthScreen() {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob-primary absolute -top-32 -left-32 w-96 h-96" />
        <div className="blob-violet absolute top-1/2 -right-32 w-80 h-80" />
        <div className="blob-cyan absolute bottom-0 left-1/3 w-64 h-64" />
      </div>

      {/* Brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative">
        <AuthBrandPanel />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">L</span>
            </div>
            <span className="font-display font-bold text-xl gradient-text">LearnIQ</span>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl shadow-glass border border-border overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-border">
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={`tab-${t}`}
                  onClick={() => setTab(t)}
                  className={`
                    flex-1 py-4 text-sm font-semibold font-display transition-all duration-200
                    ${tab === t
                      ? 'text-primary border-b-2 border-primary bg-primary/5' :'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {t === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <div className="p-8">
              <div className="animate-fade-in" key={tab}>
                {tab === 'login' ? (
                  <LoginForm onSwitchToRegister={() => setTab('register')} />
                ) : (
                  <RegisterForm onSwitchToLogin={() => setTab('login')} />
                )}
              </div>
            </div>
          </div>

          {/* Demo credentials box */}
          <DemoCredentials onAutofill={(email, password) => {
            // Emit autofill event — LoginForm listens
            window.dispatchEvent(new CustomEvent('learniq:autofill', { detail: { email, password } }));
            setTab('login');
          }} />
        </div>
      </div>
    </div>
  );
}

interface DemoCredentialsProps {
  onAutofill: (email: string, password: string) => void;
}

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'arjun.sharma@learniq.app', password: 'StudyHard@2026' },
  { role: 'Professional', email: 'priya.mehta@learniq.app', password: 'PrepPro@2026' },
];

function DemoCredentials({ onAutofill }: DemoCredentialsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="mt-4 glass-card rounded-xl border border-border p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Demo Accounts</p>
      <div className="space-y-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <div key={`demo-${acc.role}`} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-xs font-semibold text-primary w-20 flex-shrink-0">{acc.role}</span>
            <span className="text-xs text-muted-foreground flex-1 truncate font-mono">{acc.email}</span>
            <button
              onClick={() => handleCopy(acc.email, `email-${acc.role}`)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              aria-label={`Copy ${acc.role} email`}
            >
              {copied === `email-${acc.role}` ? '✓' : '⎘'}
            </button>
            <button
              onClick={() => onAutofill(acc.email, acc.password)}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded bg-primary/10 hover:bg-primary/20"
            >
              Use
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}