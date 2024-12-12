import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Properties from '../pages/desktop/Properties';
import Conversations from '../pages/Conversations';
import Settings from '../pages/Settings';
import MobileChat from '../pages/MobileChat';
import ChatSandbox from '../pages/ChatSandbox';
import EmergencyCases from '../pages/EmergencyCases';
import ConversationDetail from '../pages/ConversationDetail';

const DesktopLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="fixed inset-y-0 left-0 w-64">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto ml-64">
        <Routes>
          <Route path="/" element={<Properties />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/properties/:propertyId/conversations" element={<Conversations />} />
          <Route path="/properties/:propertyId/conversations/:conversationId" element={<ConversationDetail />} />
          <Route path="/emergency" element={<EmergencyCases />} />
          <Route path="/sandbox" element={<ChatSandbox />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <Outlet />
      </main>
    </div>
  );
};

export default DesktopLayout;
