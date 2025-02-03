import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Message, Property } from '../../types';
import { messageService } from '../../services/airtable/messageService';
import { conversationService } from '../../services/airtable/conversationService';
import { aiService } from '../../services/aiService';
import { authService } from '../../services/airtable/authService';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (conversationId) {
        try {
          const userId = await authService.getCurrentUserId();
          if (!userId) {
            setError('User not authenticated');
            return;
          }
          await fetchConversation(conversationId, userId);
        } catch (error) {
          console.error('Error in fetchData:', error);
          setError(error instanceof Error ? error.message : 'An error occurred');
        }
      }
    };
    fetchData();
  }, [conversationId]);

  const fetchConversation = async (id: string, userId: string) => {
    console.log('Fetching conversation:', id);
    try {
      const conv = await conversationService.fetchConversationById(userId, id);
      console.log('Fetched conversation:', conv);
      setConversation(conv);
      if (conv.messages) {
        setMessages(conv.messages);
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch conversation');
    }
  };

  // Fonction d'envoi de message via WhatsApp
  const handleSendMessage = async (text: string) => {
    console.log('🎯 handleSendMessage called with:', {
      text,
      conversationId,
      conversation
    });

    if (!text.trim() || !conversation || !conversation.propertyId || !conversation.guestPhone) {
      console.warn('❌ Impossible d\'envoyer le message:', {
        hasText: Boolean(text.trim()),
        hasConversation: Boolean(conversation),
        hasPropertyId: conversation?.propertyId,
        hasGuestPhone: conversation?.guestPhone,
        conversationDetails: conversation
      });
      throw new Error('Données de conversation manquantes');
    }

    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      timestamp: new Date(),
      sender: 'host',
      type: 'text',
      status: 'pending',
      metadata: {
        platform: 'whatsapp'
      }
    };

    try {
      // 1. Envoyer via le service de conversation (WhatsApp)
      console.log('📤 Envoi du message via WhatsApp:', {
        message: newMessage,
        guestPhone: conversation.guestPhone,
        propertyId: conversation.propertyId
      });

      try {
        const userId = await authService.getCurrentUserId();
        if (!userId) {
          throw new Error('Utilisateur non authentifié');
        }

        const messageObject: Message = {
          id: `${Date.now()}`,
          text: newMessage,
          timestamp: new Date().toISOString(),
          sender: 'host',
          type: 'text',
          status: 'pending',
          metadata: {
            platform: 'whatsapp'
          }
        };
        await conversationService.sendMessage(userId, conversation, messageObject);
        console.log('✅ Message envoyé via WhatsApp avec succès');
      } catch (whatsappError) {
        console.error('❌ Échec de l\'envoi du message via WhatsApp:', whatsappError);
        throw whatsappError;
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
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Erreur</h3>
          <p>{error}</p>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold">Interface de Chat</h2>
        <div className="text-sm text-gray-600">
          <p>ID de conversation : {conversationId}</p>
          <p>Téléphone du client : {conversation?.guestPhone || <span className="text-red-500">Non renseigné</span>}</p>
          <p>ID de la propriété : {conversation?.propertyId || <span className="text-red-500">Non renseigné</span>}</p>
        </div>
      </div>

      <div className="mb-4">
        {!conversation?.guestPhone && (
          <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mb-2">
            ⚠️ Cette conversation n'a pas de numéro de téléphone associé. 
            L'envoi de messages ne sera pas possible.
          </div>
        )}
        
        {!conversation?.propertyId && (
          <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mb-2">
            ⚠️ Cette conversation n'est pas associée à une propriété. 
            L'envoi de messages ne sera pas possible.
          </div>
        )}
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