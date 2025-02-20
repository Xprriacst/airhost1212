import { useState, useEffect } from 'react';
import { propertyService } from '../services';
import type { Property } from '../types';
import { useCurrentUser } from './useCurrentUser';

export const useProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useCurrentUser();

  const fetchProperties = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await propertyService.fetchAllProperties(user.id);
      console.log('[DEBUG] Propriétés rechargées:', data);
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties');
      console.error('Error fetching properties:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user?.id]);

  return { properties, isLoading, error, refetch: fetchProperties };
};