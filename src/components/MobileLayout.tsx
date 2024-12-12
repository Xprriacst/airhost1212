import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Home, MessageSquare, Settings as SettingsIcon, TestTube, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import Properties from '../pages/desktop/Properties';
import Conversations from '../pages/Conversations';
import MobileChat from '../pages/MobileChat';
import Settings from '../pages/Settings';
import ChatSandbox from '../pages/ChatSandbox';
import EmergencyCases from '../pages/EmergencyCases';

const MobileLayout: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const showBackButton = location.pathname !== '/';

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
        {showBackButton ? (
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
        ) : (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">AirHost</h1>
      </header>

      {/* Drawer Menu */}
      <div
        className={`fixed inset-0 z-50 ${
          isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isDrawerOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={() => setIsDrawerOpen(false)}
        />

        <div
          className={`absolute inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => handleNavigation('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <Home className="w-5 h-5" />
              <span>Propriétés</span>
            </button>

            <button
              onClick={() => handleNavigation('/conversations')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Conversations</span>
            </button>

            <button
              onClick={() => handleNavigation('/emergency')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Cas d'urgence</span>
            </button>

            <button
              onClick={() => handleNavigation('/sandbox')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <TestTube className="w-5 h-5" />
              <span>Chat Sandbox</span>
            </button>

            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Paramètres</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Properties />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/conversations/:propertyId" element={<Conversations />} />
          <Route path="/chat/:conversationId" element={<MobileChat />} />
          <Route path="/emergency" element={<EmergencyCases />} />
          <Route path="/sandbox" element={<ChatSandbox />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
};

export default MobileLayout;