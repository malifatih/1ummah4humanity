'use client';

import { useState } from 'react';
import { Mail, Search, Edit, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import { api } from '@/lib/api-client';
import type { ApiResponse } from '@1ummah/shared';

interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  };
  unreadCount: number;
  updatedAt: string;
}

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () =>
      api.get<ApiResponse<Conversation[]>>('/api/v1/messages/conversations', { requireAuth: true }),
  });

  const conversations: Conversation[] = data?.data ?? [];

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(
        (c) =>
          c.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <div className="header-row">
            <h2>Messages</h2>
            <div className="header-actions">
              <button className="icon-btn" title="New message">
                <Edit size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="messages-layout">
          {/* Conversation List Panel */}
          <div className="conversations-panel">
            <div className="conversations-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search conversations"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="conversations-list">
              {isLoading && (
                <div className="loading-state">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton-convo">
                      <div className="skeleton-avatar" />
                      <div className="skeleton-content">
                        <div className="skeleton-line short" />
                        <div className="skeleton-line medium" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isError && (
                <div className="error-state-inline">
                  <p>{error instanceof Error ? error.message : 'Failed to load conversations'}</p>
                </div>
              )}

              {!isLoading && !isError && filteredConversations.length === 0 && (
                <div className="empty-conversations">
                  <Mail size={32} />
                  <p>{searchQuery ? 'No conversations found' : 'No messages yet'}</p>
                </div>
              )}

              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${selectedConversation === conversation.id ? 'selected' : ''} ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  {conversation.participant.avatarUrl ? (
                    <img
                      src={conversation.participant.avatarUrl}
                      alt={conversation.participant.displayName}
                      className="convo-avatar"
                    />
                  ) : (
                    <div className="convo-avatar-placeholder">
                      {conversation.participant.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="convo-info">
                    <div className="convo-header">
                      <div className="convo-name-row">
                        <span className="convo-name">{conversation.participant.displayName}</span>
                        {conversation.participant.isVerified && (
                          <span className="verified-badge">&#10003;</span>
                        )}
                        <span className="convo-handle">@{conversation.participant.username}</span>
                      </div>
                      {conversation.lastMessage && (
                        <span className="convo-time">
                          {formatDistanceToNowStrict(new Date(conversation.lastMessage.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="convo-preview">{conversation.lastMessage.content}</p>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">{conversation.unreadCount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message View Panel */}
          <div className="message-panel">
            {!selectedConversation ? (
              <div className="select-conversation-prompt">
                <MessageCircle size={56} />
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the left to start messaging, or start a new one.</p>
                <button className="btn-primary btn-new-message">
                  <Edit size={16} />
                  New message
                </button>
              </div>
            ) : (
              <div className="selected-placeholder">
                <p className="coming-soon">Chat view coming soon</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <RightSection />

      <style jsx>{`
        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0;
        }
        .header-row h2 {
          font-size: 1.25rem;
        }
        .header-actions {
          display: flex;
          gap: 0.5rem;
        }
        .icon-btn {
          background: none;
          border: none;
          color: var(--color-text-main);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .icon-btn:hover {
          background: hsla(210, 100%, 60%, 0.1);
          color: var(--color-brand);
        }
        .messages-layout {
          display: flex;
          height: calc(100vh - 65px);
        }
        .conversations-panel {
          width: 50%;
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .conversations-search {
          padding: 0.75rem;
          position: relative;
        }
        .search-input {
          width: 100%;
          padding: 0.6rem 1rem 0.6rem 2.25rem;
          border-radius: var(--radius-full);
          border: 1px solid transparent;
          background: var(--color-bg-card);
          color: var(--color-text-main);
          font-size: 0.85rem;
          transition: var(--transition-normal);
        }
        .search-input:focus {
          background: var(--color-bg);
          border-color: var(--color-brand);
          outline: none;
        }
        .conversations-list {
          flex: 1;
          overflow-y: auto;
        }
        .conversation-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid var(--color-border);
        }
        .conversation-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .conversation-item.selected {
          background: hsla(210, 100%, 60%, 0.08);
          border-right: 3px solid var(--color-brand);
        }
        .conversation-item.unread .convo-name,
        .conversation-item.unread .convo-preview {
          font-weight: 700;
        }
        .convo-avatar, .convo-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          flex-shrink: 0;
          object-fit: cover;
        }
        .convo-avatar-placeholder {
          background: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          font-size: 1.1rem;
        }
        .convo-info {
          flex: 1;
          min-width: 0;
        }
        .convo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .convo-name-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
        }
        .convo-name {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.95rem;
        }
        .verified-badge {
          background: var(--color-brand);
          color: white;
          border-radius: 50%;
          width: 15px;
          height: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          flex-shrink: 0;
        }
        .convo-handle {
          color: var(--color-text-muted);
          font-size: 0.85rem;
          white-space: nowrap;
        }
        .convo-time {
          color: var(--color-text-muted);
          font-size: 0.8rem;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .convo-preview {
          color: var(--color-text-muted);
          font-size: 0.85rem;
          margin-top: 0.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .unread-badge {
          background: var(--color-brand);
          color: white;
          border-radius: var(--radius-full);
          min-width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0 0.35rem;
          flex-shrink: 0;
          margin-top: 0.75rem;
        }
        .message-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .select-conversation-prompt {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-muted);
        }
        .select-conversation-prompt h3 {
          font-size: 1.5rem;
          color: var(--color-text-main);
          margin: 1rem 0 0.5rem;
        }
        .select-conversation-prompt p {
          max-width: 280px;
          margin: 0 auto 1.5rem;
          line-height: 1.4;
        }
        .btn-new-message {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-size: 0.95rem;
        }
        .selected-placeholder {
          text-align: center;
          color: var(--color-text-muted);
        }
        .coming-soon {
          font-size: 0.95rem;
        }
        .empty-conversations {
          text-align: center;
          padding: 3rem 1.5rem;
          color: var(--color-text-muted);
        }
        .empty-conversations p {
          margin-top: 0.75rem;
        }
        .error-state-inline {
          text-align: center;
          padding: 2rem 1rem;
          color: hsl(0, 80%, 60%);
        }
        .loading-state {
          padding: 0.5rem;
        }
        .skeleton-convo {
          display: flex;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .skeleton-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-bg-card);
          animation: pulse 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        .skeleton-content { flex: 1; }
        .skeleton-line {
          height: 14px;
          background: var(--color-bg-card);
          border-radius: 4px;
          margin-bottom: 0.5rem;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-line.short { width: 40%; }
        .skeleton-line.medium { width: 70%; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
