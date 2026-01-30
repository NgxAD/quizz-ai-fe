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

  updateRole: (role: 'student' | 'teacher' | 'admin') =>
    axiosClient.post<AuthResponse>('/auth/update-role', { role }),

  downgradeTeacher: () =>
    axiosClient.post<AuthResponse>('/auth/downgrade-teacher'),

  updateProfile: (payload: any) =>
    axiosClient.patch('/auth/profile', payload),

  logout: () => {
    // Clear token from cookies
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  },
};

export default authApi;
