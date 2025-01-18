import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyService } from '../services';
import PropertyEditModal from '../components/PropertyEditModal';
import PropertyDetailsModal from '../components/PropertyDetailsModal';
import { Property } from '../types';

const Properties: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailsProperty, setDetailsProperty] = useState<Property | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProperties = await propertyService.getProperties();
      setProperties(fetchedProperties);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load properties. Please try again later.');
      setLoading(false);
    }
  };

  const handleViewDetails = (property: Property) => {
    setDetailsProperty(property);
  };

  const handleSave = async (updatedProperty: Property) => {
    try {
      const result = await propertyService.updateProperty(updatedProperty.id, updatedProperty);
      if (result) {
        setProperties((prev) =>
          prev.map((p) => (p.id === updatedProperty.id ? result : p))
        );
        setSelectedProperty(null);
      }
    } catch (err) {
      console.error('Error updating property:', err);
      setError(err instanceof Error ? err.message : 'Failed to update property');
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyService.deleteProperty(propertyId);
        setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      } catch (err) {
        console.error('Error deleting property:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete property');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={fetchProperties}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-gray-600 text-xl">
          No properties available
        </div>
        <p className="text-gray-500 mt-2">
          You don't have access to any properties yet.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div
            key={property.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{property.name}</h3>
              <p className="text-gray-600 mb-4">{property.address}</p>
              <div className="flex justify-between">
                <button
                  onClick={() => handleViewDetails(property)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  View Details
                </button>
                <button
                  onClick={() => setSelectedProperty(property)}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(property.id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProperty && (
        <PropertyEditModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onSave={handleSave}
        />
      )}

      {detailsProperty && (
        <PropertyDetailsModal
          property={detailsProperty}
          onClose={() => setDetailsProperty(null)}
        />
      )}
    </div>
  );
};

export default Properties;
