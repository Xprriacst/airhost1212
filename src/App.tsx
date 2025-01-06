import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import ConversationDetail from './pages/ConversationDetail';
import Properties from './pages/desktop/Properties';
import Conversations from './pages/Conversations';
import Settings from './pages/Settings';
import ChatSandbox from './pages/ChatSandbox';
import EmergencyCases from './pages/EmergencyCases';
import Home from './icons/Home';
import Building2 from './icons/Building2';
import MessageSquare from './icons/MessageSquare';
import AlertTriangle from './icons/AlertTriangle';
import Sparkles from './icons/Sparkles';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar - maintenant avec une largeur fixe et position fixe */}
        <div className="w-64 bg-gray-900 text-white fixed h-full">
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
                <Settings className="w-5 h-5 mr-3" />
                Paramètres
              </Link>
            </div>
          </nav>
        </div>

        {/* Main content - avec un margin-left pour compenser le sidebar fixe */}
        <div className="flex-1 ml-64">
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
