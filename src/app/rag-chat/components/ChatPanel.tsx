'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, ChevronRight, BookOpen, Sparkles, PanelLeftClose, PanelRightClose, FileText, X, ChevronDown } from 'lucide-react';
import type { ChatMessage, Citation, Conversation } from './ragChatData';
import type { SelectedDoc } from './ragChatData';
import { SUGGESTED_QUESTIONS } from './ragChatData';
import ChatMessageBubble from './ChatMessageBubble';
import { addToast } from '@/components/ui/Toast';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';

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
  const [docSelectorOpen, setDocSelectorOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(messages.length === 0);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', true);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  // Update streaming message content in real-time
  useEffect(() => {
    if (streamingMsgId && response) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingMsgId
            ? { ...m, content: response, isStreaming: isLoading }
            : m
        )
      );
    }
  }, [response, isLoading, streamingMsgId, setMessages]);

  // Finalize message when streaming completes
  useEffect(() => {
    if (!isLoading && streamingMsgId && response) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingMsgId
            ? {
                ...m,
                content: response,
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                isStreaming: false,
              }
            : m
        )
      );
      setStreamingMsgId(null);
    }
  }, [isLoading, streamingMsgId, response, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setShowSuggestions(messages.length === 0);
  }, [activeConvId, messages.length]);

  const selectedDocs = availableDocs.filter((d) => selectedDocIds.includes(d.id));

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
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

    const streamId = `msg-${Date.now()}-ai`;
    setStreamingMsgId(streamId);
    setMessages((prev) => [
      ...prev,
      { id: streamId, role: 'assistant', content: '', timestamp: '', isStreaming: true },
    ]);

    // Build conversation history for multi-turn context
    const docContext = selectedDocs.map((d) => d.name).join(', ');
    const systemPrompt = `You are LearnIQ, an intelligent study assistant. The user is studying the following documents: ${docContext}. 
Answer questions based on these study materials. Provide detailed, educational responses with clear structure using markdown formatting. 
When referencing specific concepts, be precise and cite the relevant topic area. Help the student understand deeply, not just memorize.`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    sendMessage(apiMessages, { max_completion_tokens: 1500 });
  }, [input, isLoading, selectedDocIds, selectedDocs, messages, setMessages, sendMessage]);

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
          ${isLoading ? 'border-primary/40 bg-primary/5' : 'border-border bg-input hover:border-border/80 focus-within:border-primary/50 focus-within:bg-primary/5'}
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
            placeholder={isLoading ? 'AI is thinking…' : 'Ask a question about your documents… (Enter to send, Shift+Enter for new line)'}
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none resize-none max-h-32 leading-relaxed disabled:opacity-60"
            style={{ minHeight: '24px' }}
            aria-label="Chat message input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="
              flex-shrink-0 p-2 rounded-xl text-white
              bg-gradient-to-r from-primary to-accent
              hover:opacity-90 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
              transition-all duration-150
            "
            aria-label="Send message"
          >
            {isLoading ? (
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
          Powered by OpenAI · Answers grounded in your uploaded documents. Always verify critical information.
        </p>
      </div>
    </div>
  );
}