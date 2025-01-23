import React, { useState, useEffect, useRef } from 'react';
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Référence pour stocker la dernière version des conversations
  const conversationsRef = useRef<Conversation[]>([]);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Fonction pour mettre à jour les conversations de manière optimisée
    const updateConversations = (newConversations: Conversation[]) => {
      try {
        // Vérifier si les données ont réellement changé en comparant les propriétés importantes
        const hasChanges = newConversations.some((newConv, index) => {
          const currentConv = conversationsRef.current[index];
          if (!currentConv) return true;
          
          return (
            newConv.id !== currentConv.id ||
            newConv.propertyId !== currentConv.propertyId ||
            newConv['Guest Name'] !== currentConv['Guest Name'] ||
            newConv.UnreadCount !== currentConv.UnreadCount ||
            newConv['Auto Pilot'] !== currentConv['Auto Pilot'] ||
            JSON.stringify(newConv.Messages || []) !== JSON.stringify(currentConv.Messages || [])
          );
        });
        
        if (hasChanges) {
          // Mettre à jour la référence
          conversationsRef.current = newConversations;
          setConversations(newConversations);
        }
      } catch (error) {
        console.error('Error updating conversations:', error);
      }
    };

    // Fonction pour récupérer les conversations
    const fetchConversations = async () => {
      try {
        setIsInitialLoading(false);
        const data = propertyId 
          ? await conversationService.fetchPropertyConversations(propertyId)
          : await conversationService.fetchAllConversations();
        updateConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError(error instanceof Error ? error.message : 'Failed to load conversations');
      }
    };

    // Nettoyer le timeout précédent
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Définir un nouveau timeout pour le fetch
    fetchTimeoutRef.current = setTimeout(fetchConversations, 1000);

    // Cleanup function
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
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
        {isInitialLoading ? (
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
            <p className="text-gray-600 mt-2">
              Vous n'avez accès à aucune conversation pour le moment.
            </p>
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
