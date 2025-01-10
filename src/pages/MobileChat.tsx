import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap, AlertTriangle, Wrench, Package, HelpCircle, AlertOctagon } from 'lucide-react';
import type { Message, Conversation, Property, EmergencyTag } from '../types';
import { aiService } from '../services/aiService';
import { conversationService } from '../services/conversationService';
import { messageService } from '../services/messageService';
import { notificationService } from '../services/notificationService';
import ChatMessage from '../components/ChatMessage';
import ResponseSuggestion from '../components/ResponseSuggestion';

const EmergencyIcon = ({ tag }: { tag: EmergencyTag }) => {
  switch (tag) {
    case 'client_mecontent':
      return <AlertTriangle className="w-4 h-4 text-orange-500" title="Client mécontent" />;
    case 'probleme_technique':
      return <Wrench className="w-4 h-4 text-red-500" title="Problème technique" />;
    case 'probleme_stock':
      return <Package className="w-4 h-4 text-yellow-500" title="Problème de stock" />;
    case 'reponse_inconnue':
      return <HelpCircle className="w-4 h-4 text-blue-500" title="Réponse inconnue" />;
    case 'urgence':
      return <AlertOctagon className="w-4 h-4 text-red-600" title="Urgence" />;
    default:
      return null;
  }
};

const MobileChat: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const conversation = location.state?.conversation as Conversation;
  const propertyAutoPilot = location.state?.propertyAutoPilot as boolean;
  
  const [messages, setMessages] = useState<Message[]>(conversation?.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [suggestedResponse, setSuggestedResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customResponse, setCustomResponse] = useState('');
  const [isAutoPilot, setIsAutoPilot] = useState(propertyAutoPilot || false);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && shouldScrollToBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const bottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setIsAtBottom(bottom);
  }, []);

  // Only scroll when explicitly requested
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, shouldScrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser) {
        // Si le message vient du client, envoyer une notification
        notificationService.sendNotification(lastMessage.text);
      }
    }
  }, [messages]);

  const generateAiResponse = async (message: Message) => {
    setIsGenerating(true);
    try {
      const response = await aiService.generateResponse(message, {} as Property);
      setSuggestedResponse(response);
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setShouldScrollToBottom(true);
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      sender: 'Hôte'
    };

    setMessages(prev => [...prev, newMessage]);
    setNewMessage('');
    setIsEditing(false);
    setCustomResponse('');
    setSuggestedResponse('');

    try {
      // Sauvegarder le message dans Airtable
      console.log('💾 Saving message to Airtable...');
      await conversationService.updateConversation(conversation.id, {
        Messages: JSON.stringify([...messages, newMessage])
      });
      console.log('✅ Message saved to Airtable');

      // Envoyer le message à Make.com
      console.log('📝 Conversation details:', {
        guestEmail: conversation?.guestEmail,
        propertyId: conversation?.propertyId,
        rawConversation: conversation
      });
      
      if (!conversation?.guestEmail || !conversation?.propertyId) {
        console.error('❌ Missing required conversation data:', {
          hasGuestEmail: Boolean(conversation?.guestEmail),
          hasPropertyId: Boolean(conversation?.propertyId)
        });
        return;
      }

      console.log('📤 Sending message to Make.com...');
      await messageService.sendMessage(newMessage, conversation.guestEmail, conversation.propertyId);
      console.log('✅ Message sent to Make.com');
    } catch (error) {
      console.error('❌ Error:', error);
    }

    if (isAutoPilot) {
      setIsGenerating(true);
      try {
        const response = await aiService.generateResponse(newMessage, {} as Property);
        setShouldScrollToBottom(true);
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: response,
          isUser: true,
          timestamp: new Date(),
          sender: 'AI Assistant'
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error generating AI response:', error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleAcceptSuggestion = (text: string) => {
    handleSendMessage(text);
  };

  const handleEditSuggestion = (text: string) => {
    setCustomResponse(text);
    setIsEditing(true);
  };

  const handleRefreshSuggestion = async () => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      await generateAiResponse(lastMessage);
    }
  };

  const handleToggleAutoPilot = () => {
    setIsAutoPilot(!isAutoPilot);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-gray-50 rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div>
          <h2 className="font-medium">
            {conversation?.guestName || 'Conversation'}
          </h2>
          <p className="text-xs text-gray-500">
            {conversation?.checkIn && new Date(conversation.checkIn).toLocaleDateString()} - {conversation?.checkOut && new Date(conversation.checkOut).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
        {isGenerating && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            L'IA est en train d'écrire...
          </div>
        )}
      </div>

      {/* Response Suggestion */}
      {!isAutoPilot && suggestedResponse && (
        <div className="border-t bg-white">
          <ResponseSuggestion
            text={suggestedResponse}
            onAccept={handleAcceptSuggestion}
            onEdit={handleEditSuggestion}
            onRefresh={handleRefreshSuggestion}
            isLoading={isGenerating}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={customResponse}
              onChange={(e) => setCustomResponse(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Modifier votre réponse..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleSendMessage(customResponse)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Envoyer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
              placeholder="Tapez un message..."
              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSendMessage(newMessage)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileChat;