import axiosClient from './axiosClient';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: 'student' | 'teacher' | 'admin';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    _id: string;
    email: string;
    fullName: string;
    role: string;
    avatar?: string;
  };
  access_token: string;
}

const authApi = {
  register: (payload: RegisterPayload) =>
    axiosClient.post<AuthResponse>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    axiosClient.post<AuthResponse>('/auth/login', payload),

  googleLogin: (code: string) =>
    axiosClient.post<AuthResponse>('/auth/google', { code }),

  logout: () => {
    // Clear token from cookies
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  },
};

export default authApi;
