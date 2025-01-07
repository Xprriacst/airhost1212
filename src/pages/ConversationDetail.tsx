import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Zap } from 'lucide-react';
import { conversationService } from '../services';
import { messageService } from '../services/messageService';
import { aiService } from '../services/ai/aiService';
import { propertyService } from '../services/airtable/propertyService';
import ChatMessage from '../components/ChatMessage';
import type { Conversation, Message, Property } from '../types';

const POLLING_INTERVAL = 3000;

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
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

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
    if (conversation?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
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

  const handleSendMessage = async (text: string, isAiResponse: boolean = false) => {
    if (!text.trim() || sending || !conversation || !conversationId) return;

    console.log('🚀 Sending message:', {
      text,
      isAiResponse,
      conversation,
      propertyId
    });

    setSending(true);

    try {
      // 1. Créer le message
      const message: Message = {
        id: Date.now().toString(),
        text,
        isUser: true,
        timestamp: new Date(),
        sender: isAiResponse ? 'AI Assistant' : 'Host'
      };

      console.log('📝 Created message:', message);

      // 2. Envoyer à Make.com
      try {
        console.log('📤 Sending to Make.com...');
        await messageService.sendMessage(
          message,
          conversation.guestPhone,
          propertyId || '',
          conversation.guestName
        );
        console.log('✅ Sent to Make.com successfully');
      } catch (makeError) {
        console.error('❌ Failed to send to Make.com:', makeError);
        // On continue même si l'envoi à Make.com échoue
      }

      // 3. Mettre à jour Airtable
      console.log('💾 Updating Airtable...');
      const updatedMessages = [...(conversation.messages || []), message];
      
      await conversationService.updateConversation(conversationId, {
        Messages: JSON.stringify(updatedMessages)
      });

      console.log('✅ Updated Airtable successfully');

      // 4. Mettre à jour l'état local
      setConversation(prev => prev ? {
        ...prev,
        messages: updatedMessages
      } : null);
      
      setNewMessage('');
      setError(null);

      // 5. Gérer la réponse automatique
      if (isAutoPilot && !isAiResponse && property) {
        console.log('🤖 Generating AI response...');
        const aiResponse = await aiService.generateResponse(
          message,
          property,
          {
            hasBooking: true,
            checkIn: conversation.checkIn,
            checkOut: conversation.checkOut
          },
          updatedMessages
        );
        await handleSendMessage(aiResponse, true);
      }
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleGenerateAiResponse = async () => {
    if (!conversation || !property || isGeneratingAi) return;

    setIsGeneratingAi(true);
    try {
      console.log('🤖 Generating AI response manually...');
      const lastMessage = conversation.messages?.[conversation.messages.length - 1];
      
      const aiResponse = await aiService.generateResponse(
        lastMessage,
        property,
        {
          hasBooking: true,
          checkIn: conversation.checkIn,
          checkOut: conversation.checkOut
        },
        conversation.messages || []
      );

      setNewMessage(aiResponse);
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      setError('Failed to generate AI response');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const toggleAutoPilot = async () => {
    if (!conversation || !conversationId) return;

    const newAutoPilotState = !isAutoPilot;
    try {
      await conversationService.updateConversation(conversationId, {
        'Auto Pilot': newAutoPilotState
      });
      setIsAutoPilot(newAutoPilotState);
      console.log('🤖 Auto Pilot set to:', newAutoPilotState ? 'ON' : 'OFF');
    } catch (error) {
      console.error('Failed to update Auto Pilot state:', error);
      setError('Failed to update Auto Pilot state');
    }
  };

  useEffect(() => {
    if (conversation) {
      setIsAutoPilot(conversation['Auto Pilot'] === true);
    }
  }, [conversation]);

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
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">{conversation?.guestName || 'Conversation'}</h1>
            <p className="text-sm text-gray-500">
              {conversation?.checkIn && new Date(conversation.checkIn).toLocaleDateString()} - {conversation?.checkOut && new Date(conversation.checkOut).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoPilot}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isAutoPilot 
                ? 'text-blue-500 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span>Auto-pilot</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={messagesEndRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {conversation?.messages.map((message, index) => (
            <ChatMessage
              key={message.id || index}
              message={message}
              isLast={index === conversation.messages.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 flex items-end bg-white rounded-3xl border px-2 py-1.5 min-h-[40px]">
              <button
                onClick={handleGenerateAiResponse}
                disabled={isGeneratingAi || isAutoPilot}
                title={isAutoPilot ? "Désactivé quand Auto-pilot est ON" : "Générer une réponse AI"}
                className="p-1.5 text-gray-500 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isGeneratingAi ? (
                  <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                  >
                    <path d="M12 4L9 9 4 9.5L8 13 7 18L12 15.5L17 18L16 13L20 9.5L15 9z" />
                    <path d="M20 3L19 5 17 4 18 6 16 7 18 8 17 10 19 9 20 11 21 9 23 8 21 7 22 5 20 6z" />
                  </svg>
                )}
              </button>

              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(newMessage);
                  }
                }}
                placeholder="Message"
                className="flex-1 bg-transparent border-none focus:outline-none px-2 py-1 resize-none overflow-y-auto min-h-[24px]"
                rows={1}
              />
            </div>

            {/* Bouton d'envoi */}
            <button
              onClick={() => handleSendMessage(newMessage)}
              disabled={!newMessage.trim() || sending}
              className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {sending ? (
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;