'use client';
import React from 'react';
import { X, FileText, BookOpen, Hash, HardDrive, Calendar, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import type { StatusVariant } from '@/components/ui/StatusBadge';
import type { Document } from './documentData';
import Icon from '@/components/ui/AppIcon';


interface DocumentPreviewDrawerProps {
  doc: Document | null;
  onClose: () => void;
}

const STATUS_ICONS = {
  ready: CheckCircle,
  processing: Loader2,
  pending: Clock,
  failed: AlertCircle,
};

const STATUS_COLORS = {
  ready: 'text-emerald-400',
  processing: 'text-amber-400',
  pending: 'text-slate-400',
  failed: 'text-red-400',
};

export default function DocumentPreviewDrawer({ doc, onClose }: DocumentPreviewDrawerProps) {
  if (!doc) return null;

  const StatusIcon = STATUS_ICONS[doc.status];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 glass-card border-l border-border flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/15 flex-shrink-0 mt-0.5">
              <FileText size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground text-sm leading-tight break-all">{doc.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{doc.type} · {doc.topic}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex-shrink-0 ml-2"
            aria-label="Close document preview"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <StatusIcon
                size={16}
                className={`${STATUS_COLORS[doc.status]} ${doc.status === 'processing' ? 'animate-spin' : ''}`}
              />
              <span className="text-sm font-medium text-foreground">Processing Status</span>
            </div>
            <StatusBadge status={doc.status as StatusVariant} size="md" />
          </div>

          {doc.status === 'processing' && doc.progress !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Extraction progress</span>
                <span className="text-xs font-semibold text-amber-400 tabular-nums">{doc.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${doc.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Extracting text and building knowledge chunks…</p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'meta-pages', icon: BookOpen, label: 'Pages', value: doc.pages.toString() },
              { id: 'meta-size', icon: HardDrive, label: 'File size', value: doc.size },
              { id: 'meta-date', icon: Calendar, label: 'Uploaded', value: doc.uploadedAt },
              { id: 'meta-chunks', icon: Hash, label: 'Knowledge chunks', value: doc.chunks ? doc.chunks.toString() : '—' },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.id} className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon size={13} className="text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{m.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{m.value}</p>
                </div>
              );
            })}
          </div>

          {/* RAG readiness */}
          <div className={`p-4 rounded-xl border ${doc.ready ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/20 border-border'}`}>
            <div className="flex items-center gap-2 mb-1">
              {doc.ready
                ? <CheckCircle size={15} className="text-emerald-400" />
                : <Clock size={15} className="text-muted-foreground" />
              }
              <span className="text-sm font-semibold text-foreground">
                {doc.ready ? 'Ready for AI Q&A' : 'Not yet available for Q&A'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {doc.ready
                ? `This document has been split into ${doc.chunks} knowledge chunks and indexed for semantic search. You can now ask questions about it in RAG Chat.`
                : 'Once text extraction completes, this document will be available for AI-powered question answering and quiz generation.'
              }
            </p>
          </div>

          {/* Excerpt */}
          {doc.excerpt && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Content Overview</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{doc.excerpt}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {doc.ready && (
          <div className="p-6 border-t border-border">
            <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-95 transition-all duration-150">
              <BookOpen size={16} />
              Ask AI about this document
            </button>
          </div>
        )}
      </div>
    </>
  );
}