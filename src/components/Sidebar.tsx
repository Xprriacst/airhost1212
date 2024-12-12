import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Settings, TestTube, AlertTriangle } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: Home, label: 'Propriétés', path: '/' },
    { icon: MessageSquare, label: 'Conversations', path: '/conversations' },
    { icon: AlertTriangle, label: "Cas d'urgence", path: '/emergency' },
    { icon: TestTube, label: 'Chat Sandbox', path: '/sandbox' },
    { icon: Settings, label: 'Paramètres', path: '/settings' },
  ];

  return (
    <div className="h-full bg-gray-900 text-white p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Home className="w-8 h-8 text-blue-400" />
        <h1 className="text-xl font-bold">AirHost Admin</h1>
      </div>
      
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
