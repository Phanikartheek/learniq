'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Paperclip, ChevronRight, BookOpen, Sparkles, PanelLeftClose, PanelRightClose, FileText, X, ChevronDown,  } from 'lucide-react';
import type { ChatMessage, Citation, Conversation } from './ragChatData';
import type { SelectedDoc } from './ragChatData';
import { SUGGESTED_QUESTIONS } from './ragChatData';
import ChatMessageBubble from './ChatMessageBubble';
import { addToast } from '@/components/ui/Toast';

interface ChatPanelProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  selectedDocIds: string[];
  setSelectedDocIds: React.Dispatch<React.SetStateAction<string[]>>;
  availableDocs: SelectedDoc[];
  onCitationClick: (c: Citation) => void;
  activeCitation: Citation | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  citationPanelOpen: boolean;
  onToggleCitationPanel: () => void;
  conversations: Conversation[];
  activeConvId: string;
}

const AI_RESPONSES: string[] = [
  `The **CAP theorem** states that a distributed system can only guarantee two of three properties simultaneously:

- **Consistency (C):** Every read receives the most recent write or an error
- **Availability (A):** Every request receives a response (not necessarily the most recent data)
- **Partition tolerance (P):** The system continues operating despite network partitions

Since network partitions are unavoidable in real distributed systems, the practical choice is between **CP** (sacrifice availability — e.g., HBase, Zookeeper) and **AP** (sacrifice strong consistency — e.g., Cassandra, DynamoDB).

Modern systems often implement **eventual consistency** as a middle ground, using techniques like vector clocks, CRDTs, or quorum reads/writes to balance the trade-off.`,

  `**Database indexing** fundamentally changes how the query planner finds rows. Here's when to use each:

**B-Tree index (default):** Best for equality and range queries on high-cardinality columns. Use on columns that appear in WHERE, ORDER BY, or JOIN conditions.

**Composite index:** Index on (col_a, col_b). The leftmost prefix rule applies — a query on just col_b won't use this index. Use when you frequently filter by multiple columns together.

**Covering index:** A composite index that includes all columns a query needs. The engine never touches the main table — it satisfies the query entirely from the index. Dramatic speedup for read-heavy workloads.

**Partial index:** Index only a subset of rows (WHERE status = 'active'). Smaller and faster for queries that always include that filter condition.`,

  `React's **useMemo** and **useCallback** both memoize values to avoid expensive recalculations, but they serve different purposes:

\`useMemo\` memoizes the **result** of a computation:
\`\`\`js
const sorted = useMemo(() => items.sort(compareFn), [items]);
\`\`\`

\`useCallback\` memoizes the **function itself**:
\`\`\`js
const handleClick = useCallback(() => doSomething(id), [id]);
\`\`\`

Use \`useCallback\` when passing callbacks to child components wrapped in \`React.memo\` — otherwise the child re-renders every time the parent renders, even if the callback logic hasn't changed. Use \`useMemo\` for expensive computations like sorting, filtering, or deriving complex state.`,
];

let aiResponseIndex = 0;

function getNextAIResponse(): string {
  const resp = AI_RESPONSES[aiResponseIndex % AI_RESPONSES.length];
  aiResponseIndex++;
  return resp;
}

