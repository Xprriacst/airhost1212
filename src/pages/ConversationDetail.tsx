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

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local states
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Track if the user is currently near the bottom of the messages
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);

  /**
   * Fonction pour aller chercher la conversation
   * + Marquer la conversation comme lue s'il y a de nouveaux messages (unreadCount).
   * On n'écrase pas l'état local isAutoPilot ici pour éviter les retours en arrière.
   */
  const fetchConversation = async () => {
    if (!conversationId) return;
    try {
      const data = await conversationService.fetchConversationById(conversationId);

      // Marquer la conversation comme lue si unreadCount > 0
      if (data.unreadCount && data.unreadCount > 0) {
        await conversationService.markConversationAsRead(conversationId);
      }

      // Mettre à jour la conversation avec les données reçues
      setConversation((prev) => {
        // Si l'utilisateur a déjà togglé auto-pilot localement, on conserve isAutoPilot
        // et on n'écrase pas la valeur locale (pour éviter un "flashback").
        // On fusionne l'existant si besoin, ici on reprend autoPilot dans la variable "data"
        // uniquement si c'est différent de ce qu'on a localement.
        const merged = {
          ...data,
          autoPilot: prev?.autoPilot ?? data.autoPilot,
        };
        return merged;
      });

      // On ne fait plus setIsAutoPilot(data.autoPilot)
      setError(null);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fonction pour synchroniser l'état local "isAutoPilot" avec la conversation
   * si la donnée backend change et qu’on n’a pas récemment togglé localement.
   */
  useEffect(() => {
    if (conversation && conversation.autoPilot !== isAutoPilot) {
      setIsAutoPilot(conversation.autoPilot || false);
    }
  }, [conversation, isAutoPilot]);

  /**
   * Mise en place du polling avec gestion du nettoyage.
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
   * Gère le scroll automatique ou non.
   * On fait défiler en bas seulement si l’utilisateur est déjà en bas.
   */
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversation?.messages, isAtBottom]);

  /**
   * Détecte si l’utilisateur est proche du bas pour (dés)activer le scroll automatique.
   */
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // On considère qu'on est "en bas" si l'écart est assez petit (par ex. 20px)
    const gap = 20;
    const isUserNearBottom = scrollHeight - scrollTop - clientHeight < gap;
    setIsAtBottom(isUserNearBottom);
  };

  /**
   * Gère la bascule de l’auto-pilot et met à jour le backend pour conserver la cohérence.
   */
  const handleToggleAutoPilot = async () => {
    const updatedState = !isAutoPilot;
    setIsAutoPilot(updatedState);

    if (!conversationId) return;
    try {
      await conversationService.updateConversation(conversationId, {
        autoPilot: updatedState,
      });
    } catch (err) {
      console.error('Error toggling autoPilot:', err);
      // En cas d’erreur on rétablit l’ancien état local
      setIsAutoPilot(!updatedState);
    }
  };

  /**
   * Gère l'auto-resize de la <textarea>.
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
   * Fonction pour générer une réponse IA (bouton IA / "Générer une réponse").
   */
  const handleGenerateResponse = async () => {
    if (!conversationId || !propertyId) return;
    setGenerating(true);

    try {
      const resp = await fetch('/.netlify/functions/generate-ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          propertyId,
        }),
      });

      if (!resp.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await resp.json();
      // On place la réponse IA dans le champ, prête à être envoyée
      setNewMessage(data.response || '');
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Fonction pour envoyer un message.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);

    // Création du nouveau message local
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

      // Mettre à jour l'état local avec ce nouveau message
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, messageData],
        };
      });
      setNewMessage('');

      // Attendre un instant avant de scroller (pour laisser le DOM se mettre à jour)
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

  // Gestion du chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="min-h-[100dvh] p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  // Si la conversation n’est pas trouvée
  if (!conversation) {
    return (
      <div className="min-h-[100dvh] p-6">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg">
          Conversation not found
        </div>
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
          </div>
        </div>

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

      {/* Barre d’envoi de message et bouton IA */}
      <div className="bg-white border-t px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {/* Bouton IA */}
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

          {/* TEXTAREA auto-resize */}
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
