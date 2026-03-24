'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import authApi from '@/api/auth.api';
import AdminLayout from '@/layouts/AdminLayout';
import Link from 'next/link';

export default function AdminProfile() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    dateOfBirth: user?.dateOfBirth || '',
    email: user?.email || '',
    gender: user?.gender || 'male',
  });

  // Load profile data from user store
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        dateOfBirth: user.dateOfBirth || '',
        email: user.email || '',
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
      if (file.size > 2 * 1024 * 1024) {
        alert('Tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Compress image by resizing
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimension 800px
          if (width > height) {
            if (width > 800) {
              height *= 800 / width;
              width = 800;
            }
          } else {
            if (height > 800) {
              width *= 800 / height;
              height = 800;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to base64 with lower quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setAvatarPreview(compressedDataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Kiểm tra validation
      if (!formData.fullName.trim()) {
        alert('Vui lòng nhập họ và tên');
        setLoading(false);
        return;
      }

      if (!formData.dateOfBirth) {
        alert('Vui lòng chọn ngày sinh');
        setLoading(false);
        return;
      }

      // Chuẩn bị dữ liệu - CHỈ gửi những trường được thay đổi
      const profileData: any = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      };

      // Chỉ gửi avatar nếu nó được thay đổi (không phải giá trị ban đầu)
      if (avatarPreview && avatarPreview !== user?.avatar) {
        console.log('📸 Avatar changed, including in update');
        profileData.avatar = avatarPreview;
      } else {
        console.log('📸 Avatar unchanged, skipping');
      }

      console.log('📤 Sending profile update:', profileData);
      console.log('📊 Payload size:', JSON.stringify(profileData).length, 'bytes');

      // Call backend API to update profile
      const response = await authApi.updateProfile(profileData);
      
      // Log the response to debug
      console.log('✅ Update profile response:', response.data);
      
      // Update local state with response data (this will persist via zustand)
      if (response.data?.user) {
        console.log('💾 Updating store with response user:', response.data.user);
        updateUser(response.data.user);
        
        // Verify data was saved by fetching current user
        try {
          console.log('🔍 Verifying data with /auth/me...');
          const meResponse = await authApi.getCurrentUser();
          console.log('✔️ Server verification:', meResponse.data?.user);
          if (meResponse.data?.user) {
            console.log('📌 Final store update with verified data');
            // Ensure latest data is in store
            updateUser(meResponse.data.user);
          }
        } catch (meError) {
          console.warn('⚠️ Could not verify user data:', meError);
        }
      } else {
        throw new Error('No user data in response');
      }

      alert('✅ Cập nhật hồ sơ thành công');
    } catch (error: any) {
      console.error('❌ Lỗi cập nhật hồ sơ:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi không xác định';
      alert(`❌ Lỗi: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2 font-semibold"
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
                className="w-24 h-24 rounded-full border-4 border-gray-500 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-400 text-white flex items-center justify-center text-3xl font-bold">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-black"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-black"
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

          {/* Row 3: Giới tính */}
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

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </AdminLayout>
  );
}
