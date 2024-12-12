import { useState, useEffect } from 'react';
import { conversationService } from '../services';
import type { Conversation } from '../types';

export const useConversations = (propertyId: string, guestEmail: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!propertyId || !guestEmail) {
        setError('Property ID or guest email is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await conversationService.fetchConversations(propertyId, guestEmail);
        setConversations(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [propertyId, guestEmail]);

  return { conversations, isLoading, error };
};

export default useConversations;
