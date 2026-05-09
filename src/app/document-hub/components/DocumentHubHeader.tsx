import React from 'react';
import { FileText, BookOpen, Zap } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const STATS = [
  { id: 'stat-total', label: 'Total Documents', value: '8', icon: FileText, color: 'text-primary bg-primary/15' },
  { id: 'stat-ready', label: 'Ready for Q&A', value: '5', icon: BookOpen, color: 'text-emerald-400 bg-emerald-500/15' },
  { id: 'stat-processing', label: 'Processing', value: '2', icon: Zap, color: 'text-amber-400 bg-amber-500/15' },
];

export default function DocumentHubHeader() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground">Document Hub</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Upload your study materials — PDFs, notes, and slides — and make them available for AI-powered Q&A.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS?.map((s) => {
          const Icon = s?.icon;
          return (
            <div key={s?.id} className="glass-card-hover rounded-xl p-4 border border-border flex items-center gap-4">
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${s?.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-display font-bold text-2xl text-foreground tabular-nums">{s?.value}</p>
                <p className="text-xs text-muted-foreground">{s?.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}