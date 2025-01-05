import React, { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Menu, Home, MessageSquare, Settings as SettingsIcon, TestTube, AlertTriangle, X, ArrowLeft } from 'lucide-react';

const MobileLayout: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Vérifier si nous sommes sur une page de conversation
  const isConversationPage = location.pathname.includes('/conversations/');
  const showBackButton = location.pathname !== '/';

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] flex flex-col bg-gray-50 fixed inset-0">
      {/* Header - Ne pas afficher sur la page de conversation */}
      {!isConversationPage && (
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
      )}

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
          className={`absolute inset-y-0 left-0 w-64 bg-white transform transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Menu</h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavigation('/conversations')}
                  className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Conversations</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/')}
                  className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Home className="w-5 h-5" />
                  <span>Propriétés</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/settings')}
                  className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg"
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span>Paramètres</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/chat-sandbox')}
                  className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg"
                >
                  <TestTube className="w-5 h-5" />
                  <span>Chat Sandbox</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/emergency-cases')}
                  className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Cas d'urgence</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-hidden ${isConversationPage ? 'h-full' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default MobileLayout;