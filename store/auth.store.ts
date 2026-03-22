import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { clearAuthHeaders } from '@/api/axiosClient';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  roles: ('teacher' | 'student' | 'admin')[];
  avatar?: string;
  isTeacherApproved?: boolean;
  dateOfBirth?: string;
  gender?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isLoggedIn: false,

      setUser: (user) => {
        if (user) {
          Cookies.set('user', JSON.stringify(user), { expires: 7, path: '/' });
          set({ user, isLoggedIn: true });
        } else {
          Cookies.remove('user', { path: '/' });
          set({ user: null, isLoggedIn: false });
        }
      },

      setToken: (token) => {
        if (token) {
          Cookies.set('accessToken', token, { expires: 7, path: '/' });
        } else {
          Cookies.remove('accessToken', { path: '/' });
        }
        set({ token });
      },

      login: (user, token) => {
        // Clear any old data first
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-store');
        }
        // Then set new data
        Cookies.set('accessToken', token, { expires: 7, path: '/' });
        Cookies.set('user', JSON.stringify(user), { expires: 7, path: '/' });
        set({ user, token, isLoggedIn: true });
      },

      logout: () => {
        clearAuthHeaders();
        // Clear localStorage FIRST before setting state (persist middleware auto-saves on set)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-store');
        }
        // Then clear all auth data
        set({ user: null, token: null, isLoggedIn: false });
        // Finally clear cookies
        Cookies.remove('accessToken', { path: '/' });
        Cookies.remove('user', { path: '/' });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      updateUser: (user) => {
        // Ensure user data is properly saved to both cookie and store
        if (user) {
          Cookies.set('user', JSON.stringify(user), { expires: 7, path: '/' });
          set({ user, isLoggedIn: true });
        } else {
          Cookies.remove('user', { path: '/' });
          set({ user: null, isLoggedIn: false });
        }
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
