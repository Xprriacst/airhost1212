import React, { useState } from 'react';
import { Settings2, User, Calendar, Clock, Send, RefreshCw } from 'lucide-react';
import type { Message, Property } from '../types';
import type { BookingContext, AIConfig } from '../services/ai/types';
import { aiService } from '../services/ai/aiService';
import ChatMessage from '../components/ChatMessage';
import PropertySelect from '../components/PropertySelect';
import { useProperties } from '../hooks/useProperties';

const ChatSandbox: React.FC = () => {
  // ... state declarations restent identiques ...

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header fixe */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">Chat Sandbox</h1>
        <p className="text-sm text-gray-600 mt-1">
          Testez les réponses de l'IA pour différentes propriétés et contextes.
        </p>
      </div>

      {/* Zone de configuration scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <PropertySelect
            properties={properties}
            selectedProperty={selectedProperty}
            onSelect={setSelectedProperty}
            isLoading={loadingProperties}
            error={propertiesError}
            hideSelectedInfo={true}
          />

          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm text-gray-700">Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm text-gray-700">Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
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

                <div className="flex-1 min-w-0">
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

          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Settings2 className="w-5 h-5" />
            <span>Paramètres avancés</span>
          </button>

          {showAdvancedSettings && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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

        {selectedProperty && (
          <div className="border-t bg-white">
            <div className="p-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedProperty.name}</h2>
                  <p className="text-sm text-gray-500">{selectedProperty.address}</p>
                </div>
                <button
                  onClick={() => setMessages([])}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  <RefreshCw className="w-4 h-4" />
                  Effacer la conversation
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
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
              <div className="flex flex-wrap gap-4">
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
    </div>
  );
};

export default ChatSandbox;
