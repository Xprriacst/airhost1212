import React, { useState } from 'react';
import { Link as LinkIcon, CheckCircle, XCircle } from 'lucide-react';
import type { Integration } from '../types';

const Integrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'lodgify',
      apiKey: '****************************',
      status: 'active',
      lastSync: '2024-03-10T15:30:00Z',
    },
    {
      id: '2',
      name: 'smoobu',
      apiKey: '',
      status: 'inactive',
      lastSync: '',
    },
  ]);

  const handleConnect = (id: string) => {
    // Implement connection logic
    console.log('Connect integration:', id);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(integrations.map(integration =>
      integration.id === id
        ? { ...integration, status: 'inactive' as const, apiKey: '', lastSync: '' }
        : integration
    ));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Integrations</h1>

      <div className="grid gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <LinkIcon className="w-8 h-8 text-gray-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 capitalize">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {integration.status === 'active'
                      ? `Last synced: ${new Date(integration.lastSync).toLocaleString()}`
                      : 'Not connected'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    integration.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {integration.status === 'active' ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  {integration.status}
                </span>

                {integration.status === 'active' ? (
                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(integration.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            {integration.status === 'active' && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-2">API Key</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={integration.apiKey}
                    readOnly
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {/* Implement regenerate key logic */}}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;