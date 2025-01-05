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
    <div className="flex flex-col min-h-[100dvh] h-[100dvh] bg-gray-200 fixed inset-0">
      {/* Header */}
      <div className="flex items-center px-4 py-2 bg-white shadow-sm z-10">
        <button
          onClick={() => navigate(-1)}
          className="mr-2 p-2 -ml-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex-shrink-0">
            {/* Avatar placeholder */}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">
              {conversation.guestName || 'Guest'}
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {new Date(conversation.checkIn).toLocaleDateString()} - {new Date(conversation.checkOut).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleAutoPilot}
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              isAutoPilot ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-xs">{isAutoPilot ? 'ON' : 'OFF'}</span>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm63 31c1.657 0 3-1.343 3-3s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM34 90c1.105 0 2-.895 2-2s-.45-2-1-2-1 .895-1 2 .45 2 1 2zM12 60c1.105 0 2-.895 2-2s-.45-2-1-2-1 .895-1 2 .45 2 1 2zM60 91c1.105 0 2-.895 2-2s-.45-2-1-2-1 .895-1 2 .45 2 1 2zM35 41c1.105 0 2-.895 2-2s-.45-2-1-2-1 .895-1 2 .45 2 1 2zM12 60c1.105 0 2-.895 2-2s-.45-2-1-2-1 .895-1 2 .45 2 1 2z' fill='%23000000' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {conversation.messages?.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            isLast={index === conversation.messages!.length - 1}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-50 border-t px-2 py-2 pb-safe">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-600 hover:text-gray-800">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <div className="flex-1 flex items-center bg-white rounded-full border px-3 py-1">
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
              placeholder="Message"
              className="flex-1 bg-transparent border-none focus:outline-none py-2 px-1"
            />
            <button
              onClick={handleGenerateAiResponse}
              disabled={isGeneratingAi || isAutoPilot}
              title={isAutoPilot ? "Disabled when Auto-pilot is ON" : "Generate AI response"}
              className="p-2 text-gray-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {newMessage.trim() ? (
            <button
              onClick={() => handleSendMessage(newMessage)}
              disabled={sending}
              className="p-2 text-white bg-green-500 rounded-full hover:bg-green-600 disabled:opacity-50"
            >
              {sending ? (
                <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          ) : (
            <button className="p-2 text-white bg-green-500 rounded-full hover:bg-green-600">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;