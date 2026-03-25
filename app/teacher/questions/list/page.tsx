'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import { useEffect, useState } from 'react';
import questionBankApi, { QuestionBank } from '@/api/question-bank.api';
import { useRouter } from 'next/navigation';

export default function QuestionsListPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingBankName, setEditingBankName] = useState('');
  const [updatingBankId, setUpdatingBankId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [creatingBank, setCreatingBank] = useState(false);
  const [createError, setCreateError] = useState('');
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
    const bank = banks.find(b => b._id === id);
    if (bank) {
      setEditingBankId(id);
      setEditingBankName(bank.name);
      setShowEditModal(true);
    }
  };

  const handleSaveBankName = async () => {
    if (!editingBankId || !editingBankName.trim()) return;
    try {
      setUpdatingBankId(editingBankId);
      await questionBankApi.update(editingBankId, { name: editingBankName });
      // Update local state
      setBanks(banks.map(b => 
        b._id === editingBankId ? { ...b, name: editingBankName } : b
      ));
      setShowEditModal(false);
      setEditingBankId(null);
      setEditingBankName('');
    } catch (error) {
      console.error('Lỗi khi cập nhật tên ngân hàng:', error);
      alert('Không thể cập nhật tên ngân hàng');
    } finally {
      setUpdatingBankId(null);
    }
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingBankId(null);
    setEditingBankName('');
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newBankName.trim()) {
      setCreateError('Tên ngân hàng không được để trống');
      return;
    }

    if (newBankName.trim().length > 255) {
      setCreateError('Tên ngân hàng không vượt quá 255 ký tự');
      return;
    }

    try {
      setCreatingBank(true);
      const response = await questionBankApi.create({
        name: newBankName.trim(),
      });
      setBanks([...banks, response.data]);
      setShowCreateModal(false);
      setNewBankName('');
    } catch (error) {
      console.error('Lỗi khi tạo ngân hàng câu hỏi:', error);
      setCreateError('Không thể tạo ngân hàng câu hỏi. Vui lòng thử lại.');
    } finally {
      setCreatingBank(false);
    }
  };

  const cancelCreate = () => {
    setShowCreateModal(false);
    setNewBankName('');
    setCreateError('');
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Ngân hàng câu hỏi</h1>
          <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            + Tạo ngân hàng câu hỏi
          </button>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {banks.map((bank) => (
              <div
                key={bank._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6"
                onClick={() => handleView(bank._id)}
              >
                <div className="flex items-stretch justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-4">{bank.name}</h3>
                    <p className="text-sm text-gray-600">
                      {bank.totalQuestions} câu hỏi
                    </p>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(bank._id)}
                      className="p-2 hover:bg-gray-200 rounded transition text-gray-600 hover:text-gray-800"
                      title="Sửa"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                        <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(bank._id)}
                      disabled={deleting === bank._id}
                      className="p-2 hover:bg-red-100 rounded transition text-gray-600 hover:text-red-600 disabled:opacity-50"
                      title="Xóa"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

        {/* Edit Modal */}
        {showEditModal && editingBankId && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sửa tên ngân hàng câu hỏi</h2>
              <input
                type="text"
                value={editingBankName}
                onChange={(e) => setEditingBankName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black mb-6"
                placeholder="Nhập tên ngân hàng câu hỏi"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelEdit}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveBankName}
                  disabled={updatingBankId === editingBankId}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {updatingBankId === editingBankId ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tạo ngân hàng câu hỏi mới</h2>
              
              {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateBank} className="space-y-4">
                <div>
                  <label htmlFor="create-name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Tên ngân hàng <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="create-name"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="Nhập tên ngân hàng câu hỏi"
                    maxLength={255}
                    disabled={creatingBank}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newBankName.length}/255 ký tự
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={cancelCreate}
                    disabled={creatingBank}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBank}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {creatingBank ? 'Đang tạo...' : 'Tạo ngân hàng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
