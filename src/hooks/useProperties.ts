import { useState, useEffect } from 'react';
import { propertyService } from '../services';
import type { Property } from '../types';

export const useProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await propertyService.getProperties();
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties');
        console.error('Error fetching properties:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return { properties, isLoading, error };
};