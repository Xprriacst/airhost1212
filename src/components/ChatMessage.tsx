import React from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sender: string;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${message.isUser ? 'order-1' : 'order-2'}`}>
        <div className={`rounded-2xl px-4 py-2 ${
          message.isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-white border text-gray-900'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
        <div className={`mt-1 text-xs text-gray-500 ${
          message.isUser ? 'text-right' : 'text-left'
        }`}>
          {message.sender} • {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;