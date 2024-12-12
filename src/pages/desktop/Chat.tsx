import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import type { Message, Conversation, Property } from '../../types';
import { aiService } from '../../services/aiService';
import { conversationService } from '../../services/conversationService';
import ChatMessage from '../../components/ChatMessage';
import ResponseSuggestion from '../../components/ResponseSuggestion';

const Chat: React.FC = () => {
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
    if (!text.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      sender: 'Host'
    };

    setMessages(prev => [...prev, newMessage]);
    setNewMessage('');
    setIsEditing(false);
    setCustomResponse('');
    setSuggestedResponse('');

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
      <div className="bg-white border-t p-6">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={customResponse}
              onChange={(e) => setCustomResponse(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Edit your response..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendMessage(customResponse)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Send
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
              placeholder="Type a message..."
              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSendMessage(newMessage)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;