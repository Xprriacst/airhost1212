import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { WhatsAppTemplateSelector } from '../components/WhatsAppTemplateSelector';
import { conversationService } from '../services';
import { propertyService } from '../services/airtable/propertyService';
import { aiService } from '../services/ai/aiService';
import type { Conversation, Property, Message } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function ConversationDetail() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { conversationId, propertyId } = useParams<{ conversationId: string; propertyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Scroll au chargement initial et à chaque nouveau message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversation?.messages]);

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
      if (data.messages) {
        setConversation(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
    }
  };

  const handleSendTemplate = async (templateName: string) => {
    if (!conversation || !user) return;

    const messageToSend = {
      id: Date.now().toString(),
      text: `[Template: ${templateName}]`,
      sender: 'host' as const,
      timestamp: new Date().toISOString(),
      type: 'template',
      templateName,
    };

    try {
      const updatedMessages = [...conversation.messages, messageToSend];
      
      await conversationService.updateConversation(user.id, conversation.id, {
        ...conversation,
        messages: updatedMessages,
      });

      setConversation((prev) => {
        if (!prev) return null;
        return { ...prev, messages: updatedMessages };
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du template:', error);
      loadConversation();
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
    console.log('Début handleGenerateResponse');
    
    if (!conversation?.messages?.length || !property) {
      console.log('Arrêt: pas de messages ou de propriété', {
        hasMessages: !!conversation?.messages?.length,
        hasProperty: !!property
      });
      return;
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage.sender !== 'guest') {
      console.log('Arrêt: dernier message non envoyé par guest', {
        sender: lastMessage.sender
      });
      return;
    }

    console.log('Génération de réponse en cours...');
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

      console.log('Appel du service AI avec:', {
        config: aiConfig,
        booking: bookingContext
      });

      const response = await aiService.generateResponse(
        lastMessage,
        property,
        bookingContext,
        conversation.messages.slice(-10),
        aiConfig
      );

      console.log('Réponse reçue:', response);
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
      timestamp: new Date(),
      type: 'text',
      status: 'sending'
    };

    try {
      // Mise à jour locale optimiste
      setConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message]
      } : prev);
      
      setNewMessage('');
      
      // Envoi du message via le service de conversation
      await conversationService.sendMessage(user.id, conversation, message);
      
      // Mise à jour du statut en 'sent'
      setConversation(prev => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map(msg => 
          msg.id === message.id ? { ...msg, status: 'sent' } : msg
        );
        return { ...prev, messages: updatedMessages };
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      // Recharger en cas d'erreur pour synchroniser
      loadConversation();
    }
  };

  if (!conversation || !property) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <button onClick={() => navigate('/')} className="mr-4" aria-label="retour">
          <ArrowLeft />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{conversation.guestName}</h1>
          <p className="text-sm text-gray-500">{property.name}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'host' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.sender === 'host'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <WhatsAppTemplateSelector onSelectTemplate={handleSendTemplate} />
          <button
            onClick={handleGenerateResponse}
            disabled={isGenerating || !conversation.messages.length || conversation.messages[conversation.messages.length - 1].sender !== 'guest'}
            className={`p-2 rounded-full relative ${
              isGenerating || !conversation.messages.length || conversation.messages[conversation.messages.length - 1].sender !== 'guest'
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-blue-100 hover:bg-blue-200'
            }`}
            aria-label="générer une réponse"
            title={
              !conversation.messages.length
                ? "Pas de messages dans la conversation"
                : conversation.messages[conversation.messages.length - 1].sender !== 'guest'
                ? "Impossible de générer une réponse : le dernier message n'est pas de l'invité"
                : "Générer une réponse"
            }
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Votre message..."
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-2 rounded-full ${
              !newMessage.trim() ? 'bg-gray-200' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            aria-label="envoyer"
          >
            <Send className={`w-5 h-5 ${!newMessage.trim() ? 'text-gray-400' : 'text-white'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
