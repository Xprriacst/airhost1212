import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Message, Property } from '../../types';
import { messageService } from '../../services/messageService';
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
        hasConversation: Boolean(conversation)
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
      console.log('📤 Sending message:', newMessage);
      await messageService.sendMessage(
        newMessage,
        conversation.guestEmail,
        conversation.propertyId
      );
      console.log('✅ Message sent successfully');

      // Mettre à jour l'état local
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setNewMessage('');

      // Sauvegarder dans Airtable
      const updatedConversation = await conversationService.updateConversation(
        conversation.id,
        { Messages: JSON.stringify(updatedMessages) }
      );
      setConversation(updatedConversation);
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
    }
  };

  // Interface simplifiée pour le debugging
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Debug Chat Interface</h2>
        <p>Conversation ID: {conversationId}</p>
        <p>Guest Email: {conversation?.guestEmail}</p>
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

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            console.log('📝 Input changed:', e.target.value);
            setNewMessage(e.target.value);
          }}
          className="flex-1 p-2 border rounded"
          placeholder="Type a message..."
        />
        <button
          onClick={() => {
            console.log('🔘 Send button clicked');
            handleSendMessage(newMessage);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}