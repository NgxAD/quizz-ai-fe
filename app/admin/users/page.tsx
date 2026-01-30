'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/layouts/AdminLayout';
import usersApi from '@/api/users.api';

interface User {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.listUsers();
      console.log('Users response:', response.data);
      setUsers(response.data || []);
    } catch (err: any) {
      setError('Lỗi khi tải danh sách người dùng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingId(user._id);
    setEditData({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      await usersApi.updateUser(userId, editData);
      setEditingId(null);
      loadUsers();
      alert('Cập nhật người dùng thành công');
    } catch (err: any) {
      alert('Lỗi khi cập nhật người dùng');
      console.error(err);
    }
  };

  const handleDeleteClick = async (userId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        await usersApi.deleteUser(userId);
        loadUsers();
        alert('Xóa người dùng thành công');
      } catch (err: any) {
        alert('Lỗi khi xóa người dùng');
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <p>Đang tải...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Người dùng</h1>
          <p className="text-gray-600 mt-2">Tổng cộng: {users.length} người dùng</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tên</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Số điện thoại</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Quyền</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  {editingId === user._id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editData.fullName}
                          onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editData.phoneNumber || ''}
                          onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editData.role}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded text-black"
                        >
                          <option value="student">Học sinh</option>
                          <option value="teacher">Giáo viên</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editData.isActive ? 'true' : 'false'}
                          onChange={(e) => setEditData({ ...editData, isActive: e.target.value === 'true' })}
                          className="px-3 py-2 border border-gray-300 rounded text-black"
                        >
                          <option value="true">Hoạt động</option>
                          <option value="false">Bị khóa</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => handleSaveEdit(user._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                        >
                          Hủy
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-gray-800">{user.fullName}</td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-gray-600">{user.phoneNumber || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Xóa
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
