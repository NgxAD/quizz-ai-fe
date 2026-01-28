'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import classApi from '@/api/class.api';

interface ClassData {
  _id: string;
  name: string;
  description?: string;
  code: string;
  studentCount: number;
}

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams() as any;
  const classId = params?.id as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClass();
  }, [classId]);

  const loadClass = async () => {
    try {
      setLoading(true);
      const response = await classApi.getById(classId);
      const data = response.data;
      setClassData(data);
      setName(data.name);
      setDescription(data.description || '');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu lớp');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClass = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp');
      return;
    }

    setLoading(true);
    try {
      await classApi.update(classId, {
        name: name.trim(),
        description: description.trim(),
      });
      router.push('/teacher/classes/list');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật lớp');
    } finally {
      setLoading(false);
    }
  };

  if (!classData && loading) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </TeacherLayout>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Chỉnh sửa lớp</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Mã lớp
              </label>
              <input
                type="text"
                value={classData?.code || ''}
                disabled
                className="w-full border rounded-lg p-3 text-gray-600 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-2">Mã lớp không thể thay đổi. Chia sẻ mã này với học sinh để họ tham gia.</p>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Tên lớp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên lớp"
                className="w-full border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả lớp học"
                rows={4}
                className="w-full border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Số học sinh: <span className="font-semibold">{classData?.studentCount || 0}</span>
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateClass}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
