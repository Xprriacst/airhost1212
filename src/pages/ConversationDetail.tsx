import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography } from '@mui/material';
import { useConversationStore } from '../stores/conversationStore';
import { aiService } from '../services/ai/aiService';
import { Message } from '../types';
import { MessageList } from '../components/MessageList';
import { ConversationHeader } from '../components/ConversationHeader';

export const ConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { conversation, fetchConversation, sendMessage } = useConversationStore();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchConversation(id);
    }
  }, [id, fetchConversation]);

  useEffect(() => {
    if (conversation) {
      setIsAutoPilot(false);
    }
  }, [conversation]);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      const element = messageListRef.current;
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    setIsLoading(true);
    try {
      const message: Message = {
        id: Date.now().toString(),
        conversationId: conversation.id,
        content: newMessage,
        sender: 'host',
        timestamp: new Date(),
        type: 'text',
        status: 'sent'
      };

      await sendMessage(message);
      setNewMessage('');
      scrollToBottom();

      if (isAutoPilot) {
        const response = await aiService.generateResponse({
          propertyName: conversation.propertyName,
          propertyType: conversation.propertyType,
          checkIn: conversation.checkIn,
          checkOut: conversation.checkOut,
          guestName: conversation.guestName,
          previousMessages: conversation.messages
        });

        if (response) {
          const aiMessage: Message = {
            id: Date.now().toString(),
            conversationId: conversation.id,
            content: response,
            sender: 'host',
            timestamp: new Date(),
            type: 'text',
            status: 'sent'
          };

          await sendMessage(aiMessage);
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(event);
    }
  };

  if (!conversation) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <ConversationHeader
        title={conversation.guestName}
        subtitle={
          <>
            Check-in:{' '}
            {conversation?.checkIn && new Date(conversation.checkIn).toLocaleDateString()}
            <br />
            Check-out:{' '}
            {conversation?.checkOut && new Date(conversation.checkOut).toLocaleDateString()}
          </>
        }
      />

      <Box
        ref={messageListRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <MessageList messages={conversation.messages} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1
        }}
      >
        <TextField
          inputRef={textareaRef}
          fullWidth
          multiline
          maxRows={4}
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Type your message..."
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading || !newMessage.trim()}
          sx={{ minWidth: 100 }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};
