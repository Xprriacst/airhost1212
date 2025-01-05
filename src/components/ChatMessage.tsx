import React from 'react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast }) => {
  // Un message est de "nous" (l'hôte) si :
  // 1. Il vient de l'IA (sender === 'AI')
  // 2. Il vient de l'hôte (sender === 'Host')
  // 3. Il a explicitement isUser === false
  // Sinon, c'est un message du client
  const isFromUs = message.sender === 'AI' || message.sender === 'Host' || message.isUser === false;
  
  const time = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className={`flex ${isFromUs ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`relative max-w-[75%] px-3 py-2 rounded-lg ${
          isFromUs
            ? 'bg-[#e7ffdb] mr-1'
            : 'bg-white ml-1'
        }`}
      >
        {/* Triangle pour la bulle */}
        <div
          className={`absolute top-0 w-3 h-3 ${
            isFromUs
              ? '-right-1.5 bg-[#e7ffdb]'
              : '-left-1.5 bg-white'
          }`}
          style={{
            clipPath: isFromUs
              ? 'polygon(0 0, 0% 100%, 100% 0)'
              : 'polygon(100% 0, 0 0, 100% 100%)'
          }}
        />

        {/* Contenu du message */}
        <div className="relative">
          <p className="text-[15px] leading-[20px] text-gray-800 whitespace-pre-wrap break-words">
            {message.text}
          </p>
          <div className="flex items-center justify-end -mb-1 mt-1 space-x-1">
            <span className="text-[11px] text-gray-500 min-w-[45px]">
              {time}
            </span>
            {isFromUs && (
              <div className="flex -space-x-1">
                <svg className="w-[15px] h-[15px] text-[#53bdeb]" viewBox="0 0 16 15" fill="currentColor">
                  <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;