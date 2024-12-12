import React, { useEffect, useState } from 'react';
import { propertyService } from '../services/airtable/propertyService';

type Property = {
  id: string;
  name: string;
  address: string;
  accessCodes: {
    wifi: { name: string; password: string };
    door: string;
  };
};

const PropertyDetails: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const fetchedProperties = await propertyService.getProperties();
        setProperties(fetchedProperties);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to fetch properties from Airtable.');
      }
    };

    fetchProperties();
  }, []);

  if (error) {
    return <p>{error}</p>;
  }

  if (!properties.length) {
    return <p>Loading properties...</p>;
  }

  return (
    <div>
      <h2>Property List</h2>
      {properties.map((property) => (
        <div key={property.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <p><strong>ID:</strong> {property.id}</p>
          <p><strong>Name:</strong> {property.name}</p>
          <p><strong>Address:</strong> {property.address}</p>
          <p><strong>WiFi Name:</strong> {property.accessCodes.wifi.name}</p>
          <p><strong>WiFi Password:</strong> {property.accessCodes.wifi.password}</p>
          <p><strong>Door Code:</strong> {property.accessCodes.door}</p>
        </div>
      ))}
    </div>
  );
};

export default PropertyDetails;
