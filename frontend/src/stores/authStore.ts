import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  role: 'user' | 'admin';
  status: string;
  created_at: string;
}

interface Subscription {
  id: number;
  plan: { name: string; slug: string };
  status: string;
  token_quota: number;
  token_used: number;
  remaining_tokens: number;
  usage_percentage: number;
  starts_at: string;
  expires_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<string>;
  handleGoogleCallback: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      subscription: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, token } = res.data;
          localStorage.setItem('auth_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          await get().fetchSubscription();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', {
            name,
            email,
            password,
            password_confirmation: password,
          });
          const { user, token, subscription } = res.data;
          localStorage.setItem('auth_token', token);
          set({ user, token, subscription, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithGoogle: async () => {
        const res = await api.post('/auth/google');
        return res.data.url;
      },

      handleGoogleCallback: async (code) => {
        set({ isLoading: true });
        try {
          const res = await api.get(`/auth/google/callback?code=${code}`);
          const { user, token, subscription } = res.data;
          localStorage.setItem('auth_token', token);
          set({ user, token, subscription, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // ignore
        }
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, subscription: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        try {
          const res = await api.get('/user');
          set({ user: res.data.data });
        } catch {
          // ignore
        }
      },

      fetchSubscription: async () => {
        try {
          const res = await api.get('/user/subscription');
          set({ subscription: res.data.data });
        } catch {
          // ignore
        }
      },

      setAuth: (user, token) => {
        localStorage.setItem('auth_token', token);
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, subscription: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
