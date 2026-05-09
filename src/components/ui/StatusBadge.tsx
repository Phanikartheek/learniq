import React from 'react';

export type StatusVariant =
  | 'ready' |'processing' |'pending' |'failed' |'active' |'completed' |'draft' |'new';

const STATUS_CONFIG: Record<StatusVariant, { label: string; classes: string; dotClass: string }> = {
  ready: { label: 'Ready', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dotClass: 'bg-emerald-400' },
  processing: { label: 'Processing', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/25', dotClass: 'bg-amber-400 animate-pulse' },
  pending: { label: 'Pending', classes: 'bg-slate-500/15 text-slate-400 border-slate-500/25', dotClass: 'bg-slate-400' },
  failed: { label: 'Failed', classes: 'bg-red-500/15 text-red-400 border-red-500/25', dotClass: 'bg-red-400' },
  active: { label: 'Active', classes: 'bg-primary/15 text-primary border-primary/25', dotClass: 'bg-primary animate-pulse' },
  completed: { label: 'Completed', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dotClass: 'bg-emerald-400' },
  draft: { label: 'Draft', classes: 'bg-slate-500/15 text-slate-400 border-slate-500/25', dotClass: 'bg-slate-400' },
  new: { label: 'New', classes: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25', dotClass: 'bg-cyan-400' },
};

interface StatusBadgeProps {
  status: StatusVariant;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, showDot = true, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium rounded-full border
      ${size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}
      ${config.classes}
    `}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotClass}`} />}
      {config.label}
    </span>
  );
}