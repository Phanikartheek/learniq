'use client';
import React, { useState } from 'react';
import ConversationSidebar from './ConversationSidebar';
import ChatPanel from './ChatPanel';
import CitationPanel from './CitationPanel';
import type { ChatMessage, Conversation, Citation } from './ragChatData';
import { MOCK_CONVERSATIONS, INITIAL_MESSAGES, AVAILABLE_DOCS } from './ragChatData';

export default function RAGChatContent() {
  const [activeConvId, setActiveConvId] = useState<string>('conv-001');
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(['doc-001']);
  const [citationPanelOpen, setCitationPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New conversation',
      lastMessage: 'Ask anything about your documents…',
      timestamp: 'Just now',
      docIds: selectedDocIds,
      messageCount: 0,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setMessages([]);
    setActiveCitation(null);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    if (id === 'conv-001') {
      setMessages(INITIAL_MESSAGES);
    } else {
      setMessages([]);
    }
    setActiveCitation(null);
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Conversation history sidebar */}
      <div className={`
        flex-shrink-0 border-r border-border transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}
        hidden lg:block
      `}>
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
        />
      </div>

      {/* Main chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatPanel
          messages={messages}
          setMessages={setMessages}
          selectedDocIds={selectedDocIds}
          setSelectedDocIds={setSelectedDocIds}
          availableDocs={AVAILABLE_DOCS}
          onCitationClick={setActiveCitation}
          activeCitation={activeCitation}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((p) => !p)}
          citationPanelOpen={citationPanelOpen}
          onToggleCitationPanel={() => setCitationPanelOpen((p) => !p)}
          conversations={conversations}
          activeConvId={activeConvId}
        />
      </div>

      {/* Citation panel */}
      <div className={`
        flex-shrink-0 border-l border-border transition-all duration-300 ease-in-out
        ${citationPanelOpen ? 'w-80' : 'w-0 overflow-hidden'}
        hidden xl:block
      `}>
        <CitationPanel
          activeCitation={activeCitation}
          messages={messages}
          onCitationSelect={setActiveCitation}
        />
      </div>
    </div>
  );
}