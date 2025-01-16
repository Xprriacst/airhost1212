import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Zap } from 'lucide-react';
import { conversationService } from '../services';
import { propertyService } from '../services/airtable/propertyService';
import { aiService } from '../services/ai/aiService';
import type { Conversation, Message, Property } from '../types';

const ConversationDetail: React.FC = () => {
  const { conversationId, propertyId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [generatingResponse, setGeneratingResponse] = useState(false);

  // Récupérer la conversation
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId) return;
      try {
        const data = await conversationService.fetchConversationById(conversationId);
        setConversation(data);
        setIsAutoPilot(data.autoPilot || false);
      } catch (err) {
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [conversationId]);

  // Récupérer la propriété
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return;
      try {
        const data = await propertyService.fetchPropertyById(propertyId);
        setProperty(data);
      } catch (err) {
        console.error('Error fetching property:', err);
      }
    };
    fetchProperty();
  }, [propertyId]);

  // Réinitialiser le compteur de messages non lus quand la conversation est chargée
  useEffect(() => {
    const resetUnreadCount = async () => {
      if (!conversationId || !conversation) return;
      try {
        await conversationService.markConversationAsRead(conversationId);
        // Mise à jour locale du compteur
        setConversation(prev => prev ? { ...prev, unreadCount: 0 } : prev);
      } catch (err) {
        console.error('Error resetting unread count:', err);
      }
    };

    resetUnreadCount();
  }, [conversationId, conversation?.id]); // Se déclenche uniquement quand la conversation change

  // Scroll au chargement initial
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversation?.messages]);

  // Rafraîchir la conversation toutes les 5 secondes
  useEffect(() => {
    if (!conversationId) return;

    const refreshConversation = async () => {
      try {
        const data = await conversationService.fetchConversationById(conversationId);
        setConversation(prev => {
          // Ne mettre à jour que si les messages ont changé
          if (prev && JSON.stringify(prev.messages) === JSON.stringify(data.messages)) {
            return prev;
          }
          return data;
        });
      } catch (err) {
        console.error('Error refreshing conversation:', err);
      }
    };

    const intervalId = setInterval(refreshConversation, 5000);
    return () => clearInterval(intervalId);
  }, [conversationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageData: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      timestamp: new Date(),
      sender: 'host',
      type: 'text',
      status: 'pending',
    };

    try {
      if (!conversation || !conversation.guestPhone) {
        throw new Error('Missing conversation data');
      }

      // Mettre à jour l'interface immédiatement
      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, messageData],
        };
      });
      setNewMessage('');

      // Scroll vers le nouveau message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

      // Envoyer au backend
      await fetch('/.netlify/functions/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          message: messageData.text,
          guestPhone: conversation.guestPhone,
          isHost: true,
          conversationId,
        }),
      });

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleAutoPilotToggle = async () => {
    if (!conversationId || !conversation) return;
    
    try {
      // Mettre à jour l'interface immédiatement pour une meilleure réactivité
      const newAutoPilotState = !isAutoPilot;
      setIsAutoPilot(newAutoPilotState);
      
      // Mettre à jour dans la base de données
      await conversationService.updateConversation(conversationId, {
        'Auto Pilot': newAutoPilotState
      });
      
      // Mettre à jour l'état local de la conversation
      setConversation(prev => prev ? {
        ...prev,
        autoPilot: newAutoPilotState
      } : prev);
      
    } catch (error) {
      // En cas d'erreur, revenir à l'état précédent
      setIsAutoPilot(!isAutoPilot);
      console.error('Error updating Auto Pilot state:', error);
    }
  };

  const handleGenerateResponse = async () => {
    if (!conversation || !property || generatingResponse) {
      console.warn('Cannot generate response:', {
        hasConversation: !!conversation,
        hasProperty: !!property,
        isGenerating: generatingResponse
      });
      return;
    }
    
    try {
      setGeneratingResponse(true);
      
      // Récupérer le dernier message du client s'il existe
      const lastGuestMessage = [...conversation.messages]
        .reverse()
        .find(msg => msg.sender === 'guest');
        
      if (!lastGuestMessage) {
        console.warn('No guest message found to generate response for');
        return;
      }

      console.log('Generating response with context:', {
        property: property.name,
        lastMessage: lastGuestMessage.text,
        checkIn: conversation.checkIn,
        checkOut: conversation.checkOut
      });

      // Créer le contexte de réservation
      const bookingContext = {
        hasBooking: true,
        checkIn: conversation.checkIn,
        checkOut: conversation.checkOut,
        guestCount: conversation.guestCount || 1,
      };

      // Configuration de l'IA
      const aiConfig = {
        language: 'fr',
        tone: 'friendly' as const,
        shouldIncludeEmoji: true
      };

      // Générer la réponse
      const response = await aiService.generateResponse(
        lastGuestMessage,
        property,
        bookingContext,
        conversation.messages.slice(-10),
        aiConfig
      );

      console.log('AI response generated:', response);

      if (response) {
        setNewMessage(response);
      }
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setGeneratingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-50 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">
              {conversation?.guestName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-medium">{conversation?.guestName || 'Conversation'}</h2>
            <p className="text-xs text-gray-500">
              {conversation?.checkIn && new Date(conversation.checkIn).toLocaleDateString()}
              {' - '}
              {conversation?.checkOut && new Date(conversation.checkOut).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={handleAutoPilotToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            isAutoPilot
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Zap className={`w-4 h-4 ${isAutoPilot ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">
            {isAutoPilot ? 'Auto-pilot ON' : 'Auto-pilot OFF'}
          </span>
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 pb-4"
      >
        {conversation?.messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex ${message.sender === 'guest' ? 'justify-start' : 'justify-end'} mb-2`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                message.sender === 'guest'
                  ? 'bg-gray-100 text-gray-900 rounded-tl-sm'
                  : 'bg-blue-500 text-white rounded-tr-sm'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez un message..."
            className="flex-1 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleGenerateResponse}
            disabled={generatingResponse}
            className="p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConversationDetail;
