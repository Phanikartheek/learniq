'use client';
import React from 'react';
import { TrendingUp, TrendingDown, FileText, Brain, Mic, AlertTriangle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const METRICS = [
  {
    id: 'metric-quiz-avg',
    label: 'Avg. Quiz Score',
    value: '74%',
    change: '+8%',
    trend: 'up',
    sub: 'vs last week',
    icon: Brain,
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    accent: 'border-primary/20',
  },
  {
    id: 'metric-docs',
    label: 'Documents Ready',
    value: '6 / 8',
    change: '2 processing',
    trend: 'neutral',
    sub: 'for RAG Q&A',
    icon: FileText,
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    accent: 'border-cyan-500/20',
  },
  {
    id: 'metric-interview',
    label: 'Last Interview Score',
    value: '68 / 100',
    change: '-4pts',
    trend: 'down',
    sub: 'System Design round',
    icon: Mic,
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    accent: 'border-red-500/20',
  },
  {
    id: 'metric-weak',
    label: 'Weak Topics',
    value: '3',
    change: 'Need review',
    trend: 'warn',
    sub: 'below 60% accuracy',
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    accent: 'border-amber-500/20',
  },
];

export default function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {METRICS?.map((m) => {
        const Icon = m?.icon;
        return (
          <div key={m?.id} className={`glass-card-hover rounded-2xl p-5 border ${m?.accent}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${m?.iconBg}`}>
                <Icon size={20} className={m?.iconColor} />
              </div>
              {m?.trend === 'up' && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                  <TrendingUp size={13} /> {m?.change}
                </span>
              )}
              {m?.trend === 'down' && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-400">
                  <TrendingDown size={13} /> {m?.change}
                </span>
              )}
              {(m?.trend === 'neutral' || m?.trend === 'warn') && (
                <span className="text-xs font-medium text-amber-400">{m?.change}</span>
              )}
            </div>
            <p className="font-display text-3xl font-bold text-foreground tabular-nums">{m?.value}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{m?.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m?.sub}</p>
          </div>
        );
      })}
    </div>
  );
}