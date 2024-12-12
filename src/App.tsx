import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import ConversationDetail from './pages/ConversationDetail';

const App: React.FC = () => {
  const isMobile = window.innerWidth <= 768;

  return (
    <Router>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <Routes>
          <Route path="/*" element={<DesktopLayout />}>
            <Route path="properties/:propertyId/conversations/:conversationId" element={<ConversationDetail />} />
          </Route>
        </Routes>
      )}
    </Router>
  );
};

export default App;
