'use client';
import React, { useState } from 'react';
import { Copy, Check, FileText, ExternalLink } from 'lucide-react';
import type { ChatMessage, Citation } from './ragChatData';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onCitationClick: (c: Citation) => void;
  activeCitationId: string | null;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      const content = line.slice(2, -2);
      result.push(
        <p key={`line-${i}`} className="font-semibold text-foreground mt-3 mb-1 first:mt-0">{content}</p>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      result.push(
        <ul key={`ul-${i}`} className="space-y-1 my-2 ml-3">
          {items.map((item, j) => (
            <li key={`li-${i}-${j}`} className="flex items-start gap-2 text-sm text-foreground/90">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-muted/60 text-primary text-xs font-mono">$1</code>') }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <div key={`code-${i}`} className="my-3 rounded-xl overflow-hidden border border-border">
          {lang && (
            <div className="px-4 py-2 bg-muted/60 border-b border-border">
              <span className="text-[11px] font-mono text-muted-foreground">{lang}</span>
            </div>
          )}
          <pre className="px-4 py-3 bg-muted/30 overflow-x-auto">
            <code className="text-xs font-mono text-foreground/90 leading-relaxed">
              {codeLines.join('\n')}
            </code>
          </pre>
        </div>
      );
    } else if (line.trim() === '') {
      result.push(<div key={`space-${i}`} className="h-1" />);
    } else {
      const html = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-muted/60 text-primary text-xs font-mono">$1</code>');
      result.push(
        <p key={`p-${i}`} className="text-sm text-foreground/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }} />
      );
    }
    i++;
  }
  return result;
}

export default function ChatMessageBubble({ message, onCitationClick, activeCitationId }: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[75%]">
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-accent text-white text-sm leading-relaxed">
            {message.content}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 text-right">{message.timestamp}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-slide-up">
      {/* AI avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mt-0.5">
        <span className="text-primary font-display font-bold text-xs">AI</span>
      </div>

      <div className="flex-1 min-w-0">
        {message.isStreaming ? (
          <div className="px-4 py-3 glass-card rounded-2xl rounded-tl-sm border border-border">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot w-2 h-2 rounded-full bg-primary" />
              <span className="typing-dot w-2 h-2 rounded-full bg-primary" />
              <span className="typing-dot w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground ml-1">Searching documents…</span>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-4 glass-card rounded-2xl rounded-tl-sm border border-border group">
              {/* Content */}
              <div className="space-y-0.5">
                {renderMarkdown(message.content)}
              </div>

              {/* Citations */}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {message.citations.map((cite) => (
                      <button
                        key={cite.id}
                        onClick={() => onCitationClick(cite)}
                        className={`
                          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                          ${activeCitationId === cite.id
                            ? 'bg-primary/20 border-primary/40 text-primary' :'bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/10'
                          }
                        `}
                        aria-label={`View source: ${cite.docName}, page ${cite.page}`}
                      >
                        <FileText size={11} />
                        <span className="truncate max-w-[120px]">{cite.docName.replace(/\.[^.]+$/, '')}</span>
                        <span className="text-[10px] opacity-70">p.{cite.page}</span>
                        <ExternalLink size={9} className="flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[11px] text-muted-foreground">{message.timestamp}</p>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy AI response to clipboard"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}