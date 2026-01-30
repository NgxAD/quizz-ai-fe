'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import authApi from '@/api/auth.api';
import StudentLayout from '@/layouts/StudentLayout';

export default function RegisterTeacher() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await authApi.updateRole('teacher');
      
      if (response.data.user && response.data.access_token) {
        const updatedUser = {
          ...response.data.user,
          role: (response.data.user.role as any)?.toLowerCase() || 'teacher' as const,
        };
        updateUser(updatedUser);
      }

      alert('Đăng ký làm giáo viên thành công');
      setTimeout(() => {
        router.push('/teacher/dashboard');
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi đăng ký làm giáo viên');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Đăng ký làm Giáo viên</h1>
          <p className="text-gray-600 mb-6">Xác nhận đăng ký để trở thành giáo viên</p>

          {/* Warning Box */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Lưu ý: Sau khi đăng ký, bạn sẽ có quyền giáo viên trên hệ thống.
                </p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin tài khoản</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tên:</span>
                <span className="font-medium text-gray-800">{user?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-800">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quyền hiện tại:</span>
                <span className="font-medium text-green-600">Học sinh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quyền sau khi xác nhận:</span>
                <span className="font-medium text-blue-600">Giáo viên</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition duration-200 disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
