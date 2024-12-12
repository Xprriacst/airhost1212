import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Property } from '../types';
import { propertyService } from '../services';

interface PropertyEditModalProps {
  property: Property;
  onClose: () => void;
  onSave: (updatedProperty: Property) => void;
}

const PropertyEditModal: React.FC<PropertyEditModalProps> = ({
  property,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: property.name,
    address: property.address,
    accessCodes: {
      wifi: {
        name: property.accessCodes.wifi.name,
        password: property.accessCodes.wifi.password,
      },
      door: property.accessCodes.door,
    },
    checkInTime: property.checkInTime,
    checkOutTime: property.checkOutTime,
    maxGuests: property.maxGuests,
    description: property.description || '',
    parkingInfo: property.parkingInfo || '',
    restaurants: property.restaurants || [],
    fastFood: property.fastFood || [],
    emergencyContacts: property.emergencyContacts || [],
    houseRules: property.houseRules,
    amenities: property.amenities,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updatedProperty = await propertyService.updateProperty(property.id, formData);
      if (updatedProperty) {
        onSave(updatedProperty);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  const handleArrayInput = (
    field: 'houseRules' | 'amenities' | 'restaurants' | 'fastFood' | 'emergencyContacts',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Edit Property</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">House Rules (comma-separated)</label>
              <textarea
                value={formData.houseRules.join(', ')}
                onChange={(e) => handleArrayInput('houseRules', e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Amenities (comma-separated)</label>
              <textarea
                value={formData.amenities.join(', ')}
                onChange={(e) => handleArrayInput('amenities', e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Parking Information</label>
              <textarea
                value={formData.parkingInfo}
                onChange={(e) => setFormData({ ...formData, parkingInfo: e.target.value })}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Restaurants (comma-separated)</label>
              <textarea
                value={formData.restaurants.join(', ')}
                onChange={(e) => handleArrayInput('restaurants', e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fast Food (comma-separated)</label>
              <textarea
                value={formData.fastFood.join(', ')}
                onChange={(e) => handleArrayInput('fastFood', e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contacts (comma-separated)</label>
              <textarea
                value={formData.emergencyContacts.join(', ')}
                onChange={(e) => handleArrayInput('emergencyContacts', e.target.value)}
                rows={2}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyEditModal;