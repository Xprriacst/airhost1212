import React from 'react';
import { Box } from '@mui/material';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <Box>
      {messages.map((message) => (
        <Box
          key={message.id}
          sx={{
            display: 'flex',
            justifyContent: message.sender === 'host' ? 'flex-end' : 'flex-start',
            mb: 2
          }}
        >
          <Box
            sx={{
              maxWidth: '75%',
              p: 2,
              borderRadius: 2,
              bgcolor: message.sender === 'host' ? 'primary.main' : 'grey.100',
              color: message.sender === 'host' ? 'white' : 'text.primary'
            }}
          >
            {message.content}
          </Box>
        </Box>
      ))}
    </Box>
  );
};
