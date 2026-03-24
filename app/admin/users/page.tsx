'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/layouts/AdminLayout';
import usersApi from '@/api/users.api';

interface User {
  _id: string;
  email: string;
  fullName: string;
  roles: ('student' | 'teacher' | 'admin')[];
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
      roles: user.roles || [],
    });
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      const updatePayload = {
        fullName: editData.fullName,
        roles: editData.roles,
      };
      await usersApi.updateUser(userId, updatePayload);
      setEditingId(null);
      loadUsers();
      alert('Cập nhật người dùng thành công');
    } catch (err: any) {
      alert('Lỗi khi cập nhật người dùng: ' + err.response?.data?.message || err.message);
      console.error(err);
    }
  };

  // Get display roles - prioritize teacher over student, admin over all
  const getDisplayRoles = (roles: string[]) => {
    if (roles?.includes('admin')) return ['admin'];
    if (roles?.includes('teacher')) return ['teacher'];
    return ['student'];
  };

  const handleDeleteClick = async (userId: string) => {
    setPendingDeleteId(userId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await usersApi.deleteUser(pendingDeleteId);
      loadUsers();
      alert('Xóa người dùng thành công');
      setShowDeleteModal(false);
      setPendingDeleteId(null);
    } catch (err: any) {
      alert('Lỗi khi xóa người dùng');
      console.error(err);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPendingDeleteId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    const currentRoles = editData.roles || [];
    if (checked) {
      setEditData({
        ...editData,
        roles: [...currentRoles, role],
      });
    } else {
      setEditData({
        ...editData,
        roles: currentRoles.filter((r: string) => r !== role),
      });
    }
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
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editData.roles?.includes('admin') || false}
                              onChange={(e) => handleRoleChange('admin', e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">Admin</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editData.roles?.includes('teacher') || false}
                              onChange={(e) => handleRoleChange('teacher', e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">Giáo viên</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editData.roles?.includes('student') || false}
                              onChange={(e) => handleRoleChange('student', e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">Học sinh</span>
                          </label>
                        </div>
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
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {getDisplayRoles(user.roles).map((role) => (
                            <span
                              key={role}
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : role === 'teacher'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {role === 'admin' ? 'Admin' : role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                            </span>
                          ))}
                        </div>
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

      {/* Delete Modal */}
      {showDeleteModal && pendingDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Xóa người dùng</h2>
            <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa người dùng này?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
