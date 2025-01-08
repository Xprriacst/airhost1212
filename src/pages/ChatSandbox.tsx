import React, { useState } from 'react';
import { Send, RefreshCw, Calendar, Clock, User, Settings2, MessageSquare } from 'lucide-react';
import type { Message, Property } from '../types';
import type { BookingContext, AIConfig } from '../services/ai/types';
import { aiService } from '../services/ai/aiService';
import ChatMessage from '../components/ChatMessage';
import PropertySelect from '../components/PropertySelect';
import { useProperties } from '../hooks/useProperties';

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

  const clearChat = () => {
    setMessages([]);
  };

  const handleAddSpecialRequest = () => {
    const request = prompt('Entrez une demande spéciale:');
    if (request) {
      setSpecialRequests(prev => [...prev, request]);
    }
  };

  return (
    <div className="p-2 sm:p-6 mx-auto max-w-4xl h-screen overflow-y-auto flex flex-col">
      <div className="mb-6 flex-shrink-0">
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900">A une réservation</span>
            </label>
          </div>

          {hasBooking && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="block text-sm text-gray-700">Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="mt-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="block text-sm text-gray-700">Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="mt-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="block text-sm text-gray-700">Nombre d'invités</label>
                    <input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value))}
                      min="1"
                      className="mt-1 w-20 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">Demandes spéciales</label>
                  <div className="flex flex-wrap gap-2">
                    {specialRequests.map((request, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {request}
                        <button
                          onClick={() => setSpecialRequests(prev => prev.filter((_, i) => i !== index))}
                          className="hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={handleAddSpecialRequest}
                      className="px-2 py-1 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50"
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Langue</label>
                  <select
                    value={aiConfig.language}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, language: e.target.value as 'fr' | 'en' }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ton</label>
                  <select
                    value={aiConfig.tone}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, tone: e.target.value as 'formal' | 'casual' | 'friendly' }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="formal">Formel</option>
                    <option value="casual">Décontracté</option>
                    <option value="friendly">Amical</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiConfig.shouldIncludeEmoji}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, shouldIncludeEmoji: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900">Inclure des emojis</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Longueur max.</label>
                  <input
                    type="number"
                    value={aiConfig.maxResponseLength}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, maxResponseLength: parseInt(e.target.value) }))}
                    min="50"
                    max="500"
                    step="50"
                    className="w-20 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedProperty && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 flex-1 min-h-[400px] flex flex-col">
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedProperty.name}</h2>
                <p className="text-sm text-gray-500">{selectedProperty.address}</p>
              </div>
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="w-4 h-4" />
                Effacer la conversation
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isGenerating && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                L'IA est en train d'écrire...
              </div>
            )}
          </div>

          <div className="p-4 border-t space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={messageDate}
                  onChange={(e) => setMessageDate(e.target.value)}
                  className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={messageTime}
                  onChange={(e) => setMessageTime(e.target.value)}
                  className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tapez un message..."
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isGenerating}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSandbox;