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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [textareaLines, setTextareaLines] = useState(1);

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
      if (!conversation?.propertyId) return;
      try {
        const data = await propertyService.fetchPropertyById(conversation.propertyId);
        setProperty(data);
      } catch (err) {
        console.error('Error fetching property:', err);
      }
    };
    fetchProperty();
  }, [conversation?.propertyId]);

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

  // Calculer le nombre de lignes dans le textarea
  const calculateLines = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const previousHeight = textarea.style.height;
    textarea.style.height = 'auto';
    
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const scrollHeight = textarea.scrollHeight;
    const numberOfLines = Math.floor(scrollHeight / lineHeight);
    
    textarea.style.height = previousHeight;
    setTextareaLines(numberOfLines);
    
    return numberOfLines;
  };

  // Ajuster la hauteur du textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const lines = calculateLines();
    
    if (lines <= 4) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    } else {
      // Fixer la hauteur à 4 lignes et activer le scroll
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      textarea.style.height = `${lineHeight * 4}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const messageData: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        timestamp: new Date(),
        sender: 'host',
        type: 'text',
        status: 'pending',
      };

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
      adjustTextareaHeight();

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
    <div className="flex flex-col h-[100dvh]">
      {/* En-tête fixe */}
      <div className="flex-none bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/conversations')}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-medium">{conversation?.guestName}</h2>
            <p className="text-sm text-gray-500">
              {conversation?.checkIn && `Check-in: ${new Date(conversation.checkIn).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Zone de messages scrollable */}
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

      {/* Zone de saisie */}
      <div className="flex-none bg-white border-t p-2">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Tapez votre message..."
            rows={1}
            className={`flex-1 resize-none py-2 px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all ${
              textareaLines === 1
                ? 'rounded-full min-h-[40px]'
                : textareaLines === 2
                ? 'rounded-2xl min-h-[60px]'
                : textareaLines === 3
                ? 'rounded-xl min-h-[80px]'
                : 'rounded-lg min-h-[100px] max-h-[100px] overflow-y-auto'
            }`}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 h-[40px] w-[40px] flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConversationDetail;
