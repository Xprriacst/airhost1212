import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Zap } from 'lucide-react';
import { conversationService } from '../services';
import { propertyService } from '../services/airtable/propertyService';
import type { Conversation, Message, Property } from '../types';

const POLLING_INTERVAL = 3000;

// Message component
const Message = ({ message }: { message: Message }) => {
  const isGuest = message.sender === 'guest';

  return (
    <div className={`flex ${isGuest ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isGuest
            ? 'bg-gray-100 text-gray-900 rounded-tl-sm'
            : 'bg-blue-500 text-white rounded-tr-sm'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

const ConversationDetail: React.FC = () => {
  const { conversationId, propertyId } = useParams();
  const navigate = useNavigate();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<NodeJS.Timeout>();
  const skipPollingRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  // State
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      // Petit délai pour s'assurer que le DOM est bien mis à jour
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end',
        });
      }, 100);
    }
  }, []);

  // Détection du scroll (pour savoir si on est en bas)
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // On considère qu'on est en bas si on est à moins de 20px du fond
    const nearBottom = scrollHeight - scrollTop - clientHeight < 20;
    setIsAtBottom(nearBottom);
  }, []);

  // Récupère la conversation depuis le backend
  const fetchConversation = async () => {
    if (!conversationId || skipPollingRef.current) return;

    try {
      const data = await conversationService.fetchConversationById(conversationId);

      if (data.unreadCount > 0) {
        await conversationService.markConversationAsRead(conversationId);
      }

      setConversation(data);

      // Mettre à jour l'état autoPilot si pas de skip
      if (!skipPollingRef.current) {
        setIsAutoPilot(data.autoPilot || false);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  // Mise en place du polling
  useEffect(() => {
    fetchConversation();
    pollingRef.current = setInterval(fetchConversation, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [conversationId]);

  // Charge la propriété associée
  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId) return;
      try {
        const properties = await propertyService.getProperties();
        const foundProperty = properties.find((p) => p.id === propertyId);
        if (foundProperty) {
          setProperty(foundProperty);
        }
      } catch (err) {
        console.error('Error loading property:', err);
      }
    };
    loadProperty();
  }, [propertyId]);

  // Scrolle en bas si on est déjà en bas et qu'il y a de nouveaux messages
  useEffect(() => {
    if (!conversation?.messages) return;

    // Premier chargement
    if (!initialScrollDoneRef.current) {
      scrollToBottom(false); // Pas de smooth scroll au premier chargement
      initialScrollDoneRef.current = true;
      return;
    }

    // Si de nouveaux messages arrivent et qu'on était en bas, on scrolle
    if (conversation.messages.length > prevMessagesLengthRef.current && isAtBottom) {
      scrollToBottom(true);
    }

    prevMessagesLengthRef.current = conversation.messages.length;
  }, [conversation?.messages, isAtBottom, scrollToBottom]);

  // Écoute le scroll du conteneur
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Ajuste la hauteur du textarea automatiquement
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    };

    adjustHeight();
    textarea.addEventListener('input', adjustHeight);
    return () => textarea.removeEventListener('input', adjustHeight);
  }, [newMessage]);

  // Active/désactive l'auto-pilot
  const handleToggleAutoPilot = async () => {
    if (!conversation) return;
    const newState = !isAutoPilot;
    skipPollingRef.current = true;
    setIsAutoPilot(newState);

    try {
      const updatedConversation = await conversationService.updateConversation(
        conversation.id,
        { 'Auto Pilot': newState }
      );
      setConversation(updatedConversation);
    } catch (err) {
      console.error('Error toggling auto pilot:', err);
      setIsAutoPilot(!newState);
    } finally {
      // On évite de re-poller immédiatement pour ne pas écraser l'état
      setTimeout(() => {
        skipPollingRef.current = false;
      }, 1000);
    }
  };

  // Envoi d'un message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;

    try {
      if (!conversation || !conversation.guestPhone) {
        throw new Error('Missing conversation data');
      }

      // Message temporaire
      const messageData: Message = {
        id: tempId,
        text: newMessage.trim(),
        timestamp: new Date(),
        sender: 'host',
        type: 'text',
        status: 'pending',
      };

      // On met à jour localement les messages
      const updatedMessages = [...conversation.messages, messageData];
      setConversation((prev) => {
        if (!prev) return null;
        return { ...prev, messages: updatedMessages };
      });

      // Force le scroll en bas
      setTimeout(() => scrollToBottom(true), 100);

      // Reset du champ
      setNewMessage('');

      // Envoi au backend (fonction Netlify)
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

      // Ne pas re-fetch immédiatement pour éviter le flash
      // Le polling gère déjà la mise à jour
    } catch (error) {
      console.error('Error sending message:', error);
      // Si l'envoi échoue, on passe le message en "failed"
      setConversation((prev) => {
        if (!prev) return null;
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

  // Envoi via la touche Entrée (sans Shift)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Génération automatique d'une réponse via l'IA
  const handleGenerateResponse = async () => {
    if (!conversation || sending) return;

    setGenerating(true);
    try {
      const response = await fetch('/.netlify/functions/generate-ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          propertyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      setNewMessage(data.response);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Affichage en cours de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="min-h-[100dvh] p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  // Conversation introuvable
  if (!conversation) {
    return (
      <div className="min-h-[100dvh] p-6">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg">
          Conversation not found
        </div>
      </div>
    );
  }

  // Rendu principal
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
              {conversation.guestName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-medium">
              {conversation.guestName || 'Conversation'}
            </h2>
            <p className="text-xs text-gray-500">
              {conversation.checkIn &&
                new Date(conversation.checkIn).toLocaleDateString()}
              {' - '}
              {conversation.checkOut &&
                new Date(conversation.checkOut).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleAutoPilot}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
            isAutoPilot
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Zap
            className={`w-4 h-4 ${
              isAutoPilot ? 'text-blue-500' : 'text-gray-400'
            }`}
          />
          <span className="text-sm font-medium">
            {isAutoPilot ? 'Auto-pilot ON' : 'Auto-pilot OFF'}
          </span>
        </button>
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white"
        style={{ paddingBottom: '120px' }} // Espace pour la zone de saisie
      >
        <div className="px-4 space-y-1">
          {conversation.messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {/* Ancre pour scroller en bas */}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {generating && (
          <div className="flex items-center gap-2 text-gray-500 text-sm px-4 mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            L'IA est en train d'écrire...
          </div>
        )}
      </div>

      {/* Zone de saisie */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2">
        <div className="flex items-end gap-2">
          <div className="flex-1 min-h-[40px] max-h-[120px] flex items-end bg-white rounded-full border px-4 py-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              className="flex-1 bg-transparent border-none focus:outline-none resize-none max-h-[100px] py-1"
              rows={1}
              style={{ height: 24, maxHeight: 100 }}
            />
          </div>
          <button
            onClick={handleGenerateResponse}
            disabled={generating}
            className={`p-2 rounded-full ${
              generating
                ? 'bg-gray-100 text-gray-400'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;
