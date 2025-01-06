import React from 'react';
import { MessageSquare } from 'lucide-react';
import ConversationItem from './ConversationItem';
import type { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  autoPilotStates: Record<string, boolean>;
  onSelectConversation: (conversation: Conversation) => void;
  onToggleAutoPilot: (conversationId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function ConversationList({ 
  conversations, 
  autoPilotStates,
  onSelectConversation,
  onToggleAutoPilot,
  isLoading,
  error 
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
        <span>Une erreur est survenue</span>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-500 hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Aucune conversation
      </div>
    );
  }

  // Remove duplicates based on conversation ID
  const uniqueConversations = Array.from(
    new Map(conversations.map(conv => [conv.id, conv])).values()
  );

  return (
    <div className="divide-y">
      {uniqueConversations.map((conversation) => (
        <div 
          key={conversation.id}
          className="flex items-center gap-4 p-4 hover:bg-gray-100 cursor-pointer relative"
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${conversation.unreadCount > 0 ? 'font-bold' : ''}`}>
                {conversation.guestName}
              </span>
              {conversation.unreadCount > 0 && (
                <span className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-gray-500 truncate">
              {conversation.messages[conversation.messages.length - 1]?.text || 'Aucun message'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleAutoPilot(conversation.id);
              }}
              className={`p-2 rounded-lg ${
                autoPilotStates[conversation.id] 
                  ? 'text-blue-500 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={autoPilotStates[conversation.id] ? "Désactiver Auto-pilot" : "Activer Auto-pilot"}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}