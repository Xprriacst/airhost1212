import React from 'react';
import { Building2 } from 'lucide-react';
import type { Property } from '../types';

interface PropertySelectProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelect: (property: Property | null) => void;
  isLoading?: boolean;
  error?: string | null;
  hideSelectedInfo?: boolean;
}

const PropertySelect: React.FC<PropertySelectProps> = ({
  properties,
  selectedProperty,
  onSelect,
  isLoading,
  error,
  hideSelectedInfo = false
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        Loading properties...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <select
          value={selectedProperty?.id || ''}
          onChange={(e) => {
            const property = properties.find(p => p.id === e.target.value);
            onSelect(property || null);
          }}
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select a property</option>
          {properties.map(property => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProperty && !hideSelectedInfo && (
        <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span className="text-sm font-medium">{selectedProperty.name}</span>
        </div>
      )}
    </div>
  );
};

export default PropertySelect;