import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MessageSquare, Users, Clock, Wifi } from 'lucide-react';
import { propertyService } from '../../services';

const Properties: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const data = await propertyService.getProperties();
        setProperties(data);
      } catch (error) {
        setError('Failed to load properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const handleDelete = async (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyService.deleteProperty(propertyId);
        setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      } catch (err) {
        setError('Failed to delete property. Please try again.');
      }
    }
  };

  const handleViewConversations = (propertyId: string) => {
    navigate(`/properties/${propertyId}/conversations`);
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
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        <button
          onClick={() => setShowForm(true)}
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
            <div key={property.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-48">
                <img
                  src={property.photos?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6'}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => handleDelete(property.id, e)}
                  className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900">{property.name}</h3>
                <p className="text-gray-600">{property.address}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Max {property.maxGuests} guests</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Check-in: {property.checkInTime}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleViewConversations(property.id)}
                  className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  View Conversations
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Properties;