import React, { useState } from 'react';
import { Settings2, User } from 'lucide-react';
import type { Message, Property } from '../../types';
import type { BookingContext, AIConfig } from '../../services/ai/types';
import { aiService } from '../../services/ai/aiService';
import PropertySelect from '../../components/PropertySelect';
import { useProperties } from '../../hooks/useProperties';
import BookingContext from './components/BookingContext';
import AISettings from './components/AISettings';
import ChatInterface from './components/ChatInterface';

const ChatSandbox: React.FC = () => {
  const { properties, isLoading: loadingProperties, error: propertiesError } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Contexte temporel
  const [messageDate, setMessageDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [messageTime, setMessageTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  
  // Contexte de réservation
  const [hasBooking, setHasBooking] = useState(false);
  const [checkIn, setCheckIn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [guestCount, setGuestCount] = useState<number>(2);
  const [specialRequests, setSpecialRequests] = useState<string[]>([]);

  // Configuration de l'IA
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    language: 'fr',
    tone: 'friendly',
    shouldIncludeEmoji: true,
    maxResponseLength: 150
  });

  // Affichage des paramètres avancés
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedProperty) return;

    const messageTimestamp = new Date(`${messageDate}T${messageTime}`);
    const guestMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      isUser: false,
      timestamp: messageTimestamp,
      sender: 'Guest'
    };

    setMessages(prev => [...prev, guestMessage]);
    setNewMessage('');
    setIsGenerating(true);

    try {
      const bookingContext: BookingContext = {
        hasBooking,
        checkIn: hasBooking ? checkIn : undefined,
        checkOut: hasBooking ? checkOut : undefined,
        guestCount: hasBooking ? guestCount : undefined,
        specialRequests: hasBooking ? specialRequests : undefined
      };

      const response = await aiService.generateResponse(
        guestMessage,
        selectedProperty,
        bookingContext,
        messages,
        aiConfig
      );
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: true,
        timestamp: new Date(messageTimestamp.getTime() + 1000),
        sender: 'AI Assistant'
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Chat Sandbox</h1>
        <p className="text-gray-600 mb-4">
          Testez les réponses de l'IA pour différentes propriétés et contextes.
        </p>
        
        <div className="space-y-4">
          <PropertySelect
            properties={properties}
            selectedProperty={selectedProperty}
            onSelect={setSelectedProperty}
            isLoading={loadingProperties}
            error={propertiesError}
            hideSelectedInfo={true}
          />

          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasBooking}
                onChange={(e) => setHasBooking(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900">A une réservation</span>
            </label>
          </div>

          {hasBooking && (
            <BookingContext
              checkIn={checkIn}
              checkOut={checkOut}
              guestCount={guestCount}
              specialRequests={specialRequests}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              onGuestCountChange={setGuestCount}
              onSpecialRequestsChange={setSpecialRequests}
            />
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Settings2 className="w-5 h-5" />
              <span>Paramètres avancés</span>
            </button>
          </div>

          {showAdvancedSettings && (
            <AISettings
              config={aiConfig}
              onChange={setAiConfig}
            />
          )}
        </div>
      </div>

      {selectedProperty && (
        <ChatInterface
          property={selectedProperty}
          messages={messages}
          isGenerating={isGenerating}
          messageDate={messageDate}
          messageTime={messageTime}
          newMessage={newMessage}
          onMessageDateChange={setMessageDate}
          onMessageTimeChange={setMessageTime}
          onNewMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          onClearChat={() => setMessages([])}
        />
      )}
    </div>
  );
};

export default ChatSandbox;