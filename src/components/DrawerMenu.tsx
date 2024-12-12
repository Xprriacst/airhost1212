import React from 'react';
import { X, Home, MessageSquare, Settings } from 'lucide-react';
import type { Property, Conversation } from '../types';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  conversations: Conversation[];
  selectedProperty: Property | null;
  selectedConversation: string | null;
  onSelectProperty: (property: Property) => void;
  onSelectConversation: (conversationId: string) => void;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  properties,
  conversations,
  selectedProperty,
  selectedConversation,
  onSelectProperty,
  onSelectConversation,
}) => {
  const menuItems = [
    { icon: Home, label: 'Properties', path: '/' },
    { icon: MessageSquare, label: 'All Messages', path: '/conversations' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">AirHost</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {/* Main Navigation */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  onClose();
                  // Handle navigation here
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <item.icon className="w-5 h-5 text-gray-500" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Active Properties */}
          {properties.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="px-4 text-sm font-medium text-gray-500 mb-2">My Properties</h3>
              <div className="space-y-1">
                {properties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => {
                      onSelectProperty(property);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 ${
                      selectedProperty?.id === property.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Home className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{property.name}</p>
                      <p className="text-xs text-gray-500">
                        {conversations.filter(c => c.propertyId === property.id).length} active conversations
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Conversations */}
          {conversations.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="px-4 text-sm font-medium text-gray-500 mb-2">Recent Messages</h3>
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 ${
                      selectedConversation === conv.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{conv.guestName}</p>
                      <p className="text-xs text-gray-500">
                        {properties.find(p => p.id === conv.propertyId)?.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawerMenu;