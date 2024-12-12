import React, { useState } from 'react';
import { useProperties } from '../../hooks/useProperties';
import PropertySelect from '../../components/PropertySelect';
import GeneralSettings from './components/GeneralSettings';
import AIInstructions from './components/AIInstructions';
import { Cog, Zap } from 'lucide-react';

const PropertySettings: React.FC = () => {
  const { properties, isLoading, error } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Property Settings</h1>

      <div className="mb-6">
        <PropertySelect
          properties={properties}
          selectedProperty={selectedProperty}
          onSelect={setSelectedProperty}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {selectedProperty && (
        <>
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 font-medium text-sm border-b-2 ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cog className="w-4 h-4" />
                  General Settings
                </div>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 font-medium text-sm border-b-2 ${
                  activeTab === 'ai'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  AI Instructions
                </div>
              </button>
            </nav>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {activeTab === 'general' ? (
              <GeneralSettings property={selectedProperty} />
            ) : (
              <AIInstructions property={selectedProperty} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertySettings;