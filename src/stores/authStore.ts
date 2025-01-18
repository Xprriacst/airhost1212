import { create } from 'zustand';
import { AuthState, LoginCredentials, RegisterCredentials } from '../types';
import { AuthService } from '../services/auth/authService';

export const useAuthStore = create<
  AuthState & {
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => void;
  }
>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.login(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.register(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
