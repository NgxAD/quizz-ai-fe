'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import questionApi, { Question } from '@/api/question.api';
import questionBankApi, { QuestionBank } from '@/api/question-bank.api';

export default function AddQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = (params?.id as string) || '';

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [bankId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bankRes, questionsRes] = await Promise.all([
        questionBankApi.getById(bankId),
        questionApi.list(),
      ]);
      setBank(bankRes.data);
      
      // Filter out questions already in the bank
      const existingQuestionIds = new Set(bankRes.data.questions);
      const availableQuestions = questionsRes.data.filter(q => !existingQuestionIds.has(q._id));
      setQuestions(availableQuestions);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleAddQuestions = async () => {
    if (selectedQuestions.size === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi');
      return;
    }

    try {
      setSaving(true);
      await Promise.all(
        Array.from(selectedQuestions).map(qId =>
          questionBankApi.addQuestion(bankId, qId)
        )
      );
      router.push(`/teacher/questions/banks/${bankId}`);
    } catch (error) {
      console.error('Lỗi khi thêm câu hỏi:', error);
      alert('Không thể thêm câu hỏi. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const getQuestionTypeLabel = (type?: string) => {
    const types: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'Trắc nghiệm',
      'TRUE_FALSE': 'Đúng/Sai',
      'SHORT_ANSWER': 'Tự luận',
      'multiple_choice': 'Trắc nghiệm',
      'true_false': 'Đúng/Sai',
      'short_answer': 'Tự luận',
      'multiple-choice': 'Trắc nghiệm',
    };
    return type ? (types[type] || type) : 'Không xác định';
  };

  const filteredQuestions = questions.filter(q =>
    q.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <TeacherLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-center">Đang tải dữ liệu...</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thêm câu hỏi vào ngân hàng
          </h1>
          {bank && (
            <p className="text-gray-600">
              Ngân hàng: <strong>{bank.name}</strong>
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {filteredQuestions.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              {questions.length === 0
                ? 'Không có câu hỏi nào khả dụng'
                : 'Không tìm thấy câu hỏi phù hợp'}
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredQuestions.map((question) => (
                <div
                  key={question._id}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition"
                >
                  <input
                    type="checkbox"
                    id={`question-${question._id}`}
                    checked={selectedQuestions.has(question._id)}
                    onChange={() => handleToggleQuestion(question._id)}
                    className="mt-1 w-5 h-5 text-blue-600 cursor-pointer"
                  />
                  <label
                    htmlFor={`question-${question._id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="text-sm text-gray-900 font-semibold line-clamp-2">
                      {question.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Loại: {getQuestionTypeLabel(question.type)}{' '}
                      | Tạo lúc: {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleAddQuestions}
            disabled={saving || selectedQuestions.size === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving
              ? 'Đang thêm...'
              : `Thêm ${selectedQuestions.size} câu hỏi`}
          </button>
        </div>
      </div>
    </TeacherLayout>
  );
}
