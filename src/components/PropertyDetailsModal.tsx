import React from 'react';

type PropertyDetailsModalProps = {
  property: any; // Remplacez "any" par le type exact si défini
  onClose: () => void;
};

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({ property, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">{property.name}</h2>
        <p><strong>Address:</strong> {property.address}</p>
        <p><strong>ID:</strong> {property.id}</p>
        <p><strong>WiFi Name:</strong> {property.accessCodes?.wifi?.name || 'N/A'}</p>
        <p><strong>WiFi Password:</strong> {property.accessCodes?.wifi?.password || 'N/A'}</p>
        <p><strong>Door Code:</strong> {property.accessCodes?.door || 'N/A'}</p>
        <p><strong>Description:</strong> {property.description || 'No description available.'}</p>
        <p><strong>Check-in Time:</strong> {property.checkInTime || 'N/A'}</p>
        <p><strong>Check-out Time:</strong> {property.checkOutTime || 'N/A'}</p>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
