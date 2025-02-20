import { useAuthStore } from '../stores/authStore';

export const useCurrentUser = () => {
  const { user, isLoading, error } = useAuthStore();
  return { user, isLoading, error };
};
