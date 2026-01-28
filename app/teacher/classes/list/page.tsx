'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import classApi from '@/api/class.api';

interface Class {
  _id: string;
  name: string;
  description?: string;
  code: string;
  studentCount: number;
  createdAt: string;
}

export default function ClassListPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleDeleteClass = async (id: string) => {
    if (confirm('Bạn chắc chắn muốn xóa lớp này?')) {
      try {
        await classApi.delete(id);
        loadClasses();
        setOpenMenuId(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Lỗi khi xóa lớp');
      }
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách lớp</h1>
          <button
            onClick={() => router.push('/teacher/classes/create')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Tạo lớp mới
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
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            Chưa có lớp nào
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-visible">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Tên lớp</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Mã lớp</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Số học sinh</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Ngày tạo</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr 
                    key={cls._id} 
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => router.push(`/teacher/classes/${cls._id}/members`)}
                  >
                    <td className="p-4 font-semibold text-gray-900">{cls.name}</td>
                    <td className="p-4 text-gray-600">
                      <span className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                        {cls.code}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{cls.studentCount}</td>
                    <td className="p-4 text-gray-600">
                      {new Date(cls.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative" ref={openMenuId === cls._id ? menuRef : null}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === cls._id ? null : cls._id)}
                          className="p-2 hover:bg-gray-300 rounded transition text-gray-700 font-bold text-lg"
                          title="Thêm tùy chọn"
                        >
                          ⋮
                        </button>

                        {openMenuId === cls._id && (
                          <div className="absolute right-0 top-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                            <button
                              onClick={() => {
                                router.push(`/teacher/classes/${cls._id}/edit`);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-black border-b"
                            >
                              Sửa lớp
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls._id)}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                            >
                              Xóa lớp
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
