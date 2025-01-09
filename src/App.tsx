import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import { Home, Building2, MessageSquare, AlertTriangle, Sparkles, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import Properties from './pages/Properties';
import Conversations from './pages/Conversations';
import ConversationDetail from './pages/ConversationDetail';
import Settings from './pages/Settings';
import ChatSandbox from './pages/ChatSandbox';
import EmergencyCases from './pages/EmergencyCases';

const AppContent = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Ajouter les meta viewport pour le mobile
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.getElementsByTagName('head')[0].appendChild(meta);
  }, []);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const showMobileMenu = isMobile && !location.pathname.includes('/conversations/');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar - toujours visible et fixe à gauche */}
      {!isMobile && (
        <aside className="w-64 bg-gray-900 text-white flex-shrink-0">
          <nav className="h-full flex flex-col py-6">
            <div className="flex items-center px-6 py-2 text-white">
              <Home className="w-5 h-5 mr-3" />
              AirHost Admin
            </div>
            
            <div className="mt-6 space-y-1">
              <Link to="/conversations" className="flex items-center px-6 py-2 text-gray-300 hover:bg-gray-800 hover:text-white">
                <MessageSquare className="w-5 h-5 mr-3" />
                Conversations
              </Link>
              <Link to="/properties" className="flex items-center px-6 py-2 text-gray-300 hover:bg-gray-800 hover:text-white">
                <Building2 className="w-5 h-5 mr-3" />
                Propriétés
              </Link>
              <Link to="/emergency-cases" className="flex items-center px-6 py-2 text-gray-300 hover:bg-gray-800 hover:text-white">
                <AlertTriangle className="w-5 h-5 mr-3" />
                Cas d'urgence
              </Link>
              <Link to="/chat-sandbox" className="flex items-center px-6 py-2 text-gray-300 hover:bg-gray-800 hover:text-white">
                <Sparkles className="w-5 h-5 mr-3" />
                Chat Sandbox
              </Link>
            </div>

            <Link to="/settings" className="flex items-center px-6 py-2 mt-auto text-gray-300 hover:bg-gray-800 hover:text-white">
              <SettingsIcon className="w-5 h-5 mr-3" />
              Paramètres
            </Link>
          </nav>
        </aside>
      )}

      {/* Mobile Header avec hamburger */}
      {showMobileMenu && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-20 flex items-center justify-between px-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-50 rounded-full"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <span className="absolute left-1/2 transform -translate-x-1/2 text-xl font-semibold">
            AirHost
          </span>
          <div className="w-10" /> {/* Spacer pour centrer le titre */}
        </div>
      )}

      {/* Mobile Menu - s'ouvre sur la gauche */}
      {showMobileMenu && (
        <div className={`
          fixed top-0 left-0 h-full w-80 bg-white z-30 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-xl font-medium">Menu</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>
          <nav className="py-2">
            <Link to="/properties" 
              className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-100" 
              onClick={handleLinkClick}
            >
              <Building2 className="w-6 h-6 mr-3 text-gray-500" />
              <span className="text-lg">Properties</span>
            </Link>
            <Link to="/conversations" 
              className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-100" 
              onClick={handleLinkClick}
            >
              <MessageSquare className="w-6 h-6 mr-3 text-gray-500" />
              <span className="text-lg">Conversations</span>
            </Link>
            <Link to="/emergency-cases" 
              className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-100" 
              onClick={handleLinkClick}
            >
              <AlertTriangle className="w-6 h-6 mr-3 text-gray-500" />
              <span className="text-lg">Emergency Cases</span>
            </Link>
            <Link to="/chat-sandbox" 
              className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-100" 
              onClick={handleLinkClick}
            >
              <Sparkles className="w-6 h-6 mr-3 text-gray-500" />
              <span className="text-lg">Chat Sandbox</span>
            </Link>
            <Link to="/settings" 
              className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-100" 
              onClick={handleLinkClick}
            >
              <SettingsIcon className="w-6 h-6 mr-3 text-gray-500" />
              <span className="text-lg">Settings</span>
            </Link>
          </nav>
        </div>
      )}

      {/* Overlay pour mobile */}
      {showMobileMenu && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className={`flex-1 flex flex-col ${showMobileMenu ? 'mt-14' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/conversations" replace />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/properties/:propertyId/conversations/:conversationId" element={<ConversationDetail />} />
          <Route path="/emergency-cases" element={<EmergencyCases />} />
          <Route path="/chat-sandbox" element={<ChatSandbox />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
