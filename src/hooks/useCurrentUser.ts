import { useState, useEffect } from 'react';
import { User } from '../types/auth';

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Récupérer l'utilisateur depuis le localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get current user');
        console.error('Error getting current user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  return { user, isLoading, error };
};
