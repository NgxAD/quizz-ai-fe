import axiosClient from './axiosClient';

interface User {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  isActive: boolean;
}

const usersApi = {
  listUsers: () =>
    axiosClient.get<any>('/users'),

  getStats: () =>
    axiosClient.get<any>('/users/stats'),

  updateUser: (userId: string, data: any) =>
    axiosClient.put(`/users/${userId}`, data),

  deleteUser: (userId: string) =>
    axiosClient.delete(`/users/${userId}`),
};

export default usersApi;
