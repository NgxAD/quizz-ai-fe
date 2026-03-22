'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import questionApi, { Question } from '@/api/question.api';
import { useRouter } from 'next/navigation';

export default function QuestionsListPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionApi.list();
      setQuestions(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách câu hỏi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa câu hỏi này?')) return;

    try {
      setDeleting(id);
      await questionApi.delete(id);
      setQuestions(questions.filter(q => q._id !== id));
    } catch (error) {
      console.error('Lỗi khi xóa câu hỏi:', error);
      alert('Không thể xóa câu hỏi');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/teacher/questions/edit/${id}`);
  };

  const getQuestionTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'Trắc nghiệm',
      'TRUE_FALSE': 'Đúng/Sai',
      'SHORT_ANSWER': 'Tự luận'
    };
    return types[type] || type;
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Ngân hàng câu hỏi</h1>
          <Link href="/teacher/questions/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            + Tạo câu hỏi mới
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-center">Đang tải câu hỏi...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-center">Chưa có câu hỏi nào. Hãy tạo câu hỏi mới!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nội dung</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Loại câu hỏi</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Đáp án</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tạo lúc</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {questions.map((question) => (
                    <tr key={question._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="line-clamp-2 max-w-xs">{question.content}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getQuestionTypeLabel(question.type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {question.correctAnswer}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(question._id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(question._id)}
                            disabled={deleting === question._id}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50"
                          >
                            {deleting === question._id ? 'Xóa...' : 'Xóa'}
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
          Tổng cộng: <strong>{questions.length}</strong> câu hỏi
        </div>
      </div>
    </TeacherLayout>
  );
}
