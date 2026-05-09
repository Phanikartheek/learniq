'use client';
import React, { useState } from 'react';
import { Search, Plus, MessageSquare, ChevronRight } from 'lucide-react';
import type { Conversation } from './ragChatData';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function ConversationSidebar({ conversations, activeId, onSelect, onNew }: ConversationSidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground text-sm">Conversations</h2>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-95 transition-all duration-150"
          >
            <Plus size={13} />
            New
          </button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-input border border-border text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
            <MessageSquare size={24} className="text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`
                w-full text-left px-4 py-3 transition-all duration-150 group
                ${activeId === conv.id
                  ? 'bg-primary/10 border-r-2 border-primary' :'hover:bg-muted/40 border-r-2 border-transparent'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium leading-tight truncate flex-1 ${activeId === conv.id ? 'text-primary' : 'text-foreground'}`}>
                  {conv.title}
                </p>
                <ChevronRight size={13} className={`flex-shrink-0 mt-0.5 transition-colors ${activeId === conv.id ? 'text-primary' : 'text-muted-foreground/0 group-hover:text-muted-foreground/60'}`} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate leading-relaxed">{conv.lastMessage}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground/60">{conv.timestamp}</span>
                <span className="text-[10px] text-muted-foreground/60">{conv.messageCount} msgs</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}