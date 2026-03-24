'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import questionBankApi, { QuestionBank } from '@/api/question-bank.api';

export default function BankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = (params?.id as string) || '';

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteQuestionId, setPendingDeleteQuestionId] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchBank();
  }, [bankId]);

  const fetchBank = async () => {
    try {
      setLoading(true);
      const response = await questionBankApi.getById(bankId);
      setBank(response.data);
    } catch (error) {
      console.error('Lỗi khi tải ngân hàng câu hỏi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setPendingDeleteQuestionId(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await questionBankApi.delete(bankId);
      router.push('/teacher/questions/list');
    } catch (error) {
      console.error('Lỗi khi xóa ngân hàng:', error);
      alert('Không thể xóa ngân hàng câu hỏi');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setPendingDeleteQuestionId(questionId);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!pendingDeleteQuestionId || !bank) return;
    try {
      setDeletingQuestion(true);
      await questionBankApi.removeQuestion(bankId, pendingDeleteQuestionId);
      
      // Update local state
      const updatedQuestions = (bank.questions as any[]).filter(
        (q) => q._id !== pendingDeleteQuestionId
      );
      setBank({
        ...bank,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
      });
      
      setShowDeleteModal(false);
      setPendingDeleteQuestionId(null);
    } catch (error) {
      console.error('Lỗi khi xóa câu hỏi:', error);
      alert('Không thể xóa câu hỏi khỏi ngân hàng');
    } finally {
      setDeletingQuestion(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPendingDeleteQuestionId(null);
  };

  const handleEdit = () => {
    router.push(`/teacher/questions/banks/${bankId}/edit`);
  };

  const handleViewQuestion = (question: any) => {
    setSelectedQuestion(question);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedQuestion(null);
  };

  const getQuestionTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'Trắc nghiệm',
      'TRUE_FALSE': 'Đúng/Sai',
      'SHORT_ANSWER': 'Tự luận'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-center">Đang tải ngân hàng câu hỏi...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (!bank) {
    return (
      <TeacherLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-center">Không tìm thấy ngân hàng câu hỏi</p>
          <div className="text-center mt-4">
            <Link href="/teacher/questions/list" className="text-blue-600 hover:underline">
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{bank.name}</h1>
              {bank.description && (
                <p className="text-gray-600 mt-2">{bank.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-4">
                Tạo lúc: {new Date(bank.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/teacher/questions/banks/${bankId}/create-question`}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                + Tạo câu hỏi mới
              </Link>
              <button
                onClick={handleEdit}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Sửa
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Câu hỏi trong ngân hàng ({bank.totalQuestions})
            </h2>
            <Link
              href={`/teacher/questions/banks/${bankId}/add-questions`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              + Thêm câu hỏi
            </Link>
          </div>

          {bank.totalQuestions === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Chưa có câu hỏi nào trong ngân hàng này. Hãy thêm câu hỏi!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nội dung</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Đáp án</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(bank.questions as any[]).map((question) => (
                    <tr key={question._id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => handleViewQuestion(question)}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="line-clamp-1 max-w-xs">{question.content}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {question.correctAnswer}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteQuestion(question._id)}
                          disabled={deletingQuestion}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50"
                        >
                          {deletingQuestion && pendingDeleteQuestionId === question._id ? 'Xóa...' : 'Xóa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedQuestion && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedQuestion.content}</h2>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Đáp án:</h3>
                <div className="space-y-3">
                  {selectedQuestion.options?.map((option: any, index: number) => {
                    const isCorrect = option.isCorrect;
                    const answerLabel = String.fromCharCode(65 + index);
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
                          isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <span className={`font-bold text-lg min-w-fit px-3 py-1 rounded ${
                          isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {answerLabel}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-900">{option.text}</p>
                          {isCorrect && (
                            <p className="text-green-600 text-sm font-semibold mt-1">Đáp án đúng</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {pendingDeleteQuestionId ? 'Xóa câu hỏi' : 'Xóa ngân hàng câu hỏi'}
              </h2>
              <p className="text-gray-600 mb-6">
                {pendingDeleteQuestionId
                  ? 'Bạn chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?'
                  : `Bạn chắc chắn muốn xóa ngân hàng "${bank?.name}"? Các câu hỏi trong ngân hàng sau khi xóa sẽ bị xóa khỏi ngân hàng.`}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  disabled={deleting || deletingQuestion}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Hủy
                </button>
              <button
                  onClick={pendingDeleteQuestionId ? confirmDeleteQuestion : confirmDelete}
                  disabled={deleting || deletingQuestion}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting || deletingQuestion ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
