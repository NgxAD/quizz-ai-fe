'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/layouts/AdminLayout';
import usersApi from '@/api/users.api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getStats();
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Admin</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Tổng Người dùng</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalUsers || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Admin</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.adminCount || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Giáo viên</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.teacherCount || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Học sinh</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats?.studentCount || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Người dùng Hoạt động</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats?.activeUsers || 0}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quản lý</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/users"
              className="block p-4 border border-gray-300 rounded-lg hover:bg-blue-50 transition"
            >
              <h3 className="font-semibold text-gray-800">Quản lý Người dùng</h3>
              <p className="text-sm text-gray-600 mt-1">Sửa, xóa và cập nhật thông tin người dùng</p>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
