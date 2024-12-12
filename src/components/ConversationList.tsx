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

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  autoPilotStates,
  onSelectConversation,
  onToggleAutoPilot,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-600">
        {error}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conversation</h3>
        <p className="text-gray-500">Il n'y a pas encore de conversations.</p>
      </div>
    );
  }

  // Remove duplicates based on conversation ID
  const uniqueConversations = Array.from(
    new Map(conversations.map(conv => [conv.id, conv])).values()
  );

  return (
    <div className="space-y-4">
      {uniqueConversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isAutoPilot={autoPilotStates[conversation.id] || false}
          onToggleAutoPilot={onToggleAutoPilot}
          onClick={() => onSelectConversation(conversation)}
        />
      ))}
    </div>
  );
};

export default ConversationList;