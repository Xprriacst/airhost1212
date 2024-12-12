import React from 'react';
import type { AIConfig } from '../../../services/ai/types';

interface AISettingsProps {
  config: AIConfig;
  onChange: (config: AIConfig) => void;
}

const AISettings: React.FC<AISettingsProps> = ({ config, onChange }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Langue</label>
          <select
            value={config.language}
            onChange={(e) => onChange({ ...config, language: e.target.value as 'fr' | 'en' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ton</label>
          <select
            value={config.tone}
            onChange={(e) => onChange({ ...config, tone: e.target.value as 'formal' | 'casual' | 'friendly' })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="formal">Formel</option>
            <option value="casual">Décontracté</option>
            <option value="friendly">Amical</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.shouldIncludeEmoji}
            onChange={(e) => onChange({ ...config, shouldIncludeEmoji: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900">Inclure des emojis</span>
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Longueur max.</label>
          <input
            type="number"
            value={config.maxResponseLength}
            onChange={(e) => onChange({ ...config, maxResponseLength: parseInt(e.target.value) })}
            min="50"
            max="500"
            step="50"
            className="w-20 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default AISettings;