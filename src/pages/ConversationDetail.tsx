import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';
import { conversationService } from '../services';
import { propertyService } from '../services/airtable/propertyService';
import type { Conversation, Message, Property } from '../types';

const POLLING_INTERVAL = 3000;

const Message = ({ message }: { message: Message }) => {
  const isGuest = message.sender === 'guest';
  
  return (
    <div className={`flex ${isGuest ? 'justify-start' : 'justify-end'} mb-2`}>
      <div 
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isGuest 
            ? 'bg-gray-100 text-gray-900' 
            : 'bg-blue-500 text-white'
        } ${
          isGuest
            ? 'rounded-tl-sm'
            : 'rounded-tr-sm'
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Charger la propriété
  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId) return;
      try {
        const properties = await propertyService.getProperties();
        const foundProperty = properties.find(p => p.id === propertyId);
        if (foundProperty) {
          setProperty(foundProperty);
        }
      } catch (err) {
        console.error('Error loading property:', err);
      }
    };
    loadProperty();
  }, [propertyId]);

  const fetchConversation = async () => {
    if (!conversationId) return;

    try {
      const data = await conversationService.fetchConversationById(conversationId);
      
      // Réinitialiser le compteur de messages non lus
      if (data.unreadCount > 0) {
        await conversationService.markConversationAsRead(conversationId);
      }
      
      setConversation(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();

    pollingRef.current = setInterval(fetchConversation, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom instantly when conversation opens
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ block: 'end', behavior: 'instant' as ScrollBehavior });
    }
  }, [conversation?.messages]);

  useEffect(() => {
    // Fonction pour ajuster la hauteur
    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120); // Max 5 lignes (24px * 5)
        textarea.style.height = `${newHeight}px`;
      }
    };

    // Ajuster au chargement
    adjustHeight();

    // Observer les changements de contenu
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('input', adjustHeight);
      return () => textarea.removeEventListener('input', adjustHeight);
    }
  }, [newMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      if (!conversation || !conversation.guestPhone) {
        throw new Error('Missing conversation data');
      }

      const messageData: Message = {
        id: `temp-${Date.now()}`,
        text: newMessage.trim(),
        timestamp: new Date(),
        sender: 'host',
        type: 'text',
        status: 'pending'
      };

      // Optimistic update
      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, messageData]
        };
      });

      // Reset input
      setNewMessage('');

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Préparer le payload pour la fonction Netlify
      const payload = {
        message: messageData.text,
        guestPhone: conversation.guestPhone.replace(/\D/g, ''),
        guestName: conversation.guestName,
        propertyId: propertyId || '',
        timestamp: messageData.timestamp.toISOString(),
        platform: 'whatsapp',
        isHost: true,
        messageType: messageData.type
      };

      // Envoyer via la fonction Netlify
      const response = await axios.post('/.netlify/functions/send-message', payload);

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      // Mettre à jour le statut du message
      setConversation(prev => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map(msg => 
          msg.id === messageData.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        );
        return {
          ...prev,
          messages: updatedMessages
        };
      });

    } catch (err) {
      console.error('Error sending message:', err);
      // Mettre à jour le statut du message en échec
      setConversation(prev => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map(msg => 
          msg.id === messageData?.id 
            ? { ...msg, status: 'failed' as const }
            : msg
        );
        return {
          ...prev,
          messages: updatedMessages
        };
      });
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleBack = () => {
    navigate(-1);
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
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen max-h-screen w-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="h-14 bg-white border-b z-10 flex items-center px-4 flex-shrink-0">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-gray-50 rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        
        <div className="flex items-center ml-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
            <span className="text-gray-600 text-sm font-medium">
              {conversation?.guestName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">
              {conversation?.guestName || 'Conversation'}
            </h2>
            <p className="text-xs text-gray-500">
              {conversation?.checkIn && new Date(conversation.checkIn).toLocaleDateString()} - {conversation?.checkOut && new Date(conversation.checkOut).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Messages avec padding en bas pour la barre de texte */}
      <div className="flex-1 overflow-y-auto bg-white pb-[60px]">
        <div className="p-4 space-y-1">
          {conversation?.messages.map((message, index) => (
            <Message
              key={message.id || index}
              message={message}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2">
        <div className="flex items-end gap-2">
          <div className="flex-1 min-h-[40px] max-h-[120px] flex items-end bg-white rounded-full border px-4 py-2">
            <textarea
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