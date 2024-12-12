import React, { useState } from 'react';
import { Building2, MapPin, FileText, Image as ImageIcon } from 'lucide-react';
import type { Property } from '../../../types';
import { propertyService } from '../../../services';

interface GeneralSettingsProps {
  property: Property;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ property }) => {
  const [formData, setFormData] = useState({
    name: property.name,
    address: property.address,
    description: property.description || '',
    photos: property.photos || [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await propertyService.updateProperty(property.id, formData);
      setSuccess('Property settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Property Name
            </div>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </div>
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </div>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos
            </div>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {formData.photos.map((photo, index) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                <img
                  src={photo}
                  alt={`Property ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    photos: formData.photos.filter((_, i) => i !== index)
                  })}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const url = prompt('Enter photo URL:');
                if (url) {
                  setFormData({
                    ...formData,
                    photos: [...formData.photos, url]
                  });
                }
              }}
              className="flex items-center justify-center aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100"
            >
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default GeneralSettings;