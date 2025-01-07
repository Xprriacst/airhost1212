import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Zap } from 'lucide-react';
import { conversationService } from '../services';
import { messageService } from '../services/messageService';
import { aiService } from '../services/ai/aiService';
import { propertyService } from '../services/airtable/propertyService';
import type { Conversation, Message, Property } from '../types';

const POLLING_INTERVAL = 3000;

const Message = ({ message }: { message: Message }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-2`}>
      <div 
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isBot 
            ? 'bg-gray-100 text-gray-900' 
            : 'bg-blue-500 text-white'
        } ${
          isBot
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
        sender: isAiResponse ? 'bot' : 'Host'
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

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = () => {
    handleSendMessage(newMessage);
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white">
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

      {/* Input en bas */}
      <div className="bg-white border-t px-4 py-2 flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 min-h-[40px] max-h-[120px] flex items-end bg-white rounded-full border px-4 py-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
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