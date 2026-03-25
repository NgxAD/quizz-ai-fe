'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import classApi from '@/api/class.api';
import { useAuthStore } from '@/store/auth.store';

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
  const { isLoggedIn, user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Refetch when user logs in or role changes
  useEffect(() => {
    if (isLoggedIn) {
      loadClasses();
    }
  }, [isLoggedIn, user?._id]);

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
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteClass = async () => {
    if (!pendingDeleteId) return;
    try {
      await classApi.delete(pendingDeleteId);
      loadClasses();
      setOpenMenuId(null);
      setShowDeleteModal(false);
      setPendingDeleteId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi xóa lớp');
    }
  };

  const cancelDeleteClass = () => {
    setShowDeleteModal(false);
    setPendingDeleteId(null);
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm tên lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
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
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            Không tìm thấy lớp nào phù hợp
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredClasses.map((cls) => (
              <div
                key={cls._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => router.push(`/teacher/classes/${cls._id}/members`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === cls._id ? null : cls._id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition text-gray-700 font-bold text-lg"
                        title="Thêm tùy chọn"
                      >
                        ⋮
                      </button>

                      {openMenuId === cls._id && (
                        <div className="absolute right-0 top-8 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/teacher/classes/${cls._id}/edit`);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-black border-b"
                          >
                            Sửa lớp
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClass(cls._id);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                          >
                            Xóa lớp
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        Mã lớp:
                      </p>
                      <p className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-gray-700">
                        {cls.code}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        Sĩ số:
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {cls.studentCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && pendingDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Xóa lớp</h2>
            <p className="text-gray-600 mb-6">Bạn chắc chắn muốn xóa lớp này?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteClass}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteClass}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
