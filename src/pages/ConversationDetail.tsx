import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Zap, X } from 'lucide-react';
import { conversationService } from '../services';
import { propertyService } from '../services/airtable/propertyService';
import { aiService } from '../services/ai/aiService';
import type { Conversation, Message, Property } from '../types';
import { AlertTriangle, Clock, Package, Wrench } from 'lucide-react';
import EmergencyAlert from '../components/EmergencyAlert';
import { useAuthStore } from '../stores/authStore';

const ConversationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId, propertyId } = useParams<{ conversationId: string; propertyId: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [textareaLines, setTextareaLines] = useState(1);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const user = useAuthStore(state => state.user);

  // Récupérer la conversation
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !user?.id) {
        console.error('Missing conversationId or userId:', { conversationId, userId: user?.id });
        setError('Conversation introuvable');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching conversation:', conversationId);
        const data = await conversationService.fetchConversationById(user.id, conversationId);
        console.log('Conversation loaded:', data);
        setConversation(data);
        setIsAutoPilot(data.autoPilot || false);
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Impossible de charger la conversation');
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [conversationId, user?.id]);

  // Récupérer la propriété
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        console.error('Missing propertyId');
        return;
      }
      try {
        console.log('Fetching property:', propertyId);
        const data = await propertyService.fetchPropertyById(propertyId);
        console.log('Property loaded:', data);
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
  }, [conversationId, conversation?.id]);

  // Scroll au chargement initial
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversation?.messages]);

  // Rafraîchir la conversation toutes les 5 secondes
  useEffect(() => {
    const refreshConversation = async () => {
      if (!conversationId || !user?.id) {
        console.error('Missing conversationId or userId for refresh');
        return;
      }
      try {
        const data = await conversationService.fetchConversationById(user.id, conversationId);
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
  }, [conversationId, user?.id]);

  // Mise à jour de l'état auto-pilot quand la conversation change
  useEffect(() => {
    if (conversation?.autoPilot !== undefined) {
      setIsAutoPilot(conversation.autoPilot);
    }
  }, [conversation?.autoPilot]);

  // Afficher une notification quand l'auto-pilot change
  useEffect(() => {
    if (conversation?.messages?.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage.emergencyTags?.length > 0 && !isAutoPilot) {
        // Afficher une notification toast ou une alerte
        alert('Auto-pilot désactivé à cause d\'une urgence détectée');
      }
    }
  }, [isAutoPilot, conversation?.messages]);

  // Ajuste la hauteur du textarea au fur et à mesure
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      
      // Calculer le nombre de lignes
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight || '20');
      const paddingY = 16; // 2 * 8px (py-2)
      const lines = Math.ceil((textarea.scrollHeight - paddingY) / lineHeight);
      setTextareaLines(lines);

      // Limiter à 4 lignes avec scroll
      const maxHeight = (lineHeight * 4) + paddingY;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = lines > 4 ? 'auto' : 'hidden';
    };

    adjustHeight();
    textarea.addEventListener('input', adjustHeight);
    return () => textarea.removeEventListener('input', adjustHeight);
  }, [newMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;

    try {
      if (!conversation || !conversation.guestPhone) {
        throw new Error('Missing conversation data');
      }

      // Message "temporaire"
      const messageData: Message = {
        id: tempId,
        text: newMessage.trim(),
        timestamp: new Date(),
        sender: 'host',
        type: 'text',
        status: 'pending',
      };

      // On l'ajoute tout de suite localement
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, messageData],
        };
      });

      // Réinitialiser le textarea
      setNewMessage('');
      setTextareaLines(1);
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = '40px';
        textarea.style.overflowY = 'hidden';
      }

      // Envoi au backend
      const response = await fetch('/.netlify/functions/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          message: messageData.text,
          guestPhone: conversation.guestPhone,
          isHost: true,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // On re-fetch la conversation pour voir le message "officiel"
      await fetchConversation();
    } catch (error) {
      console.error('Error sending message:', error);
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === tempId ? { ...msg, status: 'failed' } : msg
          ),
        };
      });
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

  const handleDismissAlert = (tag: string) => {
    setDismissedAlerts(prev => new Set([...prev, tag]));
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
      {/* Header fixé */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-white border-b z-50">
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
            <h2 className="font-medium">
              {conversation?.guestName || conversation?.guestEmail?.split('@')[0] || 'Conversation'}
            </h2>
            <p className="text-xs text-gray-500">
              {conversation?.propertyName || conversation?.property?.name}
              {conversation?.checkIn && (
                <>
                  <span className="mx-1">•</span>
                  {new Date(conversation.checkIn).toLocaleDateString()} - {conversation?.checkOut && new Date(conversation.checkOut).toLocaleDateString()}
                </>
              )}
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
            AI {isAutoPilot ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Espacement pour le header fixe */}
      <div className="h-[72px]" />

      {/* Alert d'urgence */}
      {conversation?.messages?.length > 0 && 
       conversation.messages[conversation.messages.length - 1].emergencyTags
         ?.filter(tag => !dismissedAlerts.has(tag))
         .map(tag => (
           <EmergencyAlert 
             key={tag} 
             tag={tag} 
             onClose={() => handleDismissAlert(tag)}
           />
      ))}

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
      <div className="bg-white border-t px-4 py-2">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Tapez votre message..."
            rows={1}
            className={`flex-1 resize-none py-2 px-4 border border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[40px] bg-transparent transition-all duration-200 ${
              textareaLines === 1
                ? 'rounded-full'
                : textareaLines === 2
                ? 'rounded-2xl'
                : textareaLines === 3
                ? 'rounded-xl'
                : 'rounded-lg'
            }`}
            style={{ 
              height: 40,
              maxHeight: textareaLines > 4 ? '100px' : 'none',
              lineHeight: '20px'
            }}
          />
          <button
            type="button"
            onClick={handleGenerateResponse}
            disabled={generatingResponse}
            className="p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 h-[40px] w-[40px] flex items-center justify-center flex-shrink-0"
          >
            <Sparkles className="w-5 h-5" />
          </button>
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
