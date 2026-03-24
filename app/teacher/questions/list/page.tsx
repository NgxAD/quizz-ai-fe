'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import questionBankApi, { QuestionBank } from '@/api/question-bank.api';
import { useRouter } from 'next/navigation';

export default function QuestionsListPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await questionBankApi.list();
      setBanks(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách ngân hàng câu hỏi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      setDeleting(pendingDeleteId);
      await questionBankApi.delete(pendingDeleteId);
      setBanks(banks.filter(b => b._id !== pendingDeleteId));
      setShowDeleteModal(false);
      setPendingDeleteId(null);
    } catch (error) {
      console.error('Lỗi khi xóa ngân hàng câu hỏi:', error);
      alert('Không thể xóa ngân hàng câu hỏi');
    } finally {
      setDeleting(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPendingDeleteId(null);
  };

  const handleView = (id: string) => {
    router.push(`/teacher/questions/banks/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/teacher/questions/banks/${id}/edit`);
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Ngân hàng câu hỏi</h1>
          <Link href="/teacher/questions/create-bank" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            + Tạo ngân hàng câu hỏi
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-center">Đang tải ngân hàng câu hỏi...</p>
          </div>
        ) : banks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-center">Chưa có ngân hàng câu hỏi nào. Hãy tạo ngân hàng mới!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tên ngân hàng</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mô tả</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Số câu hỏi</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tạo lúc</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {banks.map((bank) => (
                    <tr key={bank._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {bank.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="line-clamp-2 max-w-sm">{bank.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {bank.totalQuestions}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(bank.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleView(bank._id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => handleEdit(bank._id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(bank._id)}
                            disabled={deleting === bank._id}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50"
                          >
                            {deleting === bank._id ? 'Xóa...' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          Tổng cộng: <strong>{banks.length}</strong> ngân hàng câu hỏi
        </div>

        {/* Delete Modal */}
        {showDeleteModal && pendingDeleteId && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Xóa ngân hàng câu hỏi</h2>
              <p className="text-gray-600 mb-6">Bạn chắc chắn muốn xóa ngân hàng câu hỏi này?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
