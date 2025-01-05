import React, { useEffect, useState, useRef } from 'react';
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

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
          conversation.guestEmail,
          propertyId || ''
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg">
          Conversation not found
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {conversation.guestName}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date(conversation.checkIn).toLocaleDateString()} - {new Date(conversation.checkOut).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsAutoPilot(!isAutoPilot)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {conversation.messages.map((message) => (
            <ChatMessage 
              key={`${message.id}-${message.timestamp.toString()}`} 
              message={message} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                console.log('💬 Input changed:', e.target.value);
                setNewMessage(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(newMessage);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-l focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleGenerateAiResponse}
              disabled={isGeneratingAi || isAutoPilot}
              title={isAutoPilot ? "Disabled when Auto-pilot is ON" : "Generate AI response"}
              className="px-3 text-gray-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingAi ? (
                <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={() => handleSendMessage(newMessage)}
            disabled={sending || !newMessage.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};

export default ConversationDetail;