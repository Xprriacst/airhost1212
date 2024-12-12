import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Zap } from 'lucide-react';
import { conversationService } from '../services';
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

    const message: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      sender: isAiResponse ? 'AI Assistant' : 'Host'
    };

    setSending(true);

    try {
      const updatedMessages = [...(conversation.messages || []), message];
      
      await conversationService.updateConversation(conversationId, {
        Messages: JSON.stringify(updatedMessages)
      });

      setConversation(prev => prev ? {
        ...prev,
        messages: updatedMessages
      } : null);
      
      setNewMessage('');
      setError(null);

      // Si Auto-Pilot est activé et ce n'est pas déjà une réponse de l'IA,
      // générer une réponse automatique
      if (isAutoPilot && !isAiResponse && property) {
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
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
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
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            onClick={() => handleSendMessage(newMessage)}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;