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

const formatTimestamp = (timestamp: Date | undefined) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  // Si c'est aujourd'hui, afficher l'heure
  if (diff < oneDay) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  
  // Si c'est hier
  if (diff < oneDay * 2) {
    return 'Hier';
  }
  
  // Sinon afficher la date
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

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
          className="flex items-center gap-4 p-4 hover:bg-gray-100 cursor-pointer"
          onClick={() => onSelectConversation(conversation)}
        >
          {/* Avatar circle */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-lg font-medium">
                {conversation.guestName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Message content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${conversation.unreadCount > 0 ? 'font-semibold text-black' : 'text-gray-900'}`}>
                  {conversation.guestName}
                </span>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAutoPilot(conversation.id);
                  }}
                  className={`px-2 py-0.5 text-xs rounded-full border ${
                    autoPilotStates[conversation.id] 
                      ? 'bg-blue-50 text-blue-600 border-blue-200' 
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  Auto-Pilot
                </div>
              </div>
              <div className="flex items-center gap-1">
                {conversation.unreadCount > 0 && (
                  <div className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {conversation.unreadCount}
                  </div>
                )}
                <span className="text-xs text-gray-500 ml-1">
                  {formatTimestamp(conversation.messages[conversation.messages.length - 1]?.timestamp)}
                </span>
              </div>
            </div>
            <div className={`mt-0.5 text-sm truncate ${conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
              {conversation.messages[conversation.messages.length - 1]?.text || 'Aucun message'}
            </div>
          </div>

          {/* Empty div to replace old Auto-pilot button */}
          <div className="flex items-center">
          </div>
        </div>
      ))}
    </div>
  );
}