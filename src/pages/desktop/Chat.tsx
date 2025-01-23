import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Message, Property } from '../../types';
import { messageService } from '../../services/airtable/messageService';
import { conversationService } from '../../services/conversationService';
import { aiService } from '../../services/aiService';

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedResponse, setSuggestedResponse] = useState('');
  const [customResponse, setCustomResponse] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    }
  }, [conversationId]);

  const fetchConversation = async (id: string) => {
    console.log('Fetching conversation:', id);
    try {
      const conv = await conversationService.getConversation(id);
      console.log('Fetched conversation:', conv);
      setConversation(conv);
      if (conv.messages) {
        setMessages(conv.messages);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  // Fonction simplifiée pour le debugging
  const handleSendMessage = async (text: string) => {
    console.log('🎯 handleSendMessage called with:', {
      text,
      conversationId,
      conversation
    });

    if (!text.trim() || !conversation) {
      console.warn('❌ Cannot send message:', {
        hasText: Boolean(text.trim()),
        hasConversation: Boolean(conversation),
        conversationDetails: conversation
      });
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      sender: 'Host'
    };

    try {
      // 1. Envoyer à Make.com
      console.log('📤 Sending message to Make.com:', {
        message: newMessage,
        guestPhone: conversation.guestPhone,
        propertyId: conversation.propertyId
      });

      try {
        await messageService.sendMessage(
          newMessage,
          conversation.guestPhone,
          conversation.propertyId
        );
        console.log('✅ Message sent to Make.com successfully');
      } catch (makeError) {
        console.error('❌ Failed to send message to Make.com:', makeError);
        throw makeError;
      }

      // 2. Mettre à jour l'état local
      console.log('🔄 Updating local state...');
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setNewMessage('');

      // 3. Sauvegarder dans Airtable
      console.log('💾 Saving to Airtable...', {
        conversationId: conversation.id,
        messageCount: updatedMessages.length
      });

      try {
        const updatedConversation = await conversationService.updateConversation(
          conversation.id,
          { Messages: JSON.stringify(updatedMessages) }
        );
        console.log('✅ Saved to Airtable successfully:', {
          id: updatedConversation.id,
          messageCount: updatedConversation.messages?.length || 0
        });
        setConversation(updatedConversation);
      } catch (airtableError) {
        console.error('❌ Failed to save to Airtable:', airtableError);
        throw airtableError;
      }
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
      // Optionally: show error to user
    }
  };

  // Interface simplifiée pour le debugging
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Debug Chat Interface</h2>
        <p>Conversation ID: {conversationId}</p>
        <p>Guest Phone: {conversation?.guestPhone}</p>
        <p>Property ID: {conversation?.propertyId}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-bold">Messages:</h3>
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 p-2 border rounded">
            <p>Text: {msg.text}</p>
            <p>Sender: {msg.sender}</p>
            <p>Time: {msg.timestamp?.toString()}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center p-4 border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            console.log('💬 Input changed:', e.target.value);
            setNewMessage(e.target.value);
          }}
          onKeyPress={(e) => {
            console.log('⌨️ Key pressed:', e.key);
            if (e.key === 'Enter') {
              console.log('↩️ Enter key pressed, sending message...');
              handleSendMessage(newMessage);
            }
          }}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-l"
        />
        <button
          onClick={() => {
            console.log('🔘 Send button clicked');
            console.log('Message to send:', newMessage);
            console.log('Conversation:', conversation);
            handleSendMessage(newMessage);
          }}
          className="bg-blue-500 text-white p-2 rounded-r"
        >
          <span className="flex items-center">
            Send
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}