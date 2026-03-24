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
                {filteredClasses.map((cls) => (
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
