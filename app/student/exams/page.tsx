'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/layouts/StudentLayout';
import classApi from '@/api/class.api';

interface Class {
  _id: string;
  name: string;
  description?: string;
  code: string;
  studentCount: number;
}

export default function StudentExamsPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await classApi.list();
      setClasses(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách lớp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Các lớp của tôi</h1>
          <button
            onClick={() => router.push('/student/join-class')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + Tham gia lớp
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-gray-600 text-lg mb-4">Bạn chưa tham gia lớp nào</p>
            <button
              onClick={() => router.push('/student/join-class')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Tham gia lớp ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div
                key={classItem._id}
                onClick={() => router.push(`/student/classes/${classItem._id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden cursor-pointer"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                  <h3 className="text-xl font-bold">{classItem.name}</h3>
                  <p className="text-blue-100 text-sm">Mã: {classItem.code}</p>
                </div>
                <div className="p-4">
                  {classItem.description && (
                    <p className="text-gray-600 text-sm mb-3">{classItem.description}</p>
                  )}
                  <p className="text-gray-500 text-sm">
                    👥 {classItem.studentCount} học sinh
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

