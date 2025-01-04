import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import type { Message, Conversation, Property } from '../../types';
import { aiService } from '../../services/aiService';
import { conversationService } from '../../services/conversationService';
import { messageService } from '../../services/messageService';
import ChatMessage from '../../components/ChatMessage';
import ResponseSuggestion from '../../components/ResponseSuggestion';

const Chat: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState<Conversation | null>(location.state?.conversation || null);
  const propertyAutoPilot = location.state?.propertyAutoPilot as boolean;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [suggestedResponse, setSuggestedResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customResponse, setCustomResponse] = useState('');
  const [isAutoPilot, setIsAutoPilot] = useState(propertyAutoPilot || false);

  // Charger la conversation
  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        try {
          console.log('🔄 Loading conversation:', conversationId);
          const loadedConversation = await conversationService.fetchConversationById(conversationId);
          console.log('📥 Loaded conversation:', {
            id: loadedConversation.id,
            guestEmail: loadedConversation.guestEmail,
            propertyId: loadedConversation.propertyId,
            messageCount: loadedConversation.messages?.length || 0,
            fullConversation: loadedConversation
          });
          setConversation(loadedConversation);
          setMessages(loadedConversation.messages || []);
        } catch (error) {
          console.error('❌ Error loading conversation:', error);
        }
      }
    };
    
    if (!conversation && conversationId) {
      loadConversation();
    } else if (conversation) {
      console.log('📦 Using existing conversation:', {
        id: conversation.id,
        guestEmail: conversation.guestEmail,
        propertyId: conversation.propertyId,
        messageCount: conversation.messages?.length || 0
      });
      setMessages(conversation.messages || []);
    }
  }, [conversationId, conversation]);

  useEffect(() => {
    if (messages.length > 0 && !isAutoPilot) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser) {
        generateAiResponse(lastMessage);
      }
    }
  }, [messages, isAutoPilot]);

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
    console.log('🎯 handleSendMessage called with text:', text);

    if (!text.trim() || !conversation) {
      console.warn('❌ Cannot send message:', {
        hasText: Boolean(text.trim()),
        hasConversation: Boolean(conversation)
      });
      return;
    }

    console.log('🔍 Current conversation state:', {
      id: conversation.id,
      guestEmail: conversation.guestEmail,
      propertyId: conversation.propertyId,
      messageCount: conversation.messages?.length || 0
    });

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      sender: 'Host'
    };
    console.log('📝 Created new message:', newMessage);

    try {
      // Mettre à jour l'état local
      console.log('🔄 Updating local state...');
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setNewMessage('');
      setIsEditing(false);
      setCustomResponse('');
      setSuggestedResponse('');

      // Sauvegarder le message dans Airtable
      console.log('💾 Saving message to Airtable...', {
        conversationId: conversation.id,
        messageCount: updatedMessages.length
      });
      
      const updatedConversation = await conversationService.updateConversation(conversation.id, {
        Messages: JSON.stringify(updatedMessages)
      });
      
      console.log('✅ Message saved to Airtable, updated conversation:', {
        id: updatedConversation.id,
        guestEmail: updatedConversation.guestEmail,
        propertyId: updatedConversation.propertyId,
        messageCount: updatedConversation.messages?.length || 0
      });
      
      setConversation(updatedConversation);

      // Vérifier les données nécessaires pour Make.com
      if (!updatedConversation.guestEmail) {
        console.error('❌ Missing guest email in conversation:', updatedConversation);
        throw new Error('Guest email is required to send message to Make.com');
      }

      if (!updatedConversation.propertyId) {
        console.error('❌ Missing property ID in conversation:', updatedConversation);
        throw new Error('Property ID is required to send message to Make.com');
      }

      // Envoyer le message à Make.com
      console.log('📤 Preparing to send message to Make.com:', {
        messageText: newMessage.text,
        guestEmail: updatedConversation.guestEmail,
        propertyId: updatedConversation.propertyId
      });

      try {
        await messageService.sendMessage(
          newMessage,
          updatedConversation.guestEmail,
          updatedConversation.propertyId
        );
        console.log('✅ Message successfully sent to Make.com');
      } catch (makeError) {
        console.error('❌ Failed to send message to Make.com:', makeError);
        throw makeError;
      }
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
      // Optionnel : Afficher une notification d'erreur à l'utilisateur
    }

    if (isAutoPilot) {
      setIsGenerating(true);
      try {
        const response = await aiService.generateResponse(newMessage, {} as Property);
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

  const onKeyDown = (e: React.KeyboardEvent) => {
    console.log('⌨️ Key pressed:', e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(newMessage);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{conversation?.propertyId}</h1>
              <p className="text-sm text-gray-500">Guest: {conversation?.guestName}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAutoPilot(!isAutoPilot)}
            disabled={!propertyAutoPilot}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              !propertyAutoPilot 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isAutoPilot
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Zap className={`w-4 h-4 ${
              !propertyAutoPilot 
                ? 'text-gray-400'
                : isAutoPilot 
                  ? 'text-blue-500' 
                  : 'text-gray-400'
            }`} />
            <span className="text-sm font-medium">
              {isAutoPilot ? 'Auto-pilot ON' : 'Auto-pilot OFF'}
            </span>
          </button>
        </div>
        {!propertyAutoPilot && (
          <div className="bg-gray-50 text-gray-600 text-sm px-3 py-1 rounded-md">
            Auto-pilot is disabled for this property
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isGenerating && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            AI is typing...
          </div>
        )}
      </div>

      {/* Response Suggestion */}
      {!isAutoPilot && suggestedResponse && (
        <ResponseSuggestion
          text={suggestedResponse}
          onAccept={handleAcceptSuggestion}
          onEdit={handleEditSuggestion}
          onRefresh={handleRefreshSuggestion}
          isLoading={isGenerating}
        />
      )}

      {/* Input Area */}
      <div className="flex items-center space-x-2 p-4 bg-white border-t">
        <textarea
          value={newMessage}
          onChange={(e) => {
            console.log('📝 Textarea changed:', e.target.value);
            setNewMessage(e.target.value);
          }}
          onKeyDown={(e) => {
            console.log('⌨️ Key pressed in textarea:', e.key);
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              console.log('↩️ Enter pressed, sending message...');
              handleSendMessage(newMessage);
            }
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
          rows={1}
        />
        <button
          onClick={() => {
            console.log('🔘 Send button clicked');
            handleSendMessage(newMessage);
          }}
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;