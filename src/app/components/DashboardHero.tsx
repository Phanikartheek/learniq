'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, MessageSquare, Brain, Mic, ArrowRight, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Icon from '@/components/ui/AppIcon';


const QUICK_ACTIONS = [
  { id: 'qa-upload', label: 'Upload Notes', icon: FileText, href: '/document-hub', color: 'from-primary/20 to-primary/5 border-primary/25 hover:border-primary/50', iconColor: 'text-primary' },
  { id: 'qa-chat', label: 'Ask AI', icon: MessageSquare, href: '/rag-chat', color: 'from-violet-500/20 to-violet-500/5 border-violet-500/25 hover:border-violet-500/50', iconColor: 'text-violet-400' },
  { id: 'qa-quiz', label: 'Take Quiz', icon: Brain, href: '/quiz-engine', color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/25 hover:border-cyan-500/50', iconColor: 'text-cyan-400' },
  { id: 'qa-interview', label: 'Mock Interview', icon: Mic, href: '/mock-interview', color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/50', iconColor: 'text-emerald-400' },
];

export default function DashboardHero() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')?.[0] ?? 'there';

  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date()?.getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">
            {greeting} 👋
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
            Welcome back, <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            You have 3 weak topics to review and 1 document still processing.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 self-start sm:self-auto">
          <Zap size={14} className="text-amber-400" />
          <span className="text-sm font-medium text-amber-300">Interview in 3 days</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS?.map((action) => {
          const Icon = action?.icon;
          return (
            <Link
              key={action?.id}
              href={action?.href}
              className={`
                flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-br
                transition-all duration-200 active:scale-95 group
                ${action?.color}
              `}
            >
              <div className={`p-2 rounded-lg bg-card/60 ${action?.iconColor}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{action?.label}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}