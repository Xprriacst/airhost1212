import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import ConversationDetail from './pages/ConversationDetail';

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
        <Route path="/*" element={isMobile ? <MobileLayout /> : <DesktopLayout />}>
          <Route path="properties/:propertyId/conversations/:conversationId" element={<ConversationDetail />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
