import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { conversationService } from '../services';
import { propertyService } from '../services/airtable/propertyService';
import { aiService } from '../services/ai/aiService';
import type { Conversation, Property, Message } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function ConversationDetail() {
  const { conversationId, propertyId } = useParams<{ conversationId: string; propertyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!conversationId || !propertyId || !user) {
      navigate('/');
      return;
    }
    loadConversation();
    loadProperty();
  }, [conversationId, propertyId, user]);

  const loadConversation = async () => {
    if (!conversationId || !user) return;
    
    try {
      const data = await conversationService.fetchConversationById(user.id, conversationId);
      setConversation(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
    }
  };

  const loadProperty = async () => {
    if (!propertyId) return;
    
    try {
      const data = await propertyService.fetchPropertyById(propertyId);
      setProperty(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la propriété:', error);
    }
  };

  const handleGenerateResponse = async () => {
    if (!conversation?.messages?.length || !property) {
      return;
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage.sender !== 'guest') {
      return;
    }

    setIsGenerating(true);

    try {
      const aiConfig = {
        language: 'fr' as const,
        tone: 'friendly' as const,
        shouldIncludeEmoji: true
      };

      const bookingContext = {
        hasBooking: true,
        checkIn: conversation.checkIn,
        checkOut: conversation.checkOut,
        guestCount: conversation.guestCount
      };

      const response = await aiService.generateResponse(
        lastMessage,
        property,
        bookingContext,
        conversation.messages.slice(-10),
        aiConfig
      );

      setNewMessage(response);
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || !user) {
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: 'host',
      timestamp: new Date()
    };

    try {
      // Ajouter le message localement d'abord
      setConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message]
      } : prev);
      
      setNewMessage('');
      
      // Envoyer au backend
      await conversationService.updateConversation(conversation.id, {
        Messages: JSON.stringify([...conversation.messages, message])
      });
      
      // Recharger pour confirmer
      loadConversation();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  if (!conversation || !property) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center p-4 border-b">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-semibold">
            {conversation.guestName || conversation.guestEmail?.split('@')[0] || 'Discussion avec l\'invité'}
          </h1>
          <div className="text-sm text-gray-500">
            {conversation.checkIn && (
              <div className="flex items-center gap-2">
                <span>
                  {new Date(conversation.checkIn).toLocaleDateString()} - {new Date(conversation.checkOut).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'host' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === 'host'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              <p>{message.text}</p>
              <div className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Votre message..."
            className="flex-1 p-2 border rounded-lg resize-none"
            rows={3}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleGenerateResponse}
              disabled={isGenerating}
              aria-label="Générer une réponse"
              className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 disabled:opacity-50"
            >
              <Sparkles size={20} />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              aria-label="Envoyer"
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
