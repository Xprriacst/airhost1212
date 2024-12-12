import React, { useState } from 'react';
import type { ConversationScenario } from '../types';

interface ScenarioBuilderProps {
  scenario?: ConversationScenario;
  onSave: (scenario: Omit<ConversationScenario, 'id'>) => void;
}

const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ scenario, onSave }) => {
  const [form, setForm] = useState({
    name: scenario?.name || '',
    trigger: scenario?.trigger || '',
    response: scenario?.response || '',
    category: scenario?.category || 'faq',
    variables: scenario?.variables || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">Scenario Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., WiFi Password Request"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Trigger Message</label>
        <input
          type="text"
          value={form.trigger}
          onChange={(e) => setForm({ ...form, trigger: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., What's the WiFi password?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Response Template</label>
        <textarea
          value={form.response}
          onChange={(e) => setForm({ ...form, response: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Hello {guest_name}, the WiFi password is {wifi_password}..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as ConversationScenario['category'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="welcome">Welcome</option>
          <option value="checkin">Check-in</option>
          <option value="checkout">Check-out</option>
          <option value="faq">FAQ</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Variables</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {form.variables.map((variable, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {variable}
              <button
                type="button"
                onClick={() => setForm({
                  ...form,
                  variables: form.variables.filter((_, i) => i !== index)
                })}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              const variable = prompt('Enter variable name (e.g., guest_name):');
              if (variable) {
                setForm({
                  ...form,
                  variables: [...form.variables, variable]
                });
              }
            }}
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            + Add Variable
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Scenario
        </button>
      </div>
    </form>
  );
};

export default ScenarioBuilder;