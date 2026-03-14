'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi, { Exam } from '@/api/exam.api';
import classApi from '@/api/class.api';

interface Class {
  _id: string;
  name: string;
  code: string;
}

export default function ExamsListPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await examApi.list('published');
      setExams(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách đề');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classApi.list();
      setClasses(response.data);
    } catch (err: any) {
      console.error('Error loading classes:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn chắc chắn muốn xóa đề này?')) {
      try {
        await examApi.delete(id);
        setExams(exams.filter(exam => exam._id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Lỗi khi xóa đề');
        console.error('Error:', err);
      }
    }
  };



  const handleAssignClick = (examId: string) => {
    setSelectedExamId(examId);
    setSelectedClassId('');
    setShowAssignModal(true);
  };

  const handleAssignToClass = async () => {
    if (!selectedClassId) {
      setError('Vui lòng chọn lớp');
      return;
    }

    setAssignLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedExamId) {
        await classApi.assignExamToClass(selectedClassId, selectedExamId);
        setSuccess('✓ Giao bài tập thành công!');
        setShowAssignModal(false);
        // Redirect to class detail page to verify
        setTimeout(() => {
          router.push(`/teacher/classes/${selectedClassId}/members?tab=exams`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi giao bài tập');
      console.error('Error:', err);
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách đề</h1>
          <Link href="/teacher/exams/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Tạo đề mới
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-visible">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Đang tải...</div>
          ) : exams.length === 0 ? (
            <div className="p-6 text-center text-gray-600">Chưa có đề nào</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-black">Tên đề</th>
                  <th className="text-left p-4 font-semibold text-black">Mô tả</th>
                  <th className="text-left p-4 font-semibold text-black">Thời gian (phút)</th>
                  <th className="text-left p-4 font-semibold text-black">Điểm đạt (%)</th>
                  <th className="text-left p-4 font-semibold text-black">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="p-4">
                      <Link
                        href={`/teacher/exams/${exam._id}`}
                        className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                      >
                        {exam.title}
                      </Link>
                    </td>
                    <td className="p-4 text-black">{exam.description || '-'}</td>
                    <td className="p-4 text-black">{exam.duration || '-'}</td>
                    <td className="p-4 text-black">{exam.passingPercentage || '-'}</td>
                    <td className="p-4 overflow-visible">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === exam._id ? null : exam._id)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-900 text-xl font-bold"
                        >
                          ⋮
                        </button>
                        {openMenuId === exam._id && (
                          <div className="absolute right-0 top-full pt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <Link
                              href={`/teacher/exams/${exam._id}/edit`}
                              className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-t-lg"
                            >
                              Sửa
                            </Link>
                            <button
                              onClick={() => {
                                handleAssignClick(exam._id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-green-600 hover:bg-green-50"
                            >
                              Giao
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(exam._id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Giao bài tập cho lớp</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chọn lớp
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={assignLoading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleAssignToClass}
                  disabled={assignLoading || !selectedClassId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {assignLoading ? 'Đang giao...' : 'Giao'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
