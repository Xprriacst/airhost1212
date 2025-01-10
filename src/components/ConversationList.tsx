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
  // Force re-render when conversations change
  const [, forceUpdate] = React.useState({});
  
  React.useEffect(() => {
    // Force a re-render when conversations change
    forceUpdate({});
  }, [conversations]);

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
              <span className={`font-medium ${conversation.unreadCount > 0 ? 'font-semibold text-black' : 'text-gray-900'}`}>
                {conversation.guestName}
              </span>
              <div className="flex items-center gap-2">
                {conversation.unreadCount > 0 && (
                  <div className="bg-green-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs px-1.5">
                    {conversation.unreadCount}
                  </div>
                )}
                <span className="text-xs text-gray-500">
                  {formatTimestamp(conversation.messages[conversation.messages.length - 1]?.timestamp)}
                </span>
              </div>
            </div>
            <div className={`mt-0.5 text-sm truncate ${conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {conversation.messages[conversation.messages.length - 1]?.text || 'Aucun message'}
            </div>
          </div>

          {/* Auto-pilot button */}
          <div className="flex items-center">
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