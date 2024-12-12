import React, { useState } from 'react';
import { X } from 'lucide-react';
import { airtableService } from '../services/airtableService';
import type { Property } from '../types';

interface PropertyFormProps {
  property?: Property;
  onClose: () => void;
  onSave: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ property, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: property?.name || '',
    address: property?.address || '',
    checkInTime: property?.checkInTime || '15:00',
    checkOutTime: property?.checkOutTime || '11:00',
    maxGuests: property?.maxGuests || 2,
    accessCodes: property?.accessCodes || {
      wifi: {
        name: '',
        password: ''
      },
      door: ''
    },
    amenities: property?.amenities || [],
    houseRules: property?.houseRules || [],
    photos: property?.photos || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (property?.id) {
        await airtableService.updateProperty(property.id, formData);
      } else {
        await airtableService.createProperty(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving property:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while saving the property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Property Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Check-in Time</label>
              <input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Check-out Time</label>
              <input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Maximum Guests</label>
            <input
              type="number"
              value={formData.maxGuests}
              onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) })}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Access Codes</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">WiFi Network Name</label>
              <input
                type="text"
                value={formData.accessCodes.wifi.name}
                onChange={(e) => setFormData({
                  ...formData,
                  accessCodes: {
                    ...formData.accessCodes,
                    wifi: {
                      ...formData.accessCodes.wifi,
                      name: e.target.value
                    }
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">WiFi Password</label>
              <input
                type="text"
                value={formData.accessCodes.wifi.password}
                onChange={(e) => setFormData({
                  ...formData,
                  accessCodes: {
                    ...formData.accessCodes,
                    wifi: {
                      ...formData.accessCodes.wifi,
                      password: e.target.value
                    }
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Door Code</label>
              <input
                type="text"
                value={formData.accessCodes.door}
                onChange={(e) => setFormData({
                  ...formData,
                  accessCodes: {
                    ...formData.accessCodes,
                    door: e.target.value
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : property ? 'Save Changes' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;