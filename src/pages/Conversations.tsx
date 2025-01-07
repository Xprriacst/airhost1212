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
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 h-14 flex items-center flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Conversations</h1>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            {error}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>Aucune conversation</p>
          </div>
        ) : (
          <div className="divide-y">
            <ConversationList
              conversations={conversations}
              autoPilotStates={autoPilotStates}
              onSelectConversation={handleSelectConversation}
              onToggleAutoPilot={handleToggleAutoPilot}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const ConversationItem = ({ conversation, onClick }: { conversation: Conversation; onClick: () => void }) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const truncatedMessage = lastMessage?.text.length > 25 
    ? lastMessage.text.substring(0, 22) + "..."
    : lastMessage?.text;

  return (
    <div 
      onClick={onClick}
      className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer w-full"
    >
      {/* Avatar */}
      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-gray-600 text-lg font-medium">
          {conversation.guestName?.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 ml-3 mr-2">
        <div className="flex justify-between items-baseline">
          <h3 className="text-base font-medium text-gray-900 truncate max-w-[60%]">
            {conversation.guestName}
          </h3>
          <span className="text-sm text-gray-500 flex-shrink-0">
            {lastMessage?.timestamp ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {truncatedMessage}
        </p>
      </div>
    </div>
  );
};