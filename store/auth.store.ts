import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'teacher' | 'student' | 'admin';
  avatar?: string;
  isTeacherApproved?: boolean;
  dateOfBirth?: string;
  phoneNumber?: string;
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
          Cookies.set('user', JSON.stringify(user), { expires: 1 });
          set({ user, isLoggedIn: true });
        } else {
          Cookies.remove('user');
          set({ user: null, isLoggedIn: false });
        }
      },

      setToken: (token) => {
        if (token) {
          Cookies.set('accessToken', token, { expires: 1 });
        } else {
          Cookies.remove('accessToken');
        }
        set({ token });
      },

      login: (user, token) => {
        Cookies.set('accessToken', token, { expires: 1 });
        Cookies.set('user', JSON.stringify(user), { expires: 1 });
        set({ user, token, isLoggedIn: true });
      },

      logout: () => {
        Cookies.remove('accessToken');
        Cookies.remove('user');
        set({ user: null, token: null, isLoggedIn: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      updateUser: (user) => {
        Cookies.set('user', JSON.stringify(user), { expires: 1 });
        set({ user });
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