export default function ChatPanel({
  messages, setMessages,
  selectedDocIds, setSelectedDocIds,
  availableDocs,
  onCitationClick,
  activeCitation,
  sidebarOpen, onToggleSidebar,
  citationPanelOpen, onToggleCitationPanel,
  activeConvId,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [docSelectorOpen, setDocSelectorOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(messages.length === 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setShowSuggestions(messages.length === 0);
  }, [activeConvId, messages.length]);

  const selectedDocs = availableDocs.filter((d) => selectedDocIds.includes(d.id));

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (selectedDocIds.length === 0) {
      addToast({ type: 'warning', title: 'No documents selected', description: 'Select at least one document for the AI to reason over.' });
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowSuggestions(false);
    setIsStreaming(true);

    // Streaming placeholder
    const streamId = `msg-${Date.now()}-ai`;
    setMessages((prev) => [
      ...prev,
      { id: streamId, role: 'assistant', content: '', timestamp: '', isStreaming: true },
    ]);

    // BACKEND INTEGRATION: Replace with real RAG API call using axios with JWT interceptor
    // POST /api/chat { conversationId, message, documentIds }
    await new Promise((r) => setTimeout(r, 1400));

    const aiContent = getNextAIResponse();
    const aiCitations: Citation[] = selectedDocIds.slice(0, 1).map((docId, i) => {
      const doc = availableDocs.find((d) => d.id === docId);
      return {
        id: `cite-${Date.now()}-${i}`,
        docId,
        docName: doc?.name ?? 'Unknown',
        page: Math.floor(Math.random() * 80) + 10,
        section: `Chapter ${Math.floor(Math.random() * 8) + 1} — Key Concepts`,
        excerpt: 'This section covers the foundational concepts referenced in the AI response above, including definitions, trade-offs, and real-world application patterns.',
        relevance: 0.85 + Math.random() * 0.12,
      };
    });

    setMessages((prev) =>
      prev.map((m) =>
        m.id === streamId
          ? {
              ...m,
              content: aiContent,
              timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              citations: aiCitations,
              isStreaming: false,
            }
          : m
      )
    );
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border glass-card flex-shrink-0">
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label={sidebarOpen ? 'Hide conversation history' : 'Show conversation history'}
        >
          <PanelLeftClose size={16} className={sidebarOpen ? '' : 'rotate-180'} />
        </button>

        {/* Doc context bar */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-muted-foreground flex-shrink-0">Context:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedDocs.length === 0 ? (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                No documents selected
              </span>
            ) : (
              selectedDocs.map((doc) => (
                <span
                  key={`ctx-${doc.id}`}
                  className="flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full max-w-[160px]"
                >
                  <FileText size={10} className="flex-shrink-0" />
                  <span className="truncate">{doc.name.replace(/\.[^.]+$/, '')}</span>
                  <button
                    onClick={() => toggleDoc(doc.id)}
                    className="flex-shrink-0 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${doc.name} from context`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))
            )}
            <div className="relative">
              <button
                onClick={() => setDocSelectorOpen((p) => !p)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/50 border border-border px-2 py-0.5 rounded-full transition-colors"
              >
                <BookOpen size={10} />
                <span>Change docs</span>
                <ChevronDown size={10} className={`transition-transform ${docSelectorOpen ? 'rotate-180' : ''}`} />
              </button>
              {docSelectorOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 glass-card rounded-xl border border-border shadow-glass z-50 p-2 animate-scale-in">
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">Select documents</p>
                  {availableDocs.map((doc) => (
                    <label
                      key={`docsel-${doc.id}`}
                      className="flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.id)}
                        onChange={() => toggleDoc(doc.id)}
                        className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-ring"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.topic} · {doc.chunks} chunks</p>
                      </div>
                    </label>
                  ))}
                  <div className="pt-2 border-t border-border mt-1">
                    <button
                      onClick={() => setDocSelectorOpen(false)}
                      className="w-full py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onToggleCitationPanel}
          className="hidden xl:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label={citationPanelOpen ? 'Hide citation panel' : 'Show citation panel'}
        >
          <PanelRightClose size={16} className={citationPanelOpen ? '' : 'rotate-180'} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && showSuggestions && (
          <div className="flex flex-col items-center justify-center h-full py-16 space-y-8">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/25 flex items-center justify-center">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">Ask anything about your documents</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                The AI will search your selected documents, find the most relevant sections, and cite its sources so you can verify every answer.
              </p>
            </div>
            <div className="w-full max-w-lg space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">Suggested questions</p>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={`suggestion-${i}`}
                  onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  className="w-full text-left px-4 py-3 rounded-xl glass-card-hover border border-border text-sm text-muted-foreground hover:text-foreground transition-all duration-150 group"
                >
                  <span className="flex items-start gap-2">
                    <ChevronRight size={14} className="flex-shrink-0 mt-0.5 text-primary/60 group-hover:text-primary transition-colors" />
                    {q}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            onCitationClick={onCitationClick}
            activeCitationId={activeCitation?.id ?? null}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-border">
        <div className={`
          flex items-end gap-3 p-3 rounded-2xl border transition-all duration-200
          ${isStreaming ? 'border-primary/40 bg-primary/5' : 'border-border bg-input hover:border-border/80 focus-within:border-primary/50 focus-within:bg-primary/5'}
        `}>
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0 mb-0.5"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'AI is thinking…' : 'Ask a question about your documents… (Enter to send, Shift+Enter for new line)'}
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none resize-none max-h-32 leading-relaxed disabled:opacity-60"
            style={{ minHeight: '24px' }}
            aria-label="Chat message input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="
              flex-shrink-0 p-2 rounded-xl text-white
              bg-gradient-to-r from-primary to-accent
              hover:opacity-90 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
              transition-all duration-150
            "
            aria-label="Send message"
          >
            {isStreaming ? (
              <div className="flex items-center gap-0.5">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground/60 text-center mt-2">
          AI answers are grounded in your uploaded documents. Always verify critical information.
        </p>
      </div>
    </div>
  );
}