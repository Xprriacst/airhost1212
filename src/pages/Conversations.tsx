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

  useEffect(() => {
    // Fonction pour mettre à jour les conversations de manière optimisée
    const updateConversations = (newConversations: Conversation[]) => {
      // Vérifier si les données ont réellement changé
      const hasChanges = JSON.stringify(conversationsRef.current) !== JSON.stringify(newConversations);
      
      if (hasChanges) {
        // Mettre à jour la référence
        conversationsRef.current = newConversations;
        
        // Mettre à jour l'état React de manière optimisée
        setConversations(prev => {
          const updatedConversations = newConversations.map(newConv => {
            // Trouver la conversation existante
            const existingConv = prev.find(c => c.id === newConv.id);
            if (!existingConv) return newConv;

            // Ne mettre à jour que si nécessaire
            if (
              existingConv.messages.length !== newConv.messages.length ||
              existingConv.unreadCount !== newConv.unreadCount ||
              existingConv.autoPilot !== newConv.autoPilot
            ) {
              return newConv;
            }
            
            // Sinon, garder l'instance existante pour éviter un re-render inutile
            return existingConv;
          });

          return updatedConversations;
        });
      }
    };

    // Fonction pour récupérer les conversations
    const fetchConversations = async () => {
      try {
        let fetchedConversations;
        
        if (propertyId) {
          fetchedConversations = await conversationService.fetchPropertyConversations(propertyId);
        } else {
          fetchedConversations = await conversationService.fetchAllConversations();
        }
        
        // Trier les conversations
        fetchedConversations.sort((a, b) => {
          if (b.unreadCount !== a.unreadCount) {
            return b.unreadCount - a.unreadCount;
          }
          const aLastMessage = a.messages[a.messages.length - 1];
          const bLastMessage = b.messages[b.messages.length - 1];
          if (!aLastMessage || !bLastMessage) return 0;
          return new Date(bLastMessage.timestamp).getTime() - new Date(aLastMessage.timestamp).getTime();
        });

        // Mise à jour optimisée
        updateConversations(fetchedConversations);

        // Initialiser les états auto-pilot au premier chargement
        if (isInitialLoading) {
          const initialStates = fetchedConversations.reduce((acc, conv) => ({
            ...acc,
            [conv.id]: conv.autoPilot || false
          }), {});
          setAutoPilotStates(initialStates);
          setIsInitialLoading(false);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      }
    };

    // Premier chargement
    fetchConversations();

    // Mettre en place le polling
    const intervalId = setInterval(fetchConversations, 3000);

    return () => clearInterval(intervalId);
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
