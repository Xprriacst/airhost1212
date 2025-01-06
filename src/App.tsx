import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { Home, Building2, MessageSquare, AlertTriangle, Sparkles, Settings as SettingsIcon, Menu } from 'lucide-react';
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

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Mobile hamburger menu */}
        {isMobile && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-4 left-4 z-20 p-2 bg-gray-900 text-white rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Sidebar - avec gestion mobile */}
        <div className={`
          ${isMobile ? 'fixed' : ''} 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64 bg-gray-900 text-white h-full transition-transform duration-200 ease-in-out z-10
        `}>
          <nav className={`mt-5 ${isMobile ? 'mt-16' : ''}`}>
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

        {/* Overlay pour fermer le menu sur mobile */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-0"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content - avec gestion mobile */}
        <div className={`flex-1 ${!isMobile ? 'ml-64' : ''}`}>
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
