import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { propertyService } from '../services';
import PropertyEditModal from '../components/PropertyEditModal';
import PropertyDetailsModal from '../components/PropertyDetailsModal';

const Properties: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [detailsProperty, setDetailsProperty] = useState<any | null>(null); // For showing details

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const fetchedProperties = await propertyService.getProperties();
      setProperties(fetchedProperties);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (property: any) => {
    setDetailsProperty(property); // Set the property to show in the modal
  };

  const handleSave = async (updatedProperty: any) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === updatedProperty.id ? updatedProperty : p))
    );
    setSelectedProperty(null); // Close edit modal
  };

  const handleDelete = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyService.deleteProperty(propertyId);
        setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      } catch (err) {
        console.error('Error deleting property:', err);
        setError('Failed to delete property. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        <button
          onClick={() => setSelectedProperty(null)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties</h3>
          <p className="text-gray-500">Start by adding your first property.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer"
              onClick={() => handleViewDetails(property)} // Open the details modal
            >
              <div className="relative h-48">
                <img
                  src={
                    property.photos?.[0] ||
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6'
                  }
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900">{property.name}</h3>
                <p className="text-gray-600">{property.address}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(property.id);
                  }}
                  className="text-red-600 hover:underline mt-2 block"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {detailsProperty && (
        <PropertyDetailsModal
          property={detailsProperty}
          onClose={() => setDetailsProperty(null)}
        />
      )}

      {/* Edit Modal */}
      {selectedProperty && (
        <PropertyEditModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Properties;
