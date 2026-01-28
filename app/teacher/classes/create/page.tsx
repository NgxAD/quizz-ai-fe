'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import classApi from '@/api/class.api';

export default function CreateClassPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateClass = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp');
      return;
    }

    setLoading(true);
    try {
      await classApi.create({
        name: name.trim(),
        description: description.trim(),
      });
      router.push('/teacher/classes/list');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tạo lớp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 font-semibold mb-6"
        >
          ← Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Tạo lớp mới</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Tên lớp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên lớp (ví dụ: Lớp 10A)"
                className="w-full border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Mô tả (tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả lớp học"
                rows={4}
                className="w-full border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateClass}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Đang tạo...' : 'Tạo lớp'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
