'use client';
import React from 'react';
import { FileText, Brain, Mic, MessageSquare, Clock } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import type { StatusVariant } from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';


interface ActivityItem {
  id: string;
  type: 'document' | 'quiz' | 'interview' | 'chat';
  title: string;
  detail: string;
  time: string;
  status: StatusVariant;
}

const ACTIVITY: ActivityItem[] = [
  { id: 'act-001', type: 'document', title: 'OS_Concepts_Notes.pdf', detail: 'Uploaded · 48 pages', time: '2h ago', status: 'ready' },
  { id: 'act-002', type: 'quiz', title: 'System Design Quiz', detail: 'Score: 82% · 15 questions', time: '4h ago', status: 'completed' },
  { id: 'act-003', type: 'document', title: 'Networking_Fundamentals.pdf', detail: 'Extracting text…', time: '5h ago', status: 'processing' },
  { id: 'act-004', type: 'interview', title: 'Backend Engineer Interview', detail: 'Score: 68/100 · Google SWE L4', time: 'Yesterday', status: 'completed' },
  { id: 'act-005', type: 'chat', title: 'Asked about TCP/IP handshake', detail: 'From Networking_Fundamentals.pdf', time: 'Yesterday', status: 'active' },
  { id: 'act-006', type: 'quiz', title: 'Algorithms & Data Structures', detail: 'Score: 61% · 20 questions', time: '2 days ago', status: 'completed' },
];

const TYPE_ICONS = {
  document: FileText,
  quiz: Brain,
  interview: Mic,
  chat: MessageSquare,
};

const TYPE_BG = {
  document: 'bg-cyan-500/15 text-cyan-400',
  quiz: 'bg-primary/15 text-primary',
  interview: 'bg-violet-500/15 text-violet-400',
  chat: 'bg-emerald-500/15 text-emerald-400',
};

export default function RecentActivity() {
  return (
    <div className="glass-card rounded-2xl border border-border">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h3 className="font-display font-semibold text-foreground">Recent Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your latest study sessions and uploads</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={13} />
          <span>Updated just now</span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {ACTIVITY.map((item) => {
          const Icon = TYPE_ICONS[item.type];
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${TYPE_BG[item.type]}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.detail}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={item.status} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}