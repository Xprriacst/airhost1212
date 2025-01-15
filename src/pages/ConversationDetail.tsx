// src/pages/ConversationDetail.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Zap } from 'lucide-react';
import { conversationService } from '../services';
import { propertyService } from '../services/airtable/propertyService';
import type { Conversation, Message, Property } from '../types';

const POLLING_INTERVAL = 3000;

const ConversationDetail: React.FC = () => {
  const { conversationId, propertyId } = useParams();
  const navigate = useNavigate();

  // Refs DOM
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Référence pour le polling
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // États locaux
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Suivi de la position du scroll
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);

  // État pour l'Auto-pilot
  const [isAutoPilot, setIsAutoPilot] = useState(false);

  // **État additionnel pour les messages non lus**
  const [unreadCount, setUnreadCount] = useState<number>(0);

  /**
   * Fonction pour récupérer la conversation depuis le backend
   */
  const fetchConversation = async () => {
    if (!conversationId) return;
    try {
      const data = await conversationService.fetchConversationById(conversationId);
      
      setConversation((prev) => {
        if (prev) {
          return {
            ...prev,
            messages: data.messages,
            guestPhone: data.guestPhone,
            guestName: data.guestName,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            // Maintient l'état local de l'Auto-pilot
          };
        }
        // Pour le premier chargement, initialise l'état de l'Auto-pilot
        setIsAutoPilot(data.autoPilot || false);
        return data;
      });

      // **Mise à jour du compteur de messages non lus**
      setUnreadCount(data.unreadCount || 0);

      // **Marquer comme lu si il y a des messages non lus**
      if (data.unreadCount && data.unreadCount > 0) {
        await conversationService.markConversationAsRead(conversationId);
        setUnreadCount(0); // Réinitialise le compteur après marquage
      }

      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération de la conversation :', err);
      setError('Échec du chargement de la conversation');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fonction pour basculer l'Auto-pilot et mettre à jour Airtable
   */
  const handleToggleAutoPilot = async () => {
    const updatedState = !isAutoPilot;
    setIsAutoPilot(updatedState);

    if (!conversationId) return;
    try {
      await conversationService.updateConversation(conversationId, {
        'Auto Pilot': updatedState,
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'Auto-pilot :', err);
      // Revenir à l'état précédent si l'appel échoue
      setIsAutoPilot(!updatedState);
    }
  };

  /**
   * Configuration du polling pour rafraîchir la conversation périodiquement
   */
  useEffect(() => {
    fetchConversation();
    pollingRef.current = setInterval(() => {
      fetchConversation();
    }, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [conversationId]);

  /**
   * Gestion du scroll : auto-scroll seulement si l'utilisateur est proche du bas
   */
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const gap = 20; // Seuil pour considérer que l'utilisateur est en bas
    setIsAtBottom((scrollHeight - scrollTop - clientHeight) < gap);
  };

  /**
   * Scroll automatique vers le bas si l'utilisateur est déjà en bas
   */
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversation?.messages, isAtBottom]);

  /**
   * Ajustement automatique de la hauteur de la textarea
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Limite à 120px
      textarea.style.height = `${newHeight}px`;
    };
    adjustHeight();
  }, [newMessage]);

  /**
   * Génération d'une réponse IA
   */
  const handleGenerateResponse = async () => {
    if (!conversationId || !propertyId) return;
    setGenerating(true);

    try {
      const resp = await fetch('/.netlify/functions/generate-ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, propertyId }),
      });
      if (!resp.ok) {
        throw new Error('Échec de la génération de la réponse');
      }
      const data = await resp.json();
      setNewMessage(data.response || '');
    } catch (err) {
      console.error('Erreur lors de la génération de la réponse IA :', err);
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Gestion de l'envoi d'un nouveau message
   */
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
        throw new Error('Données de conversation manquantes');
      }
      // Mise à jour locale de la conversation
      setConversation((prev) => {
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

      // Envoi au backend
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
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message :', err);
    } finally {
      setSending(false);
    }
  };

  // Gestion des états de chargement, d'erreur ou de non-trouvés
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
  if (!conversation) {
    return (
      <div className="min-h-[100dvh] p-6">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg">
          Conversation introuvable
        </div>
      </div>
    );
  }

  // Rendu principal du composant
  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* En-tête */}
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
            <h2 className="font-medium">{conversation.guestName || 'Conversation'}</h2>
            <p className="text-xs text-gray-500">
              {conversation.checkIn && new Date(conversation.checkIn).toLocaleDateString()}
              {' - '}
              {conversation.checkOut && new Date(conversation.checkOut).toLocaleDateString()}
            </p>
            {/* **Affichage du compteur de messages non lus** */}
            {unreadCount > 0 && (
              <p className="text-xs text-red-500">
                {unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Bouton de basculement de l'Auto-pilot */}
        <button
          onClick={handleToggleAutoPilot}
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

      {/* Liste des messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pb-4"
      >
        {conversation.messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex ${
              message.sender === 'guest' ? 'justify-start' : 'justify-end'
            } mb-2`}
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

      {/* Barre d'entrée de message + Bouton IA */}
      <div className="bg-white border-t px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {/* Bouton pour générer une réponse IA */}
          <button
            type="button"
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

          {/* Textarea avec redimensionnement automatique */}
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez un message..."
            rows={1}
            className="flex-1 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 resize-none"
            style={{ height: 'auto', maxHeight: '120px' }}
          />

          {/* Bouton d'envoi */}
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
