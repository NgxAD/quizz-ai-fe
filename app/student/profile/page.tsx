'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import authApi from '@/api/auth.api';
import StudentLayout from '@/layouts/StudentLayout';
import Link from 'next/link';

export default function StudentProfile() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    dateOfBirth: user?.dateOfBirth || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    gender: user?.gender || 'male',
  });

  // Load profile data from user store
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        dateOfBirth: user.dateOfBirth || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || 'male',
      });
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Prepare profile data to send to backend
      const profileData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        avatar: avatarPreview,
      };

      // Call backend API to update profile
      const response = await authApi.updateProfile(profileData);
      
      // Update local state with response data (this will persist via zustand)
      if (response.data.user) {
        updateUser(response.data.user);
      }

      alert('Cập nhật hồ sơ thành công');
    } catch (error: any) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      alert(error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2 font-semibold"
        >
          ← Quay lại
        </button>

        {/* Avatar Section */}
        <div className="mb-8 flex items-start gap-6">
          <div className="flex flex-col items-center">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="mt-4 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 font-semibold text-gray-700 text-sm">
              Tải lên
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Tải lên file ảnh và kích thước tối đa 5MB
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Row 1: Họ và tên */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Họ và tên
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Nhập họ và tên"
            />
          </div>

          {/* Row 2: Ngày sinh - Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Ngày sinh
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              {!formData.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">Vui lòng nhập ngày sinh</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Row 3: Số điện thoại - Giới tính */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Nhập số điện thoại..."
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Giới tính
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleInputChange}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-gray-700">Nam</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleInputChange}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-gray-700">Nữ</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </StudentLayout>
  );
}
