'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import authApi from '@/api/auth.api';
import TeacherLayout from '@/layouts/TeacherLayout';

export default function TeacherDowngradePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleConfirmDowngrade = async () => {
    setLoading(true);
    try {
      // Call API to downgrade from teacher to student
      const response = await authApi.downgradeTeacher();
      
      if (response.data.user && response.data.access_token) {
        const updatedUser = {
          ...response.data.user,
          role: 'student' as const,
          isTeacherApproved: false,
        };
        updateUser(updatedUser);
      }

      alert('Bỏ quyền giáo viên thành công');
      // Redirect to student exams page
      setTimeout(() => {
        router.push('/student/exams');
      }, 100);
    } catch (error: any) {
      console.error('Lỗi khi bỏ quyền giáo viên:', error);
      alert(error.response?.data?.message || 'Lỗi khi bỏ quyền giáo viên');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <TeacherLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bỏ quyền Giáo viên</h1>
          <p className="text-gray-600 mb-6">Xác nhận bỏ quyền giáo viên</p>

          {/* Warning Box */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Lưu ý: Khi bỏ quyền giáo viên, bạn sẽ chỉ còn quyền học sinh. Bạn sẽ cần đăng ký lại để trở thành giáo viên.
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
                <span className="font-medium text-blue-600">Giáo viên</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quyền sau khi xác nhận:</span>
                <span className="font-medium text-green-600">Học sinh</span>
              </div>
            </div>
          </div>

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
              onClick={handleConfirmDowngrade}
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận bỏ quyền'}
            </button>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
