import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ScenarioBuilder from '../components/ScenarioBuilder';
import type { ConversationScenario } from '../types';

const Scenarios = () => {
  const [scenarios, setScenarios] = useState<ConversationScenario[]>([
    {
      id: '1',
      name: 'WiFi Password Request',
      trigger: 'what is the wifi password',
      response: 'Hello {guest_name}, the WiFi password for {property_name} is {wifi_password}. Enjoy your stay!',
      variables: ['guest_name', 'property_name', 'wifi_password'],
      category: 'faq',
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);

  const handleSave = (newScenario: Omit<ConversationScenario, 'id'>) => {
    setScenarios([
      ...scenarios,
      {
        ...newScenario,
        id: Date.now().toString(),
      },
    ]);
    setIsCreating(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversation Scenarios</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Scenario
        </button>
      </div>

      {isCreating && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Scenario</h2>
          <ScenarioBuilder onSave={handleSave} />
        </div>
      )}

      <div className="grid gap-6">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{scenario.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {scenario.category}
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Edit</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-red-500">
                  <span className="sr-only">Delete</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Trigger</label>
                <p className="mt-1 text-sm text-gray-900">{scenario.trigger}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Response Template</label>
                <p className="mt-1 text-sm text-gray-900">{scenario.response}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Variables</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {scenario.variables.map((variable) => (
                    <span
                      key={variable}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scenarios;