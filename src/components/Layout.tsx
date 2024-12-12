import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import DrawerMenu from './DrawerMenu';
import type { Property, Conversation } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  properties: Property[];
  conversations: Conversation[];
  selectedProperty: Property | null;
  selectedConversation: string | null;
  onSelectProperty: (property: Property) => void;
  onSelectConversation: (conversationId: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  properties,
  conversations,
  selectedProperty,
  selectedConversation,
  onSelectProperty,
  onSelectConversation,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">AirHost</h1>
      </nav>

      {/* Drawer Menu */}
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        properties={properties}
        conversations={conversations}
        selectedProperty={selectedProperty}
        selectedConversation={selectedConversation}
        onSelectProperty={onSelectProperty}
        onSelectConversation={onSelectConversation}
      />

      {/* Main Content */}
      <main className="h-[calc(100vh-56px)]">
        {children}
      </main>
    </div>
  );
};

export default Layout;