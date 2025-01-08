import React from 'react';
import { RefreshCw, Send, Calendar, Clock } from 'lucide-react';
import ChatMessage from '../../../components/ChatMessage';
import type { Message, Property } from '../../../types';

interface ChatInterfaceProps {
  property: Property;
  messages: Message[];
  isGenerating: boolean;
  messageDate: string;
  messageTime: string;
  newMessage: string;
  onMessageDateChange: (date: string) => void;
  onMessageTimeChange: (time: string) => void;
  onNewMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onClearChat: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  property,
  messages,
  isGenerating,
  messageDate,
  messageTime,
  newMessage,
  onMessageDateChange,
  onMessageTimeChange,
  onNewMessageChange,
  onSendMessage,
  onClearChat,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-col h-[calc(100vh-200px)]">
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{property.name}</h2>
            <p className="text-sm text-gray-500">{property.address}</p>
          </div>
          <button
            onClick={onClearChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="w-4 h-4" />
            Effacer la conversation
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isGenerating && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            L'IA est en train d'écrire...
          </div>
        )}
      </div>

      <div className="p-4 border-t space-y-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={messageDate}
              onChange={(e) => onMessageDateChange(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <input
              type="time"
              value={messageTime}
              onChange={(e) => onMessageTimeChange(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Tapez un message..."
            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isGenerating}
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim() || isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;