import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import ConversationDetail from './pages/ConversationDetail';
import Properties from './pages/desktop/Properties';
import Conversations from './pages/Conversations';
import Settings from './pages/Settings';
import ChatSandbox from './pages/ChatSandbox';
import EmergencyCases from './pages/EmergencyCases';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      <Routes>
        {isMobile ? (
          <Route path="/*" element={<MobileLayout />}>
            <Route index element={<Conversations />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="settings" element={<Settings />} />
            <Route path="chat-sandbox" element={<ChatSandbox />} />
            <Route path="emergency-cases" element={<EmergencyCases />} />
            <Route path="properties" element={<Properties />} />
            <Route path="properties/:propertyId/conversations/:conversationId" element={<ConversationDetail />} />
          </Route>
        ) : (
          <Route path="/*" element={<DesktopLayout />}>
            <Route index element={<Conversations />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="settings" element={<Settings />} />
            <Route path="chat-sandbox" element={<ChatSandbox />} />
            <Route path="emergency-cases" element={<EmergencyCases />} />
            <Route path="properties/:propertyId/conversations/:conversationId" element={<ConversationDetail />} />
            <Route path="properties" element={<Properties />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
};

export default App;
