'use client';
import React from 'react';
import { BookOpen, FileText, Hash, BarChart2, ChevronRight } from 'lucide-react';
import type { Citation, ChatMessage } from './ragChatData';

interface CitationPanelProps {
  activeCitation: Citation | null;
  messages: ChatMessage[];
  onCitationSelect: (c: Citation) => void;
}

function RelevanceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-primary tabular-nums w-9 text-right">{pct}%</span>
    </div>
  );
}

export default function CitationPanel({ activeCitation, messages, onCitationSelect }: CitationPanelProps) {
  const allCitations: Citation[] = messages
    .filter((m) => m.role === 'assistant' && m.citations)
    .flatMap((m) => m.citations ?? []);

  const uniqueCitations = allCitations.filter(
    (c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          <h3 className="font-display font-semibold text-foreground text-sm">Source Citations</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{uniqueCitations.length} reference{uniqueCitations.length !== 1 ? 's' : ''} in this conversation</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Active citation detail */}
        {activeCitation && (
          <div className="p-4 border-b border-border bg-primary/5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/15 flex-shrink-0">
                  <FileText size={13} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{activeCitation.docName.replace(/\.[^.]+$/, '')}</p>
                  <p className="text-[11px] text-muted-foreground">{activeCitation.section}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Hash size={11} />
                  <span>Page {activeCitation.page}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BarChart2 size={11} />
                  <span>Relevance</span>
                </div>
              </div>
              <RelevanceBar value={activeCitation.relevance} />
            </div>

            <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Excerpt</p>
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                &ldquo;{activeCitation.excerpt}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* All citations list */}
        {uniqueCitations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 px-5 text-center">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border">
              <BookOpen size={24} className="text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">No citations yet</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When the AI answers questions, it will cite the specific document sections it used. They&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1">All references</p>
            {uniqueCitations.map((cite) => (
              <button
                key={cite.id}
                onClick={() => onCitationSelect(cite)}
                className={`
                  w-full text-left p-3 rounded-xl border transition-all duration-150 group
                  ${activeCitation?.id === cite.id
                    ? 'bg-primary/10 border-primary/30' :'glass-card-hover border-border hover:border-primary/20'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText size={13} className="text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{cite.docName.replace(/\.[^.]+$/, '')}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cite.section}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground/70">p.{cite.page}</span>
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full"
                            style={{ width: `${Math.round(cite.relevance * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-primary tabular-nums">{Math.round(cite.relevance * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={13} className="text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}