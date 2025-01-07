import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ConversationList from '../components/ConversationList';
import { conversationService } from '../services';
import type { Conversation } from '../types';

export default function Conversations() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [autoPilotStates, setAutoPilotStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        let fetchedConversations;
        
        if (propertyId) {
          // Fetch conversations for specific property
          fetchedConversations = await conversationService.fetchPropertyConversations(propertyId);
        } else {
          // Fetch all conversations
          fetchedConversations = await conversationService.fetchAllConversations();
        }
        
        setConversations(fetchedConversations);

        // Initialize auto-pilot states
        const initialStates = fetchedConversations.reduce((acc, conv) => ({
          ...acc,
          [conv.id]: false
        }), {});
        setAutoPilotStates(initialStates);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();

    // Rafraîchir les conversations toutes les 5 secondes
    const interval = setInterval(fetchConversations, 5000);

    return () => clearInterval(interval);
  }, [propertyId]);

  const handleSelectConversation = (conversation: Conversation) => {
    navigate(`/properties/${conversation.propertyId}/conversations/${conversation.id}`);
  };

  const handleToggleAutoPilot = (conversationId: string) => {
    setAutoPilotStates(prev => ({
      ...prev,
      [conversationId]: !prev[conversationId]
    }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList
          conversations={conversations}
          autoPilotStates={autoPilotStates}
          onSelectConversation={handleSelectConversation}
          onToggleAutoPilot={handleToggleAutoPilot}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}

const ConversationItem = ({ conversation, onClick }: { conversation: Conversation; onClick: () => void }) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  
  return (
    <div 
      onClick={onClick}
      className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-gray-600 text-lg font-medium">
            {conversation.guestName.charAt(0).toUpperCase()}
          </span>
        </div>
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
            {conversation.unreadCount}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 ml-3">
        <div className="flex justify-between items-baseline">
          <h3 className="text-base font-semibold text-gray-900 truncate pr-2">
            {conversation.guestName}
          </h3>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {lastMessage ? formatTimestamp(lastMessage.timestamp) : ''}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">
          {lastMessage ? lastMessage.text : 'Aucun message'}
        </p>
      </div>
    </div>
  );
};