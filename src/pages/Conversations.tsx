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