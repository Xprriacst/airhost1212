import React from 'react';
import { Zap, MessageSquare } from 'lucide-react';
import type { Property, Conversation } from '../types';

interface PropertyListProps {
  properties: Property[];
  autoPilotSettings: Record<string, boolean>;
  conversations: Conversation[];
  onSelectProperty: (property: Property) => void;
  onToggleAutoPilot: (propertyId: string) => void;
}

const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  autoPilotSettings,
  conversations,
  onSelectProperty,
  onToggleAutoPilot,
}) => {
  const getPropertyConversations = (propertyId: string) => {
    return conversations.filter(c => c.propertyId === propertyId);
  };

  return (
    <div className="h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">My Properties</h1>
      </header>

      <div className="p-4 space-y-4">
        {properties.map((property) => {
          const propertyConversations = getPropertyConversations(property.id);
          const isAutoPilot = autoPilotSettings[property.id];

          return (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="relative h-48">
                <img
                  src={property.photos[0]}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAutoPilot(property.id);
                  }}
                  className={`absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    isAutoPilot
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/90 text-gray-700'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isAutoPilot ? 'Auto-pilot ON' : 'Auto-pilot OFF'}
                  </span>
                </button>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {property.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{property.address}</p>
                    <div className="flex gap-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {propertyConversations.length} conversations
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectProperty(property)}
                  className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  View Conversations
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyList;