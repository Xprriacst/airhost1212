import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { Home, Building2, MessageSquare, AlertTriangle, Sparkles, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import Properties from './pages/Properties';
import Conversations from './pages/Conversations';
import ConversationDetail from './pages/ConversationDetail';
import Settings from './pages/Settings';
import ChatSandbox from './pages/ChatSandbox';
import EmergencyCases from './pages/EmergencyCases';

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Desktop Sidebar - toujours visible et fixe à gauche */}
        {!isMobile && (
          <div className="fixed left-0 top-0 w-64 h-full bg-gray-900 text-white z-10">
            <nav className="mt-5">
              <Link to="/" className="flex items-center px-6 py-3 text-lg font-medium">
                <Home className="w-5 h-5 mr-3" />
                AirHost Admin
              </Link>
              <div className="mt-5">
                <Link to="/properties" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
                  <Building2 className="w-5 h-5 mr-3" />
                  Propriétés
                </Link>
                <Link to="/conversations" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Conversations
                </Link>
                <Link to="/emergency-cases" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
                  <AlertTriangle className="w-5 h-5 mr-3" />
                  Cas d'urgence
                </Link>
                <Link to="/chat-sandbox" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
                  <Sparkles className="w-5 h-5 mr-3" />
                  Chat Sandbox
                </Link>
                <Link to="/settings" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
                  <SettingsIcon className="w-5 h-5 mr-3" />
                  Paramètres
                </Link>
              </div>
            </nav>
          </div>
        )}

        {/* Mobile Header avec hamburger */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20 px-4 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        )}

        {/* Mobile Menu - s'ouvre sur la gauche */}
        {isMobile && (
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
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className={`flex-1 ${!isMobile ? 'ml-64' : 'mt-16'} relative`}>
          <Routes>
            <Route path="/" element={<Navigate to="/conversations" replace />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/properties/:propertyId/conversations/:conversationId" element={<ConversationDetail />} />
            <Route path="/emergency-cases" element={<EmergencyCases />} />
            <Route path="/chat-sandbox" element={<ChatSandbox />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
